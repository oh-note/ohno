// 实现 block 的基本接口和默认行为
import { addMarkdownHint } from "@ohno-editor/core/helper/markdown";
import { biasToLocation } from "./position";
import { createRange, validateLocation } from "./range";
import { Page } from "./page";
import { BLOCK_CLASS } from "./config";
import {
  ElementFilter,
  ValidNode,
  isParent,
  outerHTML,
} from "@ohno-editor/core/helper/element";
import {
  EditableFlag,
  EditableInterval,
  IBlock,
  IComponent,
  Interval,
  Order,
} from "./base";
import { RefLocation, RichSelection, SelectionMethods } from "./selection";
import { ChildrenData } from "../helper/document";
import { InlineData } from "./inline";

export interface BlockData {}

export type BlockOption<T> = {
  meta: T;
  plain?: boolean;
};

/**
 * Block 会默认对所有 children 添加 markdown hint
 */
export abstract class Block<T extends BlockData = BlockData> implements IBlock {
  root!: HTMLElement;
  type: string = "";
  meta: T;

  page!: Page;
  isMultiEditable: boolean = false;
  mergeable: boolean = true; // 表格、图片、公式复杂组件等视为独立的 unmergeable，multiblock 下只删除内容，不删除 editable
  order: Order = "";
  parent?: Page | undefined;

  selection: SelectionMethods = new RichSelection();

  status: { [key: string]: any } = {};

  option?: BlockOption<T>;
  data: T;
  constructor(type: string, data: T, option?: BlockOption<T>) {
    const { plain, meta } = option || {};
    this.data = data;
    this.type = type;
    this.option = option;
    this.meta = meta || ({} as T);
  }

  initialize() {
    const { plain } = this.option || {};
    const root = this.render(this.data);
    this.root = root;
    root.classList.add(BLOCK_CLASS);
    root.classList.add(this.type);
    root.dataset["type"] = this.type;

    if (!plain) {
      addMarkdownHint(root);
    }
    this.lazy_render()
      .then(() => {})
      .catch(() => {})
      .finally(() => {});
  }

  abstract render(data: T): HTMLElement;
  async lazy_render(): Promise<void> {}

  public get serializer(): BlockSerializer<Block<T>> {
    return this.page.getBlockSerializer(this.type);
  }

  deserializeInline(data?: InlineData): ChildrenData {
    if (!data) {
      return [];
    }
    return this.page.inlineSerializerV2.deserialize(data);
  }

  setParent(parent?: Page): void {
    this.parent = parent;
    this.page = parent!;
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

  setDataset(key: string, value?: string) {
    this.root.dataset[key] = value;
  }

  setStatus(key: string, value: any) {
    this.status[key] = value;
  }
  getStatus<T>(key: string) {
    return this.status[key] as T;
  }
  hasStatus(key: string) {
    return key in this.status;
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
    this.setDataset("order", order);
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
    const start = this.selection.biasToLocation(editable, interval.start);
    const end = this.selection.biasToLocation(editable, interval.end);
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

    const old_filter = this.selection.token_filter;
    this.selection.token_filter = token_filter || old_filter;
    let result = this.selection.biasToLocation(editable, bias);
    this.selection.token_filter = old_filter;
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
    const old_filter = this.selection.token_filter;
    this.selection.token_filter = token_filter || old_filter;
    const bias = this.selection.locationToBias(editable, loc);
    this.selection.token_filter = old_filter;
    return bias;
  }

  getGlobalBiasPair(loc: RefLocation): [number, number] {
    const index = this.findEditableIndex(loc[0]);
    const bias = this.getBias(loc);
    return [bias, index];
  }

  getSoftLineBias(loc: RefLocation): number {
    const editable = this.findEditable(loc[0])!;
    if (!editable) {
      throw new Error("editable not found");
    }

    const [node, offset] = this.getSoftLineHead(loc)!;
    const toHeadRange = this.selection.createRange(node, offset, ...loc);
    return this.selection.tokenBetweenRange(toHeadRange);
  }
  getSoftLineHead(loc: RefLocation): RefLocation {
    const editable = this.findEditable(loc[0])!;
    if (!editable) {
      throw new Error("editable not found");
    }
    return this.selection.getSoftLineHeadLocation(loc, editable);
  }
  getSoftLineTail(loc: RefLocation): RefLocation {
    const editable = this.findEditable(loc[0])!;
    if (!editable) {
      throw new Error("editable not found");
    }
    return this.selection.getSoftLineTailLocation(loc, editable);
  }
  getSoftLineLocation(loc: RefLocation, bias: number): RefLocation | null {
    const editable = this.findEditable(loc[0])!;
    if (!editable) {
      throw new Error("editable not found");
    }

    const [node, offset] = this.getSoftLineHead(loc)!;

    const [tgt, tgtOffset] = this.selection.offsetAfter(
      node as ValidNode,
      offset,
      bias
    );
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

    if (this.getPrevLocation(loc)) {
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
    if (this.getNextLocation(loc)) {
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

    return this.selection.locationInFirstLine(loc, editable);
  }
  isLocationInLastLine(loc: RefLocation): boolean {
    const [cur, curOffset] = loc;
    const editable = this.findEditable(cur);
    if (!editable) {
      throw new Error("editable not found.");
    }
    return this.selection.locationInLastLine(loc, editable);
  }

  getPrevLocation(ref: RefLocation): RefLocation | null {
    const [cur, curOffset] = ref;
    const editable = this.findEditable(cur);
    if (!editable) {
      throw new EditableNotFound(cur, this.order);
    }
    return this.selection.getPrevLocation(ref, editable);
  }
  getNextLocation(ref: RefLocation) {
    const [cur, curOffset] = ref;
    const editable = this.findEditable(cur);
    if (!editable) {
      throw new EditableNotFound(cur, this.order);
    }
    return this.selection.getNextLocation([cur, curOffset], editable);
  }

  getPrevWordLocation(ref: RefLocation): RefLocation | null {
    const [cur, curOffset] = ref;
    const editable = this.findEditable(cur);
    if (!editable) {
      throw new EditableNotFound(cur, this.order);
    }
    return this.selection.getPrevWordLocation([cur, curOffset], editable);
  }
  getNextWordLocation(ref: RefLocation): RefLocation | null {
    const [cur, curOffset] = ref;
    const editable = this.findEditable(cur);
    if (!editable) {
      throw new EditableNotFound(cur, this.order);
    }
    return this.selection.getNextWordLocation([cur, curOffset], editable);
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

export interface BlockSerializer<T extends Block> {
  setPage(page: Page): void;
  toMarkdown(block: T): string;
  toHTML(block: T): string;
  toJson(block: T): BlockSerializedData<T["meta"]>;
  serialize(block: T, type: "markdown"): string;
  serialize(block: T, type: "html"): string;
  serialize(block: T, type: "json"): BlockSerializedData<T["meta"]>;
  serializePart(block: T, clipedRange: Range, type: "markdown"): string;
  serializePart(block: T, clipedRange: Range, type: "html"): string;
  serializePart(
    block: T,
    clipedRange: Range,
    type: "json"
  ): BlockSerializedData<T["meta"]>;

  deserialize(data: BlockSerializedData<T["meta"]>): T;
}

export type BlockSerializedData<T extends BlockData = BlockData> = {
  type: string;
  data: T;
  dataset?: { [key: string]: any; order?: never; type?: never };
};

export type InRangeEditable = {
  start?: Node[];
  startEditable: HTMLElement;
  full?: HTMLElement[];
  end?: Node[];
  endEditable: HTMLElement;
};
export abstract class BaseBlockSerializer<T extends Block>
  implements BlockSerializer<T>
{
  page!: Page;
  setPage(page: Page) {
    this.page = page;
  }

  abstract toMarkdown(block: T): string;
  abstract toJson(block: T): BlockSerializedData<T["meta"]>;

  partToMarkdown(block: T, range: Range): string {
    return this.toMarkdown(block);
  }
  partToJson(block: T, range: Range): BlockSerializedData<T["meta"]> {
    return this.toJson(block);
  }

  rangedEditable(block: T, range: Range): InRangeEditable {
    if (block.selection.isNodeInRange(block.root, range)) {
      return {
        full: block.getEditables(),
        startEditable: block.getFirstEditable(),
        endEditable: block.getLastEditable(),
      };
    }

    let startEditable = block.findEditable(range.startContainer);
    let endEditable = block.findEditable(range.endContainer);
    const startFull = startEditable === null;
    const endFull = endEditable === null;
    if (!startEditable) {
      startEditable = block.getFirstEditable();
    }
    if (!endEditable) {
      endEditable = block.getLastEditable();
    }
    const res: InRangeEditable = { startEditable, endEditable };
    let cur = startEditable;
    const full = [];

    if (startEditable === endEditable) {
      if (startFull && endFull) {
        full.push(startEditable);
      } else if (startFull && !endFull) {
        const clipedRange = block.selection.clipRange(startEditable, range)!;
        res.end = Array.from(clipedRange.cloneContents().childNodes);
      } else {
        // !startFull && endFull
        // !startFull && !endFull
        const clipedRange = block.selection.clipRange(startEditable, range)!;
        res.start = Array.from(clipedRange.cloneContents().childNodes);
      }
    } else {
      if (startFull) {
        full.push(startEditable);
      } else {
        const clipedRange = block.selection.clipRange(startEditable, range)!;
        res.start = Array.from(clipedRange.cloneContents().childNodes);
      }
      while (cur && cur !== endEditable) {
        cur = block.getNextEditable(cur)!;
        if (cur && cur !== endEditable) {
          full.push(cur);
        }
      }
      if (endFull) {
        full.push(endEditable);
      } else {
        const clipedRange = block.selection.clipRange(endEditable, range)!;
        res.end = Array.from(clipedRange.cloneContents().childNodes);
      }
    }
    if (full.length > 0) {
      res.full = full;
    }
    return res;
  }

  toHTML(block: T): string {
    return outerHTML(block.root);
  }

  outerHTML(...node: Node[]): string {
    return outerHTML(...node);
  }

  public get serializeInline() {
    return this.page.inlineSerializerV2.serialize.bind(
      this.page.inlineSerializerV2
    );
  }

  serialize(block: T, type: "markdown"): string;
  serialize(block: T, type: "html"): string;
  serialize(block: T, type: "json"): BlockSerializedData<T["meta"]>;
  serialize(block: T, type: "markdown" | "html" | "json"): any {
    if (type === "markdown") {
      return this.toMarkdown(block);
    } else if (type === "html") {
      return this.toHTML(block);
    } else if (type === "json") {
      return this.toJson(block);
    }
    throw new Error("not implemented");
  }

  serializePart(block: T, range: Range, type: "markdown"): string;
  serializePart(block: T, range: Range, type: "html"): string;
  serializePart(
    block: T,
    range: Range,
    type: "json"
  ): BlockSerializedData<T["meta"]>;

  serializePart(
    block: T,
    range: Range,
    type: "markdown" | "html" | "json"
  ): any {
    if (type === "markdown") {
      return this.partToMarkdown(block, range);
    } else if (type === "html") {
      return this.outerHTML(...Array.from(range.cloneContents().childNodes));
    } else if (type === "json") {
      return this.partToJson(block, range);
    }
    throw new Error("not implemented");
  }

  abstract deserialize(data: BlockSerializedData<T["meta"]>): T;
}
