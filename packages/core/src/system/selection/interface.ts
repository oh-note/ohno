/**
 * There are four types of token in ohno:
 * 1. plain text token, one char count to 1
 * 2. rich bound token, like <a> or </a>, it is unvisible but can be counted depend on the situation
 * 3. shadow token, like ** in markdown, it is visible but count to zero.
 * 4. label token, all inside content will be ignored, only two rich bound token will be counted up.
 */
import { Interval, ElementFilter, RefLocation, WHERE } from "../types";

export interface PositionMethods {
  locationToBias(root: Node, loc: RefLocation): number;
  biasToLocation(root: Node, bias: number): RefLocation | null;
  rangeToInterval(root: Node, range: Range): Interval;
  intervalToRange(root: Node, offset: Interval): Range | null;
  intervalOfElement(root: HTMLElement, ...node: Node[]): Interval;

  getTokenSize(root: Node | Node[] | DocumentFragment): number;
  getTokenSize(
    root: Node | Node[] | DocumentFragment,
    with_root: boolean
  ): number;

  tokenBetweenRange(range: Range): number;
  offsetAfter(container: Node, offset: number, bias: number): RefLocation;
}

export interface RangeMethods {
  locationInFirstLine(loc: RefLocation, root: HTMLElement): boolean;
  locationInLastLine(loc: RefLocation, root: HTMLElement): boolean;

  setLocation(loc: RefLocation): void;
  getValidAdjacent(container: Node, where: WHERE, norm?: boolean): RefLocation;
  getPrevLocation(loc: RefLocation, root: HTMLElement): RefLocation | null;
  getNextLocation(loc: RefLocation, root: HTMLElement): RefLocation | null;
  getPrevWordLocation(loc: RefLocation, root: HTMLElement): RefLocation | null;
  getNextWordLocation(loc: RefLocation, root: HTMLElement): RefLocation | null;
  getSoftLineHeadLocation(loc: RefLocation, root: HTMLElement): RefLocation;
  getSoftLineTailLocation(loc: RefLocation, root: HTMLElement): RefLocation;
  compareLocation(loca: RefLocation, locb: RefLocation): number;
  compareLocationV2(
    loca: RefLocation,
    locb: RefLocation,
    want: "left" | "right"
  ): boolean;
  makeRangeInNode(node: Node, range?: Range): Range;
  isNodeInRange(node: Node, range: Range): boolean;
  createRange(
    startContainer?: Node,
    startOffset?: number,
    endContainer?: Node,
    endOffset?: number
  ): Range;
  setRange(range: Range): void;
  clipRange(node: Node, range: Range): Range | null;
  getRects(range: Range): [DOMRect[], DOMRect];
  inSameLine(a: DOMRect, b: DOMRect): boolean;
}

export interface SelectionMethods extends RangeMethods, PositionMethods {
  C_RICH: number;
  C_RICHPAIR: number;
  token_filter?: ElementFilter;
  hint_filter?: ElementFilter;
}
