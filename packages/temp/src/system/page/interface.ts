import { LinkedDict } from "../../struct";
import { History } from "../types";
import { Command, IBlock } from "../types";

export type Editable = HTMLElement;
export type Order = string;
export type BlockQuery = IBlock | Order;

// 基本编辑块
export interface IContainer {
  outer: HTMLElement;
  inner: HTMLElement;
  root: HTMLElement;
  detach(): void;
  // deserialize(): IComponent;
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
