/**
 * 对 Editable 的结构设计
 * 包括 Page/Card -> Block -> Editable 三层逻辑
 *
 */
import { LinkedDict } from "@/struct/linkeddict";
import { Command, History } from "./history";
import { RefLocation } from "./range";
import { EventContext } from "./handler";

export interface IComponent {
  parent?: IComponent;
  root: HTMLElement;

  setParent(parent?: IContainer): void;
  detach(): void;
  serialize(option?: any): string;
  // deserialize(): IComponent;
  equals(component?: IComponent): boolean;
}

export interface IComponentManager {
  name: string;
  parent?: IComponent;
  root: HTMLElement;
  setParent(parent?: IContainer): void;
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

export interface IInlineManager {
  activeInline?: HTMLElement;
  setActiveInline(inline?: HTMLElement): boolean;
}

export interface IBlockContainer
  extends IBlockManager,
    IContainer,
    IInlineManager,
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

// Card 可以作为浮动
export interface ICard extends IBlockContainer {
  hide(): void;
  open(): void;
  float(ref: HTMLElement, option?: any): void;
}

export interface IPlugin extends IComponentManager {
  destory(): void;
}

export interface IInline extends IComponentManager {
  destory(): void;
  create(payload: any): HTMLLabelElement;
  hover(label: HTMLLabelElement, context: EventContext): void;
  edit(label: HTMLLabelElement, context: EventContext): void;
  exit(): void;
}
