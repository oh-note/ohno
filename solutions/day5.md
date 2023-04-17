# day 5: 编辑操作 & 历史记录（一）

历史记录是编辑器最重要的模块之一，只能编辑而不能撤销无法撑起正常的应用。一般而言，历史记录的实现方法有两种：

- 快照模式：每一次操作，保存相应操作对象和上下文，并在 undo 时直接用快照回复
- 命令模式：每一次操作通过预先定义好的命令实现，每一个命令保证是可逆的，即有 `execute` 和 `undo` 方法，可以发现命令模式其实包含了快照模式，通过定义给命令传递操作前后的快照，即可快速实现一个简单的历史记录模块。

`ohno` 使用命令模式，并通过双队列管理维护 `undo`/`redo` 操作。`History` 的接口如下：

```ts
export class History {
  // 双队列
  commands: LinkedList<Command<any>> = new LinkedList();
  undo_commands: LinkedList<Command<any>> = new LinkedList();

  // 最大历史数
  max_history: number;

  append(command: Command<any>);
  execute(command: Command<any>);

  undo();
  redo();
}
```

随后，`Command` 基类实现为：

```ts
export abstract class Command<P> {
  payload: P;
  history?: History;
  constructor(payload: P) {
    this.payload = payload;
    this.execute = this.ensureContext(this.execute.bind(this));
  }

  protected ensureContext(fn: () => any) {
    const that = this;
    return function () {
      if (that.history) {
        fn();
      } else {
        throw new Error("Command should be emitted into history context");
      }
    };
  }

  abstract execute(): void;
  abstract undo(): void;
  tryMerge(command: Command<any>) {
    return false;
  }
}
```

> 其中，`ensureContext` 装饰器保证了所有在其他位置生成的 `Command` 都必须在 `History` 的上下文中才能执行。

contenteditable 元素可以注册 `input` 和 `beforeinput` 事件，[w3c](https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes) 详细定义了 InputEvent 事件中和编辑操作有关的项，相关的变量主要为 `type`,`data`和 `datatransfer` 三种。里面还定义了哪些编辑操作是在 `beforeinput` 中可以取消的。对于可取消的事件，我们可以对其进行拦截，并自行实现。对不可取消的事件，我们可以在事件发生后手动对该事件的影响用命令模式建模，从而保证可撤销。如果后期自行实现的命令无法保证效率，那么默认可以不拦截事件，而只是对事件进行建模，用于撤销/重做，从而提高正常编辑操作的效率。

为了减少开销，ohno 使用命令模式对每个操作建模而不是建立快照。其中，在记录编辑操作时，因为 `Range` 对 `Node` 元素的引用（相对路径）可能会因为结点被删除而失效，所以 onho 通过之前设计的 `Offset`、`Block` 来定位不会失效的绝对路径。

## insertText

在光标位置插入文本，可以简单的基于 `range.insertNode()` 来实现，通过 `rangeToOffset` 可以记录绝对位置，用于 undo 和 redo。

```ts
export interface TextEditPayload {
  page: Page;
  block: AnyBlock;
  offset: Offset;
  value: string;
  intime?: {
    range: Range;
  };
}

export class InsertText extends Command<TextEditPayload> {
  execute(): void {
    let range: Range;
    if (this.payload.intime) {
      range = this.payload.intime.range;
      this.payload.intime = undefined;
    } else {
      const block = this.payload.block;
      const offset = this.payload.offset;
      range = offsetToRange(block.getContainer(offset.index!), offset)!;
    }
    const node = document.createTextNode(this.payload.value);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    setRange(range);
  }
  undo(): void {
    const block = this.payload.block;
    const offset = Object.assign({}, this.payload.offset);
    offset.end = offset.start + this.payload.value.length;
    const range = offsetToRange(block.getContainer(offset.index!), offset)!;
    range.deleteContents();
    setRange(range);
  }
  tryMerge(command: InsertText): boolean {
    if (!(command instanceof InsertText)) {
      return false;
    }
    if (command.payload.value.indexOf(" ") >= 0) {
      return false;
    }
    if (
      command.payload.block.equals(this.payload.block) &&
      this.payload.offset.start + this.payload.value.length ===
        command.payload.offset.start
    ) {
      this.payload.value += command.payload.value;
      return true;
    }
    return false;
  }
}
```

## deleteContentBackward

> delete the content directly before the caret position and this intention is not covered by another inputType or delete the selection with the selection collapsing to its start after the deletion

Backward 为按下 Backspace 的效果，Forward 为按下 Delete 的效果，无论是否有选中文本。因此 `type === "deleteContentBackward"` 时，还需要根据 `range.collapsed` 区分是否是选中状态。

删除可以通过 `range.deleteContents()` 来完成，但在删除前需要做好状态管理，保证删除内容可以完全 undo。

### 删除单个文本（`range.collapsed`）

单个文本通过 `offset = {start, end: start+1}` 即可模拟，该命令单个文本假设文本不在富文本边界 `*|123*`。在添加和删除后，对于 `Text` 结点，还可以额外的考虑被切断的两个 `Text` 结点合并。

```ts
export class DeleteTextBackward extends Command<TextEditPayload> {
  execute(): void {
    // TODO apply intime
    const block = this.payload.block;
    const offset = Object.assign({}, this.payload.offset);
    offset.end = offset.start + this.payload.value.length;
    const range = offsetToRange(block.getContainer(offset.index!), offset)!;
    range.deleteContents();
    setRange(range);
  }
  undo(): void {
    let range: Range;
    const block = this.payload.block;
    const offset = this.payload.offset;
    range = offsetToRange(block.getContainer(offset.index!), offset)!;
    const node = document.createTextNode(this.payload.value);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    setRange(range);
  }
  public get label(): string {
    return `delete ${this.payload.value}`;
  }

  tryMerge(command: DeleteTextBackward): boolean {
    if (!(command instanceof DeleteTextBackward)) {
      return false;
    }
    if (command.payload.value.indexOf(" ") >= 0) {
      return false;
    }
    // 更早的左删除命令在的 offset 在右侧
    if (
      command.payload.block.equals(this.payload.block) &&
      command.payload.offset.start + command.payload.value.length ===
        this.payload.offset.start
    ) {
      this.payload.offset = command.payload.offset;
      this.payload.value = command.payload.value + this.payload.value;
      return true;
    }
    return false;
  }
}
```

### 删除选中文本（`!range.collapsed`）

对选中的文本，需要考虑的内容相对较多，主要问题是选中文本可能跨不同的富文本格式，如 `<b>1[23</b>456<i>7]89</i>`，需要合适的定义这些情况下的删除行为：

- 当没有选中全部的富文本时，删除仅删除文本部分，保留其他文本的富文本格式
- 当富文本全部被选中时，将富文本内容也全部删除。

实现方法通过 Offset 进行转换后，也可以相对比较容易，具体的步骤如下：

- 获取从 range.startContainer 到 range.endContainer 涉及到的全部结点，返回 `nodes: Node[]`。该方法要和 `range.commonAncestorContainer` 区分，如 `<p>123<b>4[56</b>78]9</p>` 返回的是 `[<b>456</b>, 789]` 两个结点，而 `range.commonAncestorContainer` 返回的是 `<p>..</p>` 结点。
- 计算选中范围的 Token 数
- 记录 nodes 左右边界的 Offset、删除后 nodes 左右边界的 Offset、删除前 `nodes` 的 clone 结点。
- `range.deleteContents()`

在有了上述的数据后，`undo` 时，将删除后 `nodes` 结点删除，随后将备份的原 `nodes` 结点插入到删除为止即可

```ts
export class DeleteSelection extends Command<SelectionPayload> {
  execute(): void {
    let { block, page, delOffset, afterOffset } = this.payload;
    const range = offsetToRange(
      block.getContainer(delOffset.index!),
      delOffset
    )!;

    if (!this.payload.beforeOffset) {
      this.payload.beforeOffset = { ...delOffset, end: undefined };
    }
    if (!afterOffset) {
      this.payload.afterOffset = { ...delOffset, end: undefined };
      afterOffset = this.payload.afterOffset;
    }

    const selectedTokenN = delOffset.end! - delOffset.start;

    const container = block.currentContainer();
    const nodes = nodesOfRange(range, false);

    // 计算光标在 range.startContainer 在 nodes[0] 的深度
    // 在 <b>01[23</b>45]6 删除时，计算了 </b>，但实际上 </b> 会在之后被补全，没有实质上的删除
    // 所以需要额外的判断边界的富文本深度
    // 在选中范围中间的不需要，因为是真实删除了
    // 需要判断的只有左右两个边界
    const leftDepth = calcDepths(range.startContainer, nodes[0]);
    const rightDepth = calcDepths(range.endContainer, nodes[nodes.length - 1]);

    const fullOffset = elementOffset(
      container,
      nodes[0],
      nodes[nodes.length - 1]
    );
    this.payload.undo_hint = {
      full_html: nodes.map((item) => {
        return item.cloneNode(true) as ValidNode;
      }),
      full_offset: {
        start: fullOffset.start,
        end: fullOffset.end,
      },
      trim_offset: {
        start: fullOffset.start,
        end: fullOffset.end! - selectedTokenN + leftDepth + rightDepth,
      },
    };
    range.deleteContents();
    nodes.forEach((item) => {
      addMarkdownHint(item);
    });

    const afterRange = offsetToRange(
      block.getContainer(afterOffset.index),
      afterOffset
    )!;
    block.setRange(afterRange);
  }
  undo(): void {
    const { undo_hint, block, delOffset, beforeOffset } = this.payload;
    // 删掉原来的 common 部分
    const range = offsetToRange(
      block.getContainer(delOffset.index),
      undo_hint!.trim_offset
    )!;
    range.deleteContents();

    const flag = createElement("span");
    range.insertNode(flag);
    // 添加后来的
    flag.replaceWith(...undo_hint!.full_html);
    if (beforeOffset) {
      const beforeRange = offsetToRange(
        block.getContainer(beforeOffset.index),
        beforeOffset
      )!;
      block.setRange(beforeRange);
    }
    const fullRange = offsetToRange(
      block.getContainer(beforeOffset?.index),
      undo_hint!.full_offset
    )!;
    addMarkdownHint(...nodesOfRange(fullRange));
  }
}
```

## 富文本格式的应用和取消

基于 contenteditable 的富文本格式操作需要考虑很多边界情况，包括：

- 单个光标添加富文本时的效果
- 选中文本时添加的效果
- 选中跨富文本类型的文段时添加的效果
- 选中部分 Markdown-hint 时添加格式的效果
- 上述操作后通过键盘直接重复触发时的效果
- 上述操作 undo/redo 时的效果
- 。。。

为了实现这一操作，需要合适的抽象和精准的操作来保证应用格式正常执行。对这一部分，一些编辑器的解决方案是将数据层和表示层分开，数据层以 token 为单位对每个字符的样式建模，并在 token 发生变化时触发更新移动到表示层。

然而，onho 在开发过程中发现，通过定义合适的期望行为，同样可以大幅度降低实现难度。以加粗为例，当上下文为 `<b>te[xt</b>te]xt` 时，对行为的预期可以有以下几种情况：

- 选中范围内全部加粗：`<b>te[xtte]</b>xt`
- 选中范围内取消加粗：`<b>te</b>[xtte]xt`
- 选中范围及其扩散范围取消加粗：`[textte]xt`

在实践中，前两种需要考虑更多的情况，包括格式是否嵌套，如何实现 undo 操作等。在同时考虑到用户行为和开发难度的情况下，onho 最终使用第三种行为设定。该设定为：

- 当应用格式 A 时，如果选中内容的任意部分存在格式 A，则取消格式 A；在不存在格式 A 时，对选中格式添加格式 A
- 在应用和取消时，尝试将选中范围扩展两侧边界，对文本节点，通过 `splitText` 切割选中部分；对 `HTMLElement`，扩展到两侧边界。

这种类似贪心的思路在实现中困难很小，无论是否存在嵌套关系都不增加实现的复杂度。根据具体的实现代码，又将情况分为三种：

### 任意子元素存在待应用格式

通过下面的代码，可以从 startContainer 到 endContainer 遍历所有节点，其中 fathers 是所选中范围中最上层的元素，在替换过程中需要维持这部分的引用。related 是任意层级子元素中包含待应用格式且不为最上层元素的子节点。

```ts
let fathers: ValidNode[] = [];
const related: HTMLElement[] = [];
for (const child of nodesOfRange(range)) {
  fathers.push(child as ValidNode);
  const iterator = document.createNodeIterator(
    child,
    NodeFilter.SHOW_ELEMENT,
    (el: Node) => {
      if (getTagName(el) === format && el !== child) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    }
  );

  let node;
  while ((node = iterator.nextNode())) {
    related.push(node as HTMLElement);
  }
}
```

通过分别删除 related 和 fathers 中的元素，即可实现取消待应用格式的效果。对 fathers 中的元素取消时，使用 flatMap 而不是 map 可以更方便的设置取消格式后的选中范围：

```ts
if (
  related.length > 0 ||
  fathers.filter((item) => getTagName(item) === format).length > 0
) {
  // deformat
  this.payload.undo_hint.op = "deformat";
  related.forEach((item) => {
    const childs = validChildNodes(item);
    item.replaceWith(...childs);
  });

  fathers = fathers.flatMap((item) => {
    if (getTagName(item) === format) {
      const childs = validChildNodes(item);
      item.replaceWith(...childs);
      return childs;
    }
    return item;
  });
  const [startContainer, startOffset] = getValidAdjacent(
    fathers[0],
    "beforebegin"
  );
  const [endContainer, endOffset] = getValidAdjacent(
    fathers[fathers.length - 1],
    "afterend"
  );

  range.setStart(startContainer, startOffset);
  range.setEnd(endContainer, endOffset);
  setRange(range);
  return;
}
```

对每一个被取消格式的节点，提前获取该位置的 Offset，可以用于 undo 操作。

### 父节点为待应用格式

第一种情况没有考虑选中范围的父节点为待应用格式的情况： `<b>te|xt</b>`，这种情况可以通过下面的方法检测：

```ts
const fmt = parentElementWithTag(
  range.commonAncestorContainer,
  format,
  block.currentContainer()
);
```

并通过类似的方式取消格式应用：

```ts
if (fmt) {
  // deformat 2
  // <b>te|xt</b>
  // <b>te[x<i>te]xt</i>t</b>
  const childs = validChildNodes(fmt);
  fmt.replaceWith(...childs);
  const [startContainer, startOffset] = getValidAdjacent(
    childs[0],
    "beforebegin"
  );
  const [endContainer, endOffset] = getValidAdjacent(
    childs[childs.length - 1],
    "afterend"
  );

  range.setStart(startContainer, startOffset);
  range.setEnd(endContainer, endOffset);
  setRange(range);
  return;
}
```

### 不存在待应用格式

这种情况下，需要对所选范围应用该格式：

```ts
this.payload.undo_hint.op = "enformat";
const wrap = createElement(format, {
  children: fathers,
  textContent: innerHTML(...fathers) === "" ? " " : undefined,
});
addMarkdownHint(wrap);

range.insertNode(wrap);
this.payload.undo_hint.offsets.push(
  elementOffset(block.currentContainer(), wrap)
);
setRange(offsetToRange(wrap, FULL_SELECTED)!);
return;
```

# 小结

> 到目前为止，单个 Block 内的所有基本操作就已经定义完成，大部分编辑行为的基本命令都已经实现，之后跨 Block 的相应操作同样可以用类似的方法拆解实现。接下来，整个框架基本进入细节完善阶段。
