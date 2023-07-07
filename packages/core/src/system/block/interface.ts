import {
  Order,
  BlockQuery,
  Editable,
  EditableFlag,
  EditableInterval,
  Interval,
  RefLocation,
} from "../types";
import { LinkedDict } from "@ohno-editor/core/struct";

// 基本编辑块
export interface IBlock {
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
