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

contenteditable 元素可以注册 `input` 和 `beforeinput` 事件，[w3c](https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes) 详细定义了 InputEvent 事件中和编辑操作有关的项，大致包括 `type`,`data`和 `datatransfer` 三种。里面还定义了哪些编辑操作是在 `beforeinput` 中可以取消的。对于可取消的事件，我们可以对其进行拦截，并自行实现。对不可取消的事件，我们可以在事件发生后手动对该事件的影响用命令模式建模，从而保证可撤销。如果后期自行实现的命令无法保证效率，那么默认可以不拦截事件，而只是对事件进行建模，用于撤销/重做，从而提高正常编辑操作的效率。

为了减少开销，ohno 使用命令模式对每个操作建模而不是建立快照。其中，在记录编辑操作时，因为 `Range` 对 `Node` 元素的引用（相对路径）可能会因为结点被删除而失效，所以 onho 通过之前设计的 `Offset`、`Block` 来定位不会失效的绝对路径。

下面，介绍 ohno 不同编辑操作类型的处理思路：

## 文本的插入和删除

在 textarea 中，插入是 insertText，删除根据 `del` 还是 `backspace`、是否按下了 `alt` 键、选中状态等分为了 `deleteContentBackward`、`deleteContentForward`、`deleteContent`、`deleteWordBackward`、`deleteWordForward` 等，事件十分丰富。

以插入文本为例，上下文的 `Block` 可以定位到相应的根节点，`Offset` 则可以定位到编辑位置所在的绝对位置，通过 `Offset` 可以实时转换为 `Range`，再通过 `Range` 将选中结点进行删除：

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

## 富文本格式的应用和取消

基于 contenteditable 的富文本格式操作需要考虑很多边界情况，包括：

- 单个光标添加富文本时的效果
- 选中文本时添加的效果
- 选中跨富文本类型的文段时添加的效果
- 选中部分 Markdown-hint 时添加格式的效果
- 上述操作后通过键盘直接重复触发时的效果
- 上述操作 undo/redo 时的效果
- 。。。

需要合适的抽象和精准的操作来涵盖并处理所有的情况。以加粗为例，以下是可能遇到的情况：

- 空文本加粗：`te|xt`，期望行为：`te**[ ]**xt`
- 选中文本加粗： `te[xtte]xt`，期望行为：`te**[xtte]**xt`
- 选中文本跨样式加粗：`te[xt<i>te]xt</i>`，期望行为：`te<b>[xt<i>te</i>]</b><i><xt/i>`
- 跨加粗样式加粗：`te[xt<b>te]xt</b>`，期望行为： `te<b>[xtte]xt</b>`
- 加粗样式内加粗（取消加粗）：`**te|xt**`/`**t[ext]**`，期望行为：`[text]`
- ...

上述的期望行为同时参考了 Markdown 编辑器和 Word 等富文本编辑器的行为。对跨样式应用格式的情况，还需要考虑 `undo` 时**相邻元素的合并问题**。如：

- `te[xt<i>te]xt</i>` -> `te<b>[xt<i>te</i>]</b><i><xt/i>` -> undo -> `te[xt<i>te]xt</i>`（而不能是`te[xt<i>te</i>]<i><xt/i>`）

对于嵌套具有一定深度的富文本，格式应用操作需要考虑的内容更多。对这种情况，一些编辑器的解决方案是将数据层和表示层分开，数据层以 token 为单位对每个字符的样式建模，并在 token 发生变化时触发更新移动到表示层。 ohno 参考了这一思路，在命令模式中以更加轻量（或许）的方式对待应用格式的内容及其上下文进行一次数据层和表示层的转换。下面先介绍数据层和表示层的转换（即序列化和反序列化）。

### 数据层建模（序列化）

对数据层的建模，可以看做是序列化的过程，通过递归或者堆栈都可以比较方便的实现，以递归方式为例：

```ts
export interface Segment {
  value: string;
  format: HTMLElementTagName[];
}
export function serializeNode(
  el: Node,
  context?: HTMLElementTagName[]
): Segment[] {
  const res: Segment[] = [];
  context = context || [];
  if (isTextNode(el)) {
    res.push({ format: context, value: el.textContent! });
  } else if (isHTMLElement(el)) {
    if (el.childNodes.length === 0) {
      res.push({
        value: "",
        format: context?.slice().concat(getTagName(el) as HTMLElementTagName),
      });
    }

    el.childNodes.forEach((item) => {
      res.push(
        ...serializeNode(
          item,
          context?.slice().concat(getTagName(el) as HTMLElementTagName)
        )
      );
    });
  }

  return res;
}

export function serialize(...el: Node[]): Segment[] {
  const res: Segment[] = [];
  el.forEach((item) => {
    res.push(...serializeNode(item));
  });
  return res;
}
```

可以通过测试检测 `serialize()` 的有效性

```ts
describe("test serializer", () => {
  test("default", () => {
    const p = createElement("p");
    p.innerHTML = "000<i>123<b>456</b>789</i>";
    res = serialize(p);
    expect(res.length).toBe(4);
    expect(res[0]).toStrictEqual({ value: "000", format: ["p"] });
    expect(res[1]).toStrictEqual({ value: "123", format: ["p", "i"] });
    expect(res[2]).toStrictEqual({ value: "456", format: ["p", "i", "b"] });
    expect(res[3]).toStrictEqual({ value: "789", format: ["p", "i"] });
  });
});
```

> Notion 的数据结构就是类似的方式

这种序列化方法缺少对每个元素的标识，从而无法保证反序列化结果唯一，下面是一个例子：

```ts
p.innerHTML = "<b><i>123</i>000<i>456</i></b>";
res = serialize(p);

expect(res).toStrictEqual([
  { format: ["p", "b", "i"], value: "123" },
  { format: ["p", "b"], value: "000" },
  { format: ["p", "b", "i"], value: "456" },
]);

p.innerHTML = "<b><i>123</i></b><b>000</b><b><i>456</i></b>";
res = serialize(p);
expect(res).toStrictEqual([
  { format: ["p", "b", "i"], value: "123" },
  { format: ["p", "b"], value: "000" },
  { format: ["p", "b", "i"], value: "456" },
]);
```

可以通过在渲染过程中递归的传入当前元素的深度序列信息来解决这一问题，Segment 的字段更新为：

```ts
export interface Segment {
  value: string;
  format: HTMLElementTagName[];
  index: number[];
}
```

添加 `index` 不需要 `serialize` 改动太多，代码略。

### 数据层渲染（反序列化）

反序列化这里假设不会有太深的层级（最多 6 层：`code+b+i+del+u+el`），简单实现如下：

```ts
export function deserialize(...seg: Segment[]): Node[] {
  const root = createElement("p");

  for (const { value, format, index } of seg) {
    let cur: HTMLElement = root;
    for (let i = 0; i < format.length; i++) {
      const ind = index[i];
      if (cur.childNodes[ind]) {
        cur = cur.childNodes[ind] as HTMLElement;
      } else {
        const child = createElement(format[i]);
        cur.appendChild(child);
        cur = child;
      }
    }
    cur.appendChild(createTextNode(value));
  }

  return Array.from(root.childNodes);
}
```

通过测试可以证明这种方式可以在 Segment 和 HTMLElement 之间建立唯一的映射（序列化和反序列化）关系。

```ts
p.innerHTML = "<b><i>123</i>000<i>456</i></b>";
res = serialize(p);
expect((deserialize(...res)[0] as HTMLElement).innerHTML).toBe(p.innerHTML);

p.innerHTML = "<b><i>123</i></b><b>000</b><b><i>456</i></b>";
res = serialize(p);
expect((deserialize(...res)[0] as HTMLElement).innerHTML).toBe(p.innerHTML);
```

### 对行内块的序列化和反序列化

对公式等特殊的行内块元素，需要定制化的序列化反序列化方法，也需要一个统一的接口来处理。对此，约定所有行内块元素外由 label 包裹，并设置 `value` 和 `serializer` 属性，所有行内块元素需要以相应的 `serializer` 名称在 ohno 内部注册序列化和反序列化方法。这部分实现不涉及主要系统设计，略。

### 格式应用命令的设计

在实现数据层和表达层的分离后，分析需求可以发现，对选中内容添加格式，相当于对所有的 Segment 在 format 的开始位置插入格式字符（wrap），取消格式则是删除开始位置的值（unwrap）：

```ts
const p = createElement("p");
p.innerHTML = "<i>123</i><i>456</i>";
const segs = serialize(...Array.from(p.childNodes));
segs.map((item) => {
  item.format.unshift("b");
  item.index.unshift(0);
});
let wraped = deserialize(...segs);
let tgt = "<b>" + p.innerHTML + "</b>";
expect(innerHTML(...wraped)).toBe(tgt);
segs.map((item) => {
  item.format.shift();
  item.index.shift();
});
wraped = deserialize(...segs);
expect(innerHTML(...wraped)).toBe(p.innerHTML);
```

因此，应用格式的流程最终只需要简单的判断对选中文段是添加还是删除格式。最终的命令设计如下：

```ts

```
