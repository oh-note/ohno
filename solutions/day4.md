# day 4: 光标移动

目前观察 contenteditable 的光标移动逻辑，是在所有可视化字符间进行移动，这在 markdown-style 的编辑器中是不可以直接使用的，如：

- 加粗元素对应的 markdown 标记为长度为 2 的 `**`，在设计中，应该避免光标移动到中间，而应该将 `**` 作为一个整体，光标只能在其左右进行移动。
- 行内公式，光标在移动时，应该只能在公式左侧，公式中间（选中状态），公式右侧进行移动

对此，需要考虑对键盘事件中的箭头移动事件进行重写，定义编辑器中各种情况下的光标移动行为，覆盖所有情况下的光标移动情况。由简到难，这可以从两个点考虑：

- 在 Block 内，光标如何移动
- 在 Block 间，光标如何移动

## Block 内：以 Token 为单位的光标移动

可以将 Token 看做左右箭头移动的基本单位，在这一条件下，Token 有三类：

- 普通文本 Token：`te|xt`，光标位于文本中间，左右均为文本，此时一个字符即可看做一个 Token，→:`tex|t`
- HTMLElement: `<p>text<b>text|</b></p>`，当这种情况按下 → 时，`</b>` 被视为一个 Token，因此 →：`<p>text<b>text</b>|</p>`
- Token HTMLElement：如行内公式等行内块级元素（和 `display: inline-block` 区分，一个是语义上的，一个是 CSS 属性），此时 HTMLElement 元素内视为一个整体，因此光标移动到 Token HTMLElement 时只能视为选中其外部节点： `|<label>...</label>`，→：`[<label>...</label>]`，→：`<label>...</label>|`。

在此规则下，定义并实现以下接口，即可实现 Block 内的光标移动，并在到达 Block 边界时返回 null：

```ts
export function setRange(range: Range, add?: boolean);

export function getPrevRange(root: HTMLElement, range: Range): Range | null;
export function getNextRange(root: HTMLElement, range: Range): Range | null;
```

以 `getNextRange` 而言，需要处理的有三种情况：

- 最简单的情况：`container` 为 `Text`，且 `offset < container.textContent.length`，返回 `offset+1` 即可
- `"text|"?`：存在相邻节点：根据相邻节点为 `Text` 还是 `HTMLElement` 需要进行区分
  - `Text`：下一个位置是 `[neighbor, 1]`，即 `"text|""text"` -> `"text""t|ext"`
  - `HTMLElement`：下一个位置是 `[neighbor, 0]`，即 `"text|"<b>?</b>` -> `"text"<b>|?</b>`
- `<b>"text"</b>?`：不存在相邻节点：同样根据相邻节点为 `Text` 还是 `HTMLElement` 需要进行区分
  - `Text`：下一个位置是 `[neighbor, 0]`，即 `<b>"text|"</b>"text"` -> `<b>"text"</b>"|text"`
  - `HTMLElement`：下一个位置是 `[container.parentElement, indexOfNode(neighbor)]`，即 `<b>"text|"</b><i>?</i>` -> `<b>"text"</b>|<i>?</i>`

> 此外，可能还需要一些边界条件的判断，如相邻节点是 `Text` 但 `textContent` 为 `""`。这要求在寻找相邻节点时还需要遍历节点找到合法的相邻节点，而不能简单的使用 `el.nextSibling`。

## Block 间：边界判断

上面以 Token 为移动单位的逻辑在遇到跨 Block 时会存在问题，因为会存在一个中间的分隔，比如两个 Block 可以表示为：`<p></p><p>|</p>`，当按下左键时候，合理的行为应该是 `<p>|</p><p></p>`，但如果按照上一节 Token 的默认行为就会出现 `<p></p>|<p></p>`，从而破坏了处理逻辑。如果是对 `getPrevRange`/`getNextRange` 这两个方法的接口进行改进，会引入额外的判断，也会导致函数的逻辑不纯粹，因此，Block 间光标的移动可以在 handler 内通过其他逻辑实现，`getPrevRange`/`getNextRange`通过返回 `null`起到边界提示作用。

在此基础上，跨 Block 的光标移动的实现的代码基本如下：

```ts
function ArrowLeftHandler(
  handler: Handler,
  e: KeyboardEvent,
  { page, block }: EventContext
) {
  prev = getPrevPosition(range);
  // Block 内移动
  if (prev) {
    block.setRange(prev);
    return true;
  }

  // Block 间移动
  const prevBlock = page.getPrevBlock(block) as Block;
  if (prevBlock) {
    page.activate(prevBlock.order);
    const lastRange = getLastRange(prevBlock.el);
    setRange(prevBlock.el);
  }
  return true;
}
```

其中，`getLastRange` 用于得到相应元素的最后一个位置，与此对应的还应该实现 `getFirstRange`。这两个函数的基本思路是通过 `firstChild`/`lastChild` 等方法递归的获取可以基本完美的解决左右键导致的 Block 间光标移动。

然而这种方式无法解决上下键导致的 Block 切换，考虑在如下示例下按上键以及对应的期望行为：

```
<p>0123456789    // 多行
   01234|56789</p> // <- 期望光标位置
<p>01234|56789</p> // <- 原光标位置
```

基于 Range 的移动无法很好的得到**最后一行的第 5 个 Token 位置**这样的操作。因此，对于 `Range` 这种**相对位置关系**的缺点，可以定义一种基于**绝对位置关系**的计算方式，如下所示：

```ts
export interface Offset {
  start: number;
  end?: number;
}
export function rangeToOffset(root: HTMLElement, range: Range): Offset;
export function offsetToRange(root: HTMLElement, offset: Offset): Range | null;
export function getTokenSize(root: ValidNode): number;
export function getPosition(root: HTMLElement): Offset;
export function getInlinePosition(root: HTMLElement): Offset;
export function setPositionAtLastLine(root: HTMLElement): Offset;
export function setPosition(root: HTMLElement): Offset;
export function isFirstLine(root: HTMLElement, range: Range);
export function isLastLine(root: HTMLElement, range: Range);
```

在此基础上，上键对应的行为即可实现为：

```ts
function ArrowUp(
  handler: Handler,
  e: KeyboardEvent,
  { page, block }: EventContext
): boolean | void {
  if (isFirstLine(range)) {
    const offset = getPosition();

    const prevBlock = page.getPrevBlock(block) as Block;
    if (prevBlock) {
      prevBlock.setPosition(offset, prevBlock.el);
    } else {
      block.setPosition({ start: 0 });
    }
    return true;
  }
}
```

## 多可编辑区域的 Block

之前的 Block 只考虑了单编辑区域的，如 Paragraph、Quote，均为单编辑区域。对 List、Table 这些多编辑区域，光标在跨编辑区域移动时会出现和跨 Block 相同的问题：

```
<ul>
  <li>012|345</li> <- 移动后
  <li>012|345</li> <- 移动前
  <li>012345</li>
</ul>
```

因此，在 Block 内再划分子节点，将 Block 内的每一个编辑区域称为 Container，当光标转移时，先判断移动位置是否存在相邻 Container，如果不存在（真·Block 边界）才执行跨 Block 的移动。在该逻辑上，定义 Block 的 Container 接口：

```ts
export class Block {
  // ...
  currentContainer(): HTMLElement;
  leftContainer(el?: HTMLElement): HTMLElement | null;
  rightContainer(el?: HTMLElement): HTMLElement | null;
  aboveContainer(el?: HTMLElement): HTMLElement | null;
  belowContainer(el?: HTMLElement): HTMLElement | null;

  firstContainer(): HTMLElement;
  lastContainer(): HTMLElement;
  containers(): HTMLElement[];
  isLeft(range: Range, container?: HTMLElement): boolean;
  isRight(range: Range, container?: HTMLElement): boolean;
  isFirstLine(range: Range, container?: HTMLElement): boolean;
  isLastLine(range: Range, container?: HTMLElement): boolean;

  getPrevPosition(range: Range, container?: HTMLElement): Range | null;
  getNextPosition(range: Range, container?: HTMLElement): Range | null;
  getPosition(reversed?: boolean, container?: HTMLElement): Offset;
  getInlinePosition(range: Range, container?: HTMLElement): Offset;

  setInlinePositionAtLastLine(offset: Offset, container?: HTMLElement);
  setPosition(offset: Offset, container?: HTMLElement);
  setRange(range: Range, container?: HTMLElement);
}
```

因为 Container 的存在，相应的位置获取处理转移到了 Block 实例内部，而不是直接使用原来的方法接口：

```ts
function ArrowUp(
  handler: Handler,
  e: KeyboardEvent,
  { page, block }: EventContext
): boolean | void {
  if (block.isFirstLine(range)) {
    const offset = block.getPosition();

    // 先尝试切换到 Block 内的上一个 Container
    const prevContainer = block.aboveContainer();
    if (prevContainer) {
      block.setInlinePositionAtLastLine(offset, prevContainer);
      return true;
    }

    const prevBlock = page.getPrevBlock(block);
    if (prevBlock) {
      // 激活，并且光标位移到上一个 block 的最后一行
      page.activate(prevBlock.order);
      prevBlock.setPosition(offset, prevBlock.lastContainer());
    } else {
      // 当没有上一个 Block 时，光标移动到该 Block 的初始位置
      block.setPosition({ start: 0 });
    }
    return true;
  }
}
```

## Offset 常量

基于 Offset 的位置设置下，可以定义一些方便使用的常量，如：

```ts
export const FIRST_POSITION: Offset = {
  index: 0, // 用来定位 Container
  start: 0,
};
export const LAST_POSITION: Offset = {
  index: -1,
  start: -1,
};
export const FULL_BLOCK: Offset = {
  index: 0,
  endIndex: -1,
  start: 0,
  end: -1,
};
```

## Word Jump

Alt 键按下时的行为是以词为界限进行移动，因此需要额外实现以下两个函数接口：

```ts
export function getPrevWordRange(root: HTMLElement, range: Range): Range | null;
export function getNextWordRange(root: HTMLElement, range: Range): Range | null;
```

实现方式较为简单，在文本 Token 内部则查询上一个需要分词的位置，在文本边界则不考虑分词。

## 测试可用性

通过代码重新托管所有的光标移动保证了行为的可控性，而托管函数的可控性则需要依靠完善的测试用例保证。使用 `jsdom`/`happy-dom` 等库，可以在测试时创建一个虚拟的 document 环境执行测试。来测试各种情况下的光标移动，避免人力测试遗漏内容。

如：

```ts
test("2023-04-03-08-48", () => {
  const p = createElement("p");
  p.innerHTML = "Lor<b><i>a</i></b>m";
  // Lor<b>|**<i>*|a*</i>**</b>m
  addMarkdownHint(p);
  expect(
    offsetToRange(p, { start: 4, end: 5 })!.cloneContents().textContent
  ).toBe("*");
});
```

### 各种边界问题小结

- 位于两个富文本中间：`<b><i></i>|<i></></b>`
- 加了 markdown-hint 后 `<b><i></i>|<i></></b>`: offset 0-1 可以得到 \*\*, 1-2 可以得到 \*

## 小结

到这里，编辑器的基本框架，以及读相关功能基本已经全部实现，这包括编辑器的基本结构、事件系统、和光标移动规则实现。之开始实现编辑器的写相关功能。
