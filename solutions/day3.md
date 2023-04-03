# day 3: Page 和 Block 的基本设计

## Block 的数据结构

每个 Block 实例对应一个块级元素的根节点，如`<p>`。不将 HTMLElement 元素直接作为 Block 单位而是包一层 Block 类是为了方便存储 HTMLElement 的其他元数据，以及对 HTMLElement 进行操作的 api，目前已经明确的需求包括：

- Block 的顺序 id
- Block 的类型
- Block 的根节点
- Block 内部操作的 api

```ts
export type Order = string;

export class Block {
  el: HTMLElement;
  type: string;
  order: Order = "";

  // ...
}
```

> Block 的其他设计在后续光标移动、历史记录等环节分别声明

## Blocks 的数据结构

Page 作为 Block 的管理者，需要至少包括对 Block 的增删改查功能。其中，增添又分为直接添加在最后，插入在某个 Block 前后两种情况。此时，管理 Block 的数据结构应该是链表字典结构，并提供以下几个方法的`O(1)`实现：

```ts
export interface Node<K, V> {
  prev?: Node<K, V>;
  name?: K;
  value: V;
  next?: Node<K, V>;
}

export abstract class LinkedDict<K extends string, V> {
  first?: Node<K, V>;
  last?: Node<K, V>;
  nodes: { [key in K]?: Node<K, V> } = {};
  append(name: K, value: V);
  find(name: K): [V, Node<K, V>] | null;
  previous(name: K): [V, Node<K, V>] | null;
  next(name: K): [V, Node<K, V>] | null;
  pop(name: K): [V, Node<K, V>] | null;
  insertBefore(name: K, key: K, value: V): boolean;
  insertAfter(name: K, key: K, value: V): boolean;
  getLast(): [V, Node<K, V>];
}
```

最终 Blocks 通过下面的结构存储：

```ts
LinkedDict<string, Block> = new LinkedDict();
```

## Page 的数据结构

Page 作为最终 ohno 的主要导出对象，需要在有丰富功能的同时保证简单：需要的功能包括：

- 对 Block 的增删改查 api
- 对 Block 的通用操作的 api（如激活某个 Block）
- 创建实例时对外的 api
- 注册事件的 api

最终设计的 Page 接口如下：

```ts
export class Page {
  handler: PageDispatch;
  opHandlers: { [key: string]: OperationHandlerFn } = {};
  blocks: LinkedDict<string, Block> = new LinkedDict();
  root: HTMLElement | null;

  emit(operation: Operation, event: any);
  registerOpHandler(type: string, handlerFn: OperationHandlerFn);

  hover(name: Order);
  unhover(name: Order);
  activate(name: Order);

  findBlock(order: Order): Block | null;
  getPrevBlock(block: Block): Block | null;

  getNextBlock(block: Block): Block | null;
  deactivate(name: Order);
  appendBlock(newBlock: Block);
  insertBlockBefore(name: Order, newBlock: Block) {}
  insertBlockAfter(name: Order, newBlock: Block) {}
  removeBlock(name: Order): any {}
  replaceBlock(name: Order, newBlock: Block) {}

  render(el: HTMLElement) {}

  dismiss(removeElement?: boolean) {}
}
```
