/**
 * 对 Editable 的结构设计
 * 包括 Page/Card -> Block -> Editable 三层逻辑
 *
 */
import { LinkedDict } from "@ohno-editor/core/struct/linkeddict";
import { Command, History } from "./history";
import { RefLocation } from "./range";
import { BlockEventContext } from "./handler";
import { BlockInit } from "./block";
import { InnerHTMLInit } from "./inline";
import { ValidNode, getTagName } from "@ohno-editor/core/helper/element";
import {
  addMarkdownHint,
  removeMarkdownHint,
} from "@ohno-editor/core/helper/markdown";
import {
  HTMLElementTagName,
  createElement,
  createTextNode,
} from "@ohno-editor/core/helper/document";
import { Page } from ".";

export interface IComponent {
  parent?: IComponent;
  root: HTMLElement;

  setParent(parent?: IContainer): void;
  detach(): void;
  // deserialize(): IComponent;
  equals(component?: IComponent): boolean;

  serialize(option?: any): any;
  toMarkdown(range?: Range): string;
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
  getCurrentEditable(): Editable;
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
  getGlobalBias(loc: RefLocation): number;

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

  serialize(option?: any): BlockSerializedData;

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

// // Card 可以作为浮动
// export interface ICard extends IBlockContainer {
//   hide(): void;
//   open(): void;
//   float(ref: HTMLElement, option?: any): void;
// }

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
  serialize(label: HTMLLabelElement): InlineSerializedData;
}

// 通用复制格式，一套处理流程
// 单个Block完全复制
// 多个Block完全复制
// 单个 Block 内部复制
// 单个 Block 多 Editable 内部复制
// 多个 Block 头/尾 不换行复制

/**
 * 

{
  head?: {}, // 指定信息后， blocks[0] 首先根据条件判断能否合并
  tail?: {}, // 指定信息后，blocks[-1] 根据条件判断能否合并
  blocks: init[]
}

一共四种情况

te|xt
te[----]xt

te|xt
te[--
--]xt

te|xt
te[--
--]
xt

te|xt
te
[--
--]
xt


 */

export type SerializedData<T> = {
  type: string;
  init?: T;
  unmergeable?: boolean;
}[];

export type BlockSerializedData<T extends BlockInit = BlockInit> =
  SerializedData<T>;

export type InlineSerializedData<T extends InnerHTMLInit = InnerHTMLInit> =
  SerializedData<T>;

export interface OhNoClipboardData {
  head?: { merge: boolean };
  /** 在 */
  inline: boolean;
  tail?: { merge: boolean };
  data: SerializedData<any>;
  context?: {
    dragFrom: Order;
  };
}

export class InlineSerializer {
  serializeNode(node: Node): InnerHTMLInit {
    const tagName = getTagName(node);

    if (tagName === "#text") {
      return { tagName, innerHTMLs: [node.textContent || ""] };
    } else if (tagName === "label") {
      // 所有特殊元素交给 inline serializer
      return { tagName, innerHTMLs: [(node as HTMLElement).innerHTML] };
    } else {
      const children = Array.from((node as HTMLElement).childNodes).map(
        (item) => {
          return this.serializeNode(item);
        }
      );
      return { tagName, children };
    }
  }
  serialize(range: Range): InlineSerializedData<any> {
    const frag = Array.from(range.cloneContents().childNodes);
    removeMarkdownHint(...frag);

    return frag.flatMap((item) => {
      return [{ type: "inline", init: this.serializeNode(item) }];
    });
  }

  deserializeNode(init: InnerHTMLInit): Node {
    const { tagName, children, innerHTMLs } = init;
    if (tagName === "#text") {
      return createTextNode((innerHTMLs || []).join(""));
    } else if (tagName === "label") {
      return createElement("label", { innerHTML: innerHTMLs![0] });
    } else {
      const childrenEl = children!.map((item) => {
        return this.deserializeNode(item);
      });
      return createElement(tagName as HTMLElementTagName, {
        children: childrenEl,
      });
    }
  }

  deserialize(data: InlineSerializedData<InnerHTMLInit>): ValidNode[] {
    const nodes = data.map((item) => {
      if (item.type != "inline" || !item.init) {
        throw new Error("Sanity check");
      }
      return this.deserializeNode(item.init) as ValidNode;
    });
    addMarkdownHint(...nodes);
    return nodes;
  }
}
