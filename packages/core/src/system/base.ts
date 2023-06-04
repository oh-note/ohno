/**
 * 对 Editable 的结构设计
 * 包括 Page/Card -> Block -> Editable 三层逻辑
 *
 */
import { LinkedDict } from "@ohno-editor/core/struct/linkeddict";
import { Command, History } from "./history";
import { RefLocation } from "./range";
import { BlockEventContext } from "./handler";

import { InlineNodeInit, InlineSerializedData } from "./inline";
import {
  ValidNode,
  getTagName,
  innerHTML,
} from "@ohno-editor/core/helper/element";
import {
  addMarkdownHint,
  removeMarkdownHint,
} from "@ohno-editor/core/helper/markdown";
import {
  HTMLElementTagName,
  createElement,
  createTextNode,
  dechildren,
} from "@ohno-editor/core/helper/document";
import { BlockSerializedData, Page } from ".";

export interface IComponent {
  parent?: IComponent;
  root: HTMLElement;

  setParent(parent?: IContainer): void;
  detach(): void;
  // deserialize(): IComponent;
  equals(component?: IComponent): boolean;
}

export interface IComponentManager {
  name: string;
  parent?: IComponent;
  root: HTMLElement;
  // setParent(parent?: IContainer): void;
}

export type Editable = HTMLElement;
export type Order = string;
export type BlockQuery = IBlock | Order;

// export type EditableQuery = { index?: number; editable?: Editable };

// 基本编辑块
export interface IContainer extends IComponent {
  outer: HTMLElement;
  inner: HTMLElement;
}

// 因为 range 本身不具备额外辨识 Editable、block 范围的属性
// 所以只在 handler 中根据具体功能封装，block 本身只提供 interval 到 range 的转换
// 在 HTMLElement 中定位范围
export interface Interval {
  start: number;
  end: number;
}

// 在 Block 中定位某个 Editable 的范围
export interface EditableInterval {
  start: number;
  end: number;
  index: number;
}

// 基于 block.inner 在 page 中定位范围
// export interface PageInterval {
//   start: number;
//   end: number;
//   startIndex: Order;
//   endIndex: Order;
// }

// export type
export type EditableFlag = HTMLElement | number;
// 基本编辑块
export interface IBlock extends IContainer {
  //
  type: string;
  order: string;
  isMultiEditable?: boolean;
  setOrder(order: Order): void;
  // index editable

  getEditables(start?: number, end?: number): Editable[];
  getEditableIndex(editable: Editable): number;
  getEditable(flag: EditableFlag): Editable;

  findEditableIndex(node: Node): number | null;
  findEditable(node: Node): Editable | null;
  findEditable(node: Node, raise?: boolean): Editable;
  // iterate editable
  getFirstEditable(): Editable;
  getLastEditable(): Editable;
  getNextEditable(editable: Editable): Editable | null;
  getPrevEditable(editable: Editable): Editable | null;
  getLeftEditable(editable: Editable): Editable | null;
  getRightEditable(editable: Editable): Editable | null;
  getAboveEditable(editable: Editable): Editable | null;
  getBelowEditable(editable: Editable): Editable | null;
  // index position
  getRangeLegend(
    start: [number, EditableFlag],
    end?: [number, EditableFlag]
  ): Range | null;
  getEditableRange(interval: EditableInterval): Range | null;
  // range from editable element;
  getRange(interval: Interval, query: EditableFlag): Range | null;
  // range from root element;
  getRange(interval: Interval): Range | null;
  // location from editable element;
  getLocation(bias: number, query: EditableFlag): RefLocation | null;
  // location from root;
  getGlobalLocation(bias: number): RefLocation | null;

  // bias from editable element;
  getBias(loc: RefLocation): number;
  // bias from root
  getGlobalBiasPair(loc: RefLocation): [number, number];

  // softline function
  // location of bias start from softline head
  getSoftLineLocation(loc: RefLocation, bias: number): RefLocation | null;
  // bias from softline head
  getSoftLineBias(loc: RefLocation): number;
  // location of softline head
  getSoftLineHead(loc: RefLocation): RefLocation;
  // location of softline tail
  getSoftLineTail(loc: RefLocation): RefLocation;

  // iterate position
  getPrevLocation(loc: RefLocation): RefLocation | null;
  getNextLocation(loc: RefLocation): RefLocation | null;
  getPrevWordLocation(loc: RefLocation): RefLocation | null;
  getNextWordLocation(loc: RefLocation): RefLocation | null;

  // bounding judgement
  isLocationInLeft(loc: RefLocation): boolean;
  isLocationInRight(loc: RefLocation): boolean;
  isLocationInFirstLine(loc: RefLocation): boolean;
  isLocationInLastLine(loc: RefLocation): boolean;

  clone(): IBlock;
}

export interface IBlockManager {
  chain: LinkedDict<string, IBlock>;
  selected: Set<Order>;
  active?: IBlock;
  hover?: IBlock;

  setHover(block?: IBlock): void;
  setActivate(block?: IBlock): void;
  toggleSelect(flag: BlockQuery): void;
  clearSelect(): void;
  toggleAllSelect(): void;

  query(flag: BlockQuery): IBlock | null;

  getNextBlock(flag: BlockQuery): IBlock | null;
  getPrevBlock(flag: BlockQuery): IBlock | null;
  getFirstBlock(): IBlock;
  getLastBlock(): IBlock;
  appendBlock(newBlock: IBlock): Order;
  insertBlockAdjacent(
    newBlock: IBlock,
    where: "before" | "after",
    flag?: BlockQuery
  ): Order;
  removeBlock(flag: BlockQuery): IBlock;
  replaceBlock(newBlock: IBlock, flag: BlockQuery): IBlock;
}

export interface ISelectionManager {
  readonly rangeDirection: "prev" | "next" | undefined;
  readonly selectionMode: "block" | "text";
  setMode(mode: "block" | "text"): void;
  setDirection(dir?: "prev" | "next"): void;
}

export interface InlineMutexResult {
  set?: HTMLLabelElement;
  unset?: HTMLLabelElement;
}

export interface IInlineManager {
  activeInline?: HTMLElement;
  mouseHoveredInline?: HTMLElement;
  cursorHoveredInline?: HTMLElement;
  hoveredCount: number;
  /** 第一个值不为空表示取消激活的，第二个值不为空表示激活了的 */
  setActiveInline(inline?: HTMLElement): InlineMutexResult;
  setHoveredInline(
    from: "mouse" | "cursor",
    inline?: HTMLElement
  ): InlineMutexResult;
}

export interface IBlockContainer
  extends IBlockManager,
    IContainer,
    ISelectionManager,
    IHistoryManager {}

export interface IHistoryManager {
  readonly history: History;
  executeCommand(command: Command<any>, executed?: boolean): void;
  undoCommand(): boolean;
  redoCommand(): boolean;
}

// Page 是正式的页面
export interface IPage extends IBlockContainer {
  pluginRoot: HTMLElement;
  combine(start: Order, end: Order): void;
  render(root: HTMLElement): void;
  // 从已有文档建立
  attach(ref: HTMLElement): void;
}

export interface IPlugin extends IComponentManager {
  parent?: Page;
  destory(): void;
  setParent(parent?: Page): void;
}

export interface IInline extends IComponentManager {
  plugin: IInlineManager;
  setInlineManager(plugin: IInlineManager): void;
  destory(): void;
  create(payload: any): HTMLLabelElement;
  hover(label: HTMLLabelElement, context: BlockEventContext): void;
  activate(label: HTMLLabelElement, context: BlockEventContext): void;
  exit(onExit?: () => void): void;
}

export interface OhNoClipboardData {
  data: (InlineSerializedData | BlockSerializedData)[];
  context?: {
    dragFrom: Order;
  };
}

export class InlineSerializer {
  serializeNode(node: Node): InlineNodeInit {
    const tagName = getTagName(node);

    if (tagName === "#text") {
      return { tagName, children: [node.textContent || ""] };
    } else if (node instanceof HTMLElement) {
      // 所有特殊元素交给 inline serializer
      return {
        tagName,
        className: node.className,
        dataset: node.dataset,
        children: [node.innerHTML],
      };
    } else {
      return { tagName: "span", children: ["Unhandled type", node.nodeName] };
    }
  }
  serialize(range: Range): InlineSerializedData {
    const frag = Array.from(range.cloneContents().childNodes);
    removeMarkdownHint(...frag);

    return {
      type: "inline",
      data: frag.flatMap((item) => {
        return this.serializeNode(item);
      }),
    };
  }

  toMarkdown(range: Range): string {
    // TODO markdown serializer
    const frag = Array.from(range.cloneContents().childNodes);
    removeMarkdownHint(...frag);
    return innerHTML(...frag);
  }
  toHTML(range: Range): string {
    const frag = Array.from(range.cloneContents().childNodes);
    removeMarkdownHint(...frag);
    return innerHTML(...frag);
  }

  deserializeNode(init: InlineNodeInit): Node {
    const { tagName, children, dataset, className } = init;

    if (tagName === "#text") {
      return createTextNode(dechildren(children || []).join(""));
    } else {
      return createElement(tagName as HTMLElementTagName, {
        children,
        dataset,
        className,
      });
    }
  }

  deserialize(data: InlineSerializedData): ValidNode[] {
    if (data.type != "inline") {
      throw new Error("Sanity check");
    }
    const nodes = data.data.flatMap((item) => {
      return this.deserializeNode(item) as ValidNode;
    });

    if (!data.plain) {
      addMarkdownHint(...nodes);
    }
    return nodes;
  }
}
