# Inline 的设计逻辑

inline，包括链接（`[]()`）、双链（`[[]]`）、公式（$$）、Tag（#）、At（@），甚至行内图片（`![]()`）等。

从不同的角度分析 inline 的表现和规范，从而最终确定 inline 的设计方法。

1. 在最终的 HTML 形式上，inline 有符合正常布局的，如链接（`<a>...</a>`），有不符合正常布局的，如行内公式（嵌套一堆 math）。
2. 在复制为 Markdown 时，inline 的转换形式不同
3. 在编辑方法上，链接、公式、行内图片、双链。。。所有 inline 都希望可以额外弹出一个对话框用于更方便的编辑（如 at 的下拉框选择人，tag 下拉框选择已有 tag，链接编辑名字和网站，双链下拉框选择已有文章）
4. 在插入方法上，都有对应的快捷键可以触发（如链接可以是`/a`，双链是`[[`，公式是 `$$`，Tag 是 `##`,at 是 `@@`，行内图片是 `![`）
5. 在状态上，希望有默认、hover（可以通过 css 样式）、选中、编辑四种状态
   1. 选中状态的进入和退出：键盘移动到边缘时，下一个位置即为 inline 的选中状态
   2. 编辑状态的进入和退出：Page 失去焦点、ESC、编辑状态下按确认按钮可以退出编辑状态；鼠标直接点击，选中状态下回车可以进入编辑状态。
6. 在删除上，在非选中状态时，第一次删除默认切换到选中状态下，第二次删除真正删除。
7. 在

在此预期下，inline 应该是一个 plugin（可以和 dropdown 区分），该 plugin 提供对 HTML 元素的管理（如对 `<a></a>` 提供额外的管理弹窗，或 `<em></em>` 划线的颜色更改，或在 label 元素上时提供编辑公式的文本框）

进入 inline 状态时，需要有生命周期来 handle blur 状态（如果输入偏移了），即 onInlineEditStart/Update/End。

对于触发，需要提供额外的 handler 或 page 的注册支持？
先 commit 以下，然后开个 branch 实验

# inline 的两个激活入口

Hover 状态下 BackSpace 是跳到 afterend 处，第二下删除；Delete 相反

基于鼠标 -> hover 和 click 两个状态
MouseEnter 是 Hover，Click 是 Edit

基于键盘 -> Arrow 进去两个状态
Math Arrow 是 Hover，Enter 是 Edit
Backlink Arrow 是 Hover，Enter 是 Edit，Arrow 两侧、Escape 是 Edit 到 Hover，BackSpace 是为空是删除，不为空是跳到 afterend 处（两次删除）
At Arrow 是 Hover，Enter 是 Edit
Datetime Arrow 是 Hover，Enter 是 Edit
TODO Arrow 是 Hover，Space 是 extra，Enter 是 Edit
Tag Arrow 是 Hover，Enter 是 Edit
KeyLabel Arrow 是 Hover ，Enter 是 Edit

inlineSupport 负责发送 handleMouseHover/handleKeyboardHover，在 KeyboardHover 即以上状态下，所有的键盘事件都会被分发到 inline handler 中；而 MouseHover 状态下，键盘事件还按原来光标走；在 MouseEdit 后，键盘事件随着 inline handler 走；

基于事件 -> 一些还没有考虑好的事件

handleMouseActivate 第一次（之前光标不在 label 上）时
handleKeyboardActivate (第一次在 [label, 0] 位置时按 Enter/Space) 时调用
