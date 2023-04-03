# day 2: 事件系统

一个事件系统大概可以从触发方式、触发地点、触发行为、触发范围四个方面进行区分。

- 从触发方式上，可以分为键盘、鼠标等浏览器自身触发的事件和编辑器内由按钮点击等通过代码触发的事件
- 从触发地点上，在块级编辑器中，事件可能在 Page （根节点）中触发，也可能在 Block （子节点）内触发
- 从触发行为上，可以分为有编辑行为（增删改）和无编辑行为（移动光标）
- 从触发范围上，可以分为 Block 内和跨 Block 两种。

考虑到历史记录（redo/undo），因此对以上的所有情况的事件，仅从触发行为的角度进行区分。即：将所有无编辑行为的称为事件（Event），将所有有编辑行为的称为操作（Operation），事件处理器中仅能产生无编辑行为的操作（如移动光标），任何有编辑行为的操作都需要重新产生一个 `Operation` 并发送到 `OperationHandler` 中处理。

由此，定义对事件（Event）的处理方法的接口为：

```ts
export type HandlerMethod<K> = (
  this: Handler,
  e: K,
  context: EventContext
) => boolean | void;

export interface EventContext {
  page: Page;
  block: Block;
}
```

其中：

- `e` 为事件信息，所有触发方式下产生的事件的信息都通过 `e` 传递
- `context` 中包含事件的触发地点，即触发时对应的 `Block` 和 `Page` 实例，从而可以标记触发地点
- 在方法内部，通过 `context` 可以对 `Block` 和 `Page` 进行操作，从而能够实现不同的触发范围。

在实际调用中，不同的事件需要用不同的方式获取到事件发生时所在的 `Block`，在获取后，即可按序调用相应的 `handler`：

```ts
block = ...
const handler = ...;
const method = handler[eventName] as HandlerMethod<K>;
method.call(handler, e, this.makeContext(block));
```

对 Operation，目前仅粗略定义其接口，具体构思需要在结合历史记录模块实现编辑操作时进行设计：

```ts
export interface Operation {
  type: string;
  payload: any;
}
```
