# day 0: 前言

之前使用的编辑器大多都存在这样那样的问题，如对 React 的兼容性不好，不容易扩展，一些细节操作的行为和 markdown 编辑器的预期不符等。

虽然我是个前端半新手，之前只简单写过一些前端页面，但在简单的测试过浏览器的一些事件和 contenteditable 属性后，我突然觉得一个依托于浏览器的编辑器的开发并不会太复杂，因此也萌生了自己写一个编辑器的冲动。希望在编辑器开发后，能将次嵌入到我以后其他开发的应用中，用于统一配置。

这一项目的初版在半年前以 [MoEditor](https://github.com/spaced-all/MoEditor) 的停止维护告终，当时失败的原因包括：

- 时间管理太差、其余事务繁忙
- 技术选型不充分，缺少实践带来的整体思考，导致 api 冗余复杂
- 没有充分的认识到测试用例的重要性，而是人肉测试。

最近，在重新思考了各种技术选型后，我重新捡起这一份想法，开始了另一次编辑器的开发尝试，这就是 [ohno](https://github.com/sailist/ohno)

# day 1: 技术选型

以开发一个 markdown-style 的块级富文本编辑器为目标，思考并尝试相关技术选型。

## 基本选型：contenteditable or textarea

### textarea

令每个 Block 为一个 textarea，并通过 attribute 等定义 textarea 的 Block 类型，并通过样式来保证 textarea 的外观和所属 Block 类型一致。这种方式不太可能，但仍然可以简单讨论一下该路线的优劣：

- 纯文本编辑，相比于基于 HTMLElement 的编辑，不需要考虑富文本边界存在的各种问题，可以将 value 直接看做 markdown 文本而不需要转换
- 文本选择只能以 textarea 为单位
- 内部细节无法感知，只能以 selection 和 value 两个值进行推测
- 。。。

### contenteditable

HTML 中，通过添加 `contenteditable="true"` 属性可以使所有子节点在浏览器中可直接编辑，甚至还可以通过 `ctrl+b` 等快捷键添加富文本属性。然而，这种直接允许可编辑的方法实现并不完善，存在许多问题：

- 富文本的边界不可控，如将加粗文本删除后，无法显式明确当前光标位置的格式
- 无法创建更多的 Block 类型，如图片、代码块
- 键盘事件不可控，如删除最终会将最后一个 block 子元素也删除，而不是保留最后一个可编辑 block
- markdown-style 的提示不方便添加：不管是通过 `:before` 还是 `<span>` 等元素添加富文本的 markdown-hint

然而，基于 contenteditable 的路线可以通过 HTMLElement 自身的 api 高效的操作元素，同时也和 markdown 本身的渲染结果保持一致，因此，最终 [onho](https://github.com/sailist/ohno) 使用基于 contenteditable 的方式进行后续的开发。

## 基于 contenteditable 的后续路线选择

### 基于 float 的方案

基于 float 的方案的基本思路是，页面的结果为渲染后的结果，不该更改，所有的更改都是在一个覆盖在渲染结果上的相同或隐藏编辑器上实现的，且编辑器内的更改会完全同步到渲染结果上。比如：

- 在相应元素上创建一个完全相同的 float 的元素，该元素可视，可编辑，该元素的编辑的结果会同步更新到底部元素。
- 在隐藏区域创建一个完全相同的 float 元素。当编辑状态触发时，光标会转移到隐藏区域的可编辑区域内，原位置会保留一个模拟光标。

优点：

- 原位置不需要改变，当选择多个 block 时，不受 contenteditable 的影响
- 通过叠加，可以比较容易的实现 hint 效果，可以比较容易的实现写作 AI 之类的操作？

缺点：

- 需要额外考虑很多交互因素，比如跨 block 的删除，或多光标支持、内容选择多文本后编辑等

> 该方案的存在一定的可行性，但该方案的实现思路应该和目前的主流编辑器的思路都不一致，且我之前缺少相关的实践，对很多操作能否受控/实现都不明确，受限于成本，暂时放弃这种实现。

### 仅当前编辑的 Block 为 contenteditable

对每个 block 分别注册事件处理，并通过事件的各种边界情况在 block 之间转移 `contenteditable` 状态。

```html
<div>
  <p contenteditable>activated block1</p>
  <p>block2</p>
  ...
</div>
```

优点：

- block 级别的**可编辑**属性更可控：对普通文本 block，可编辑通过改变 contenteditable 实现；对非普通文本的 block（代码、图片），可编辑可以通过其他 handler 来实现

缺点：

- 复制时，contenteditable 的元素无法跨界
- 对多光标的支持会很复杂

> 将所有 block 节点分别设为 contenteditable 会让该路线的其他实现简单一点，但仍然不方便做跨 block 的文本选择，最终会变成 Notion 的实现方案：跨 block 选择时，以 block 为单位进行复制而不允许复制部份文本。

### 将根节点设为 contenteditable

```html
<div contenteditable>
  <p>block1</p>
  <p>block2</p>
  ...
</div>
```

优点：

- 可以直接实现跨 block 的选择
- 不需要考虑 block 之间激活状态的转移

缺点：

- 对 code、math、image 非文本类型的 Block 的编辑可能会存在问题
- 无法感知 block 级别的 `mouseenter`/`mouseleave` 事件，只能通过根节点的 `mousemove` 事件来实现相同功能，效率位置
