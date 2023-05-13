// 实现 block 的基本接口和默认行为
import { addMarkdownHint } from "@/helper/markdown";
import {
  biasToLocation,
  locationToBias,
  offsetAfter,
  tokenBetweenRange,
} from "./position";
import {
  RefLocation,
  createRange,
  getNextWordLocation,
  getNextWordRange,
  getPrevLocation,
  getPrevWordRange,
  getSoftLineHead,
  getSoftLineTail,
  locationInFirstLine,
  locationInLastLine,
  normalizeRange,
  validateLocation,
} from "./range";
import { Page } from "./page";
import { BLOCK_CLASS } from "./config";
import {
  ElementFilter,
  ValidNode,
  isParent,
  outerHTML,
} from "@/helper/element";
import { getNextLocation } from "./range";
import { getPrevWordLocation } from "./range";
import {
  BlockSerializedData,
  EditableFlag,
  EditableInterval,
  IBlock,
  IComponent,
  Interval,
  Order,
} from "./base";

export interface BlockInit {
  order?: Order;
  el?: HTMLElement;
  raw?: boolean;
}

/**
 * Block 会默认对所有 children 添加 markdown hint
 */
export class Block<T extends BlockInit> implements IBlock {
  root: HTMLElement;
  type: string = "";
  init: T;
  page?: Page;
  isMultiEditable: boolean = false;
  mergeable: boolean = true; // 表格、图片、公式复杂组件等视为独立的 unmergeable，multiblock 下只删除内容，不删除 editable
  order: Order = "";
  parent?: Page | undefined;

  constructor(type: string, init: T) {
    const { el, order } = init as BlockInit;
    if (!el) {
      throw new Error("root el should be created befire constructor");
    }

    this.type = type;
    this.root = el;
    el.classList.add(BLOCK_CLASS);
    el.classList.add(this.type);
    el.setAttribute("type", this.type);

    if (order) {
      this.order = order;
    }

    this.init = init;
    if (!init?.raw) {
      addMarkdownHint(el);
    }
  }

  getFirstEditable(): HTMLElement {
    return this.inner;
  }
  getLastEditable(): HTMLElement {
    return this.inner;
  }

  getGlobalLocation(bias: number): RefLocation | null {
    return biasToLocation(this.inner, bias);
  }

  public get outer(): HTMLElement {
    return this.root;
  }

  public get inner(): HTMLElement {
    return this.root;
  }
  setParent(parent?: Page): void {
    this.parent = parent;
  }

  serialize(option?: any): BlockSerializedData<T> {
    return [{ type: this.type, init: this.init }];
  }

  equals(component?: IComponent | undefined): boolean {
    return component !== undefined && component.root === this.root;
  }
  clone(): IBlock {
    throw new Error("Method not implemented.");
  }
  detach(): void {
    this.root.remove();
  }

  setOrder(order: string): void {
    if (order === "") {
      this.order = "";
      return;
    }
    if (this.order) {
      // if ((left && left > this.order) || (right && right > this.order)) {
      //   throw new Error(
      //     "old order not match" + `${this.order}, ${order} ${left} ${right}`
      //   );
      // }
      return;
    }
    this.order = order;
    this.root.setAttribute("order", order);
  }

  getCurrentEditable(): HTMLElement {
    return this.inner;
  }

  getEditables(
    start?: number | undefined,
    end?: number | undefined
  ): HTMLElement[] {
    return [this.inner];
  }

  getEditableIndex(editable: HTMLElement): number {
    return 0;
  }

  getEditable(flag: EditableFlag): HTMLElement {
    return this.inner;
  }
  findEditableIndex(node: Node): number {
    const editable = this.findEditable(node, true);
    return this.getEditableIndex(editable);
  }
  findEditable(node: Node): HTMLElement | null;
  findEditable(node: Node, raise?: boolean): HTMLElement;
  findEditable(node: Node, raise?: boolean): HTMLElement | null {
    if (isParent(node, this.inner)) {
      return this.inner;
    }
    if (raise) {
      throw new Error("editable not found");
    }
    return null;
  }
  getNextEditable(editable: HTMLElement): HTMLElement | null {
    return null;
  }
  getPrevEditable(editable: HTMLElement): HTMLElement | null {
    return null;
  }
  getLeftEditable(editable: HTMLElement): HTMLElement | null {
    return null;
  }
  getRightEditable(editable: HTMLElement): HTMLElement | null {
    return null;
  }
  getAboveEditable(editable: HTMLElement): HTMLElement | null {
    return null;
  }
  getBelowEditable(editable: HTMLElement): HTMLElement | null {
    return null;
  }

  getRangeLegend(
    start: [number, EditableFlag],
    end?: [number, EditableFlag] | undefined
  ): Range | null {
    const startLoc = this.getLocation(...start);
    const endLoc = end ? this.getLocation(...end) : startLoc;
    if (!startLoc || !endLoc) {
      return null;
    }
    return createRange(...startLoc, ...endLoc);
  }

  getEditableRange(interval: EditableInterval): Range | null {
    return this.getRange(interval, interval.index);
  }

  /**
   *
   * @param interval
   * @param query
   */
  getRange(interval: Interval, query: EditableFlag): Range | null;
  getRange(interval: Interval): Range | null;
  getRange(interval: Interval, query?: EditableFlag): Range | null {
    const editable = query ? this.getEditable(query) : this.inner;
    if (!editable) {
      throw new Error("editable not found.");
    }
    const start = biasToLocation(editable, interval.start);
    const end = biasToLocation(editable, interval.end);
    if (!start || !end) {
      return null;
    }
    return createRange(...start, ...end);
  }

  getLocation(
    bias: number,
    query: EditableFlag,
    token_filter?: ElementFilter
  ): RefLocation | null {
    const editable = this.getEditable(query);
    if (!editable) {
      throw new Error("editable not found.");
    }
    let result = biasToLocation(editable, bias, token_filter);
    if (!result) {
      return null;
    }
    if (result[0] === editable) {
      result = validateLocation(...result);
    }

    return result;
  }

  getBias(loc: RefLocation, token_filter?: ElementFilter): number {
    const editable = this.findEditable(loc[0]);
    if (!editable) {
      throw new Error("editable not found");
    }
    return locationToBias(editable, ...loc, token_filter);
  }

  getGlobalBias(loc: RefLocation): number {
    return locationToBias(this.inner, ...loc);
  }
  getSoftLineBias(loc: RefLocation): number {
    const editable = this.findEditable(loc[0])!;
    if (!editable) {
      throw new Error("editable not found");
    }

    const [node, offset] = getSoftLineHead(...loc, editable)!;
    const toHeadRange = createRange(node, offset, ...loc);
    return tokenBetweenRange(toHeadRange);
  }
  getSoftLineHead(loc: RefLocation): RefLocation {
    const editable = this.findEditable(loc[0])!;
    if (!editable) {
      throw new Error("editable not found");
    }

    return getSoftLineHead(...loc, editable);
  }
  getSoftLineTail(loc: RefLocation): RefLocation {
    const editable = this.findEditable(loc[0])!;
    if (!editable) {
      throw new Error("editable not found");
    }
    return getSoftLineTail(...loc, editable);
  }
  getSoftLineLocation(loc: RefLocation, bias: number): RefLocation | null {
    const editable = this.findEditable(loc[0])!;
    if (!editable) {
      throw new Error("editable not found");
    }

    const [node, offset] = getSoftLineHead(...loc, editable)!;

    const [tgt, tgtOffset] = offsetAfter(node as ValidNode, offset, bias);
    if (!isParent(tgt, editable)) {
      return null;
    }
    return [tgt, tgtOffset];
  }

  isLocationInLeft(loc: RefLocation): boolean {
    const [cur, curOffset] = loc;
    const editable = this.findEditable(cur);
    if (!editable) {
      throw new Error("editable not found.");
    }

    if (getPrevLocation(...loc, editable)) {
      return false;
    }
    return true;
  }
  isLocationInRight(loc: RefLocation): boolean {
    const [cur, curOffset] = loc;
    const editable = this.findEditable(cur);
    if (!editable) {
      throw new Error("editable not found.");
    }
    if (getNextLocation(...loc, editable)) {
      return false;
    }
    return true;
  }
  isLocationInFirstLine(loc: RefLocation): boolean {
    const [cur, curOffset] = loc;
    const editable = this.findEditable(cur);
    if (!editable) {
      throw new Error("editable not found.");
    }

    return locationInFirstLine(editable, ...loc);
  }
  isLocationInLastLine(loc: RefLocation): boolean {
    const [cur, curOffset] = loc;
    const editable = this.findEditable(cur);
    if (!editable) {
      throw new Error("editable not found.");
    }
    return locationInLastLine(editable, ...loc);
  }

  getPrevWordPosition(range: Range, editable?: HTMLElement): Range | null {
    if (!editable) {
      editable = this.getCurrentEditable();
    }

    return getPrevWordRange(range, editable);
  }

  getNextWordPosition(range: Range, editable?: HTMLElement): Range | null {
    if (!editable) {
      editable = this.getCurrentEditable();
    }
    return getNextWordRange(range, editable);
  }

  getPrevLocation(ref: RefLocation): RefLocation | null {
    const [cur, curOffset] = ref;
    const editable = this.findEditable(cur);
    if (!editable) {
      throw new EditableNotFound(cur, this.order);
    }
    return getPrevLocation(cur, curOffset, editable);
  }
  getNextLocation(ref: RefLocation) {
    const [cur, curOffset] = ref;
    const editable = this.findEditable(cur);
    if (!editable) {
      throw new EditableNotFound(cur, this.order);
    }
    return getNextLocation(cur, curOffset, editable);
  }

  getPrevWordLocation(ref: RefLocation): RefLocation | null {
    const [cur, curOffset] = ref;
    const editable = this.findEditable(cur);
    if (!editable) {
      throw new EditableNotFound(cur, this.order);
    }
    return getPrevWordLocation(cur, curOffset, editable);
  }
  getNextWordLocation(ref: RefLocation): RefLocation | null {
    const [cur, curOffset] = ref;
    const editable = this.findEditable(cur);
    if (!editable) {
      throw new EditableNotFound(cur, this.order);
    }
    return getNextWordLocation(cur, curOffset, editable);
  }
  toMarkdown(range?: Range | undefined): string {
    if (!range || range.collapsed) {
      return this.inner.textContent || "";
    } else {
      return range.cloneContents().textContent || "";
    }
  }
  toHTML(range?: Range): string {
    return outerHTML(this.inner);
  }
}

export type AnyBlock = Block<any>;
