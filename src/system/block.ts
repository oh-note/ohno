import { addMarkdownHint } from "@/helper/markdown";
import {
  Offset,
  biasToLocation,
  locationToBias,
  makeBiasPos,
  offsetAfter,
  offsetToRange,
  rangeToOffset,
  setOffset,
  tokenBetweenRange,
} from "./position";
import {
  createRange,
  getNextRange,
  getNextWordLocation,
  getNextWordRange,
  getPrevLocation,
  getPrevRange,
  getPrevWordRange,
  getSoftLineHead,
  getSoftLineTail,
  isFirstLine,
  isLastLine,
  locationInFirstLine,
  locationInLastLine,
  normalizeRange,
  setRange,
} from "./range";
import { getDefaultRange } from "@/helper/document";
import { Page } from "./page";
import { BLOCK_CLASS } from "./config";
import { ValidNode, isParent } from "@/helper/element";
import { getNextLocation } from "./range";
import { getPrevWordLocation } from "./range";

export type Order = string;

export interface BlockInit {
  order?: Order;
  el?: HTMLElement;
  raw?: boolean;
}

/**
 * Block 会默认对所有 children 添加 markdown hint
 */
export class Block<T extends BlockInit> {
  root: HTMLElement;
  type: string = "";
  init: T;
  page?: Page;
  multiContainer: boolean = false;
  mergeable: boolean = true; // 表格、图片、公式复杂组件等视为独立的 unmergeable，multiblock 下只删除内容，不删除 container
  order: Order = "";
  constructor(init: T) {
    const { el, order } = init as BlockInit;
    if (!el) {
      throw new Error("root el should be created befire constructor");
    }
    if (this.type === "") {
      this.type = el.tagName.toLowerCase();
    }

    this.root = el;
    el.classList.add(BLOCK_CLASS);

    if (order) {
      this.order = order;
    }

    this.init = init;
    if (!init?.raw) {
      addMarkdownHint(el);
    }
  }

  public get edit_root(): HTMLElement {
    return this.root;
  }

  /**
   * attached 表示 block 已渲染
   * @param page
   */
  attached(page: Page) {
    this.page = page;
  }
  /**
   * Activate 表示 block 存在焦点，焦点在 block 的具体位置在 block 内部处理
   * @param page
   */
  activate(page?: Page) {
    if (page) {
      this.page = page;
    }
    this.root.classList.add("active");
  }
  /**
   * 表示 block 已失去焦点
   */
  deactivate() {
    this.root.classList.remove("active");
  }
  /**
   * 表示 block 已不可见，但内部元素仍然还存在
   */
  detached() {
    this.page = undefined;
    this.deactivate();
  }

  equals(block: Block<T>) {
    return block.root === this.root;
  }

  assignOrder(order: Order, left?: string, right?: string) {
    if (this.order) {
      if ((left && left > this.order) || (right && right > this.order)) {
        throw new Error(
          "old order not match" + `${this.order}, ${order} ${left} ${right}`
        );
      }
      return;
    }
    this.order = order;
    this.root.setAttribute("order", order);
  }

  currentContainer() {
    // document.getSelection().focusNode
    return this.edit_root;
  }

  findContainer(node: Node): HTMLElement | null {
    return this.edit_root;
  }

  getContainer(index?: number): HTMLElement {
    return this.edit_root;
  }

  leftContainer(el?: HTMLElement): HTMLElement | null {
    return null;
  }
  rightContainer(el?: HTMLElement): HTMLElement | null {
    return null;
  }
  aboveContainer(el?: HTMLElement): HTMLElement | null {
    return null;
  }
  belowContainer(el?: HTMLElement): HTMLElement | null {
    return null;
  }
  nextContainer(el?: HTMLElement): HTMLElement | null {
    return null;
  }
  prevContainer(el?: HTMLElement): HTMLElement | null {
    return null;
  }

  firstContainer(): HTMLElement {
    return this.edit_root;
  }
  lastContainer(): HTMLElement {
    return this.edit_root;
  }
  containers(): HTMLElement[] {
    return [this.edit_root];
  }

  getIndexOfContainer(container: HTMLElement, reversde?: boolean): number {
    if (reversde) {
      return -1;
    }
    return 0;
  }

  isLeft(range: Range, container?: HTMLElement): boolean {
    if (!container) {
      container = this.currentContainer();
    }
    if (getPrevRange(range, container)) {
      return false;
    }
    return true;
  }
  isRight(range: Range, container?: HTMLElement): boolean {
    if (!container) {
      container = this.currentContainer();
    }
    if (getNextRange(range, container)) {
      return false;
    }
    return true;
  }

  isFirstLine(range: Range, container?: HTMLElement): boolean {
    if (!container) {
      container = this.currentContainer();
    }
    return isFirstLine(container, range);
  }

  isLastLine(range: Range, container?: HTMLElement): boolean {
    if (!container) {
      container = this.currentContainer();
    }

    return isLastLine(container, range);
  }

  locationInFirstLine(cur: Node, curOffset: number) {
    const container = this.findContainer(cur);
    if (!container) {
      throw new EditableNotFound(cur, this.order);
    }
    return locationInFirstLine(container, cur, curOffset);
  }

  locationInLastLine(cur: Node, curOffset: number) {
    const container = this.findContainer(cur);
    if (!container) {
      throw new EditableNotFound(cur, this.order);
    }
    return locationInLastLine(container, cur, curOffset);
  }

  getPrevWordPosition(range: Range, container?: HTMLElement): Range | null {
    if (!container) {
      container = this.currentContainer();
    }

    return getPrevWordRange(range, container);
  }

  getNextWordPosition(range: Range, container?: HTMLElement): Range | null {
    if (!container) {
      container = this.currentContainer();
    }
    return getNextWordRange(range, container);
  }

  getPrevLocation(cur: Node, curOffset: number) {
    const container = this.findContainer(cur);
    if (!container) {
      throw new EditableNotFound(cur, this.order);
    }
    return getPrevLocation(cur, curOffset, container);
  }
  getNextLocation(cur: Node, curOffset: number) {
    const container = this.findContainer(cur);
    if (!container) {
      throw new EditableNotFound(cur, this.order);
    }
    return getNextLocation(cur, curOffset, container);
  }

  getPrevWordLocation(cur: Node, curOffset: number) {
    const container = this.findContainer(cur);
    if (!container) {
      throw new EditableNotFound(cur, this.order);
    }
    return getPrevWordLocation(cur, curOffset, container);
  }
  getNextWordLocation(cur: Node, curOffset: number) {
    const container = this.findContainer(cur);
    if (!container) {
      throw new EditableNotFound(cur, this.order);
    }
    return getNextWordLocation(cur, curOffset, container);
  }

  getPrevRange(range: Range, container?: HTMLElement): Range | null {
    if (!container) {
      container = this.currentContainer();
    }
    return getPrevRange(range, container);
    // return null;
  }
  getNextRange(range: Range, container?: HTMLElement): Range | null {
    if (!container) {
      container = this.findContainer(range.startContainer)!;
      if (!container) {
        throw new Error("Sanity check");
      }
    }
    return getNextRange(range, container);
  }
  getTokenSize(): number {
    return 0;
  }

  setRange(range: Range) {
    setRange(range);
  }

  getIndex(container?: HTMLElement): number {
    if (!container) {
      container = this.currentContainer();
    }
    return this.getIndexOfContainer(container);
  }

  getRange(offset: Offset) {
    const container = this.getContainer(offset.index);
    return offsetToRange(container, offset);
  }

  getLocation(
    bias: number,
    { index, container }: { index?: number; container?: HTMLElement }
  ): [Node, number] | null {
    if (!container) {
      container = this.getContainer(index);
    }
    if (!container) {
      throw new EditableNotFound();
    }

    const result = biasToLocation(container, bias);
    if (!result) {
      return null;
    }
    return result;
  }

  getBias(cur: Node, curOffset: number): number {
    const container = this.findContainer(cur);
    if (!container) {
      throw new EditableNotFound(cur, this.order);
    }
    return locationToBias(container, cur as ValidNode, curOffset);
  }

  getLocalBias = this.getBias;

  getGlobalBias(cur: ValidNode, curOffset: number): number {
    return locationToBias(this.edit_root, cur, curOffset);
  }

  getSoftLineBias(cur: Node, curOffset: number): number {
    const container = this.findContainer(cur)!;
    if (!container) {
      throw new EditableNotFound(cur, this.order);
    }

    const [node, offset] = getSoftLineHead(cur, curOffset, container)!;
    const toHeadRange = createRange(node, offset, cur, curOffset);
    return tokenBetweenRange(toHeadRange);
  }

  getSoftLineHead(cur: Node, curOffset: number): [Node, number] {
    const container = this.findContainer(cur);
    if (!container) {
      throw new EditableNotFound(cur, this.order);
    }

    return getSoftLineHead(cur, curOffset, container);
  }

  getSoftLineTail(cur: Node, curOffset: number): [Node, number] {
    const container = this.findContainer(cur);
    if (!container) {
      throw new EditableNotFound(cur, this.order);
    }

    return getSoftLineTail(cur, curOffset, container);
  }

  getSoftLineLocation(
    anchor: Node,
    anchorOffset: number,
    bias: number
  ): [Node, number] | null {
    const container = this.findContainer(anchor);
    if (!container) {
      throw new EditableNotFound(anchor, this.order);
    }
    const [node, offset] = getSoftLineHead(anchor, anchorOffset, container)!;

    const [tgt, tgtOffset] = offsetAfter(node as ValidNode, offset, bias);
    if (!isParent(tgt, container)) {
      return null;
    }
    return [tgt, tgtOffset];
  }

  // setSoftLine(cur: Node, curOffset: number, bias: number) {}

  // getLocation(offset:Offset){

  // }

  // 设置当前行的第 n 个
  setSoftLineWithRange(range: Range, bias: number) {
    if (!range) {
      range = getDefaultRange();
    }
    if (!range) {
      throw new NoRangeError();
    }
    const container = this.findContainer(range.commonAncestorContainer)!;
    if (!container) {
      throw new Error(
        "should not getOffset in block when range expands multi container."
      );
    }

    const [node, offset] = getSoftLineHead(
      range.startContainer,
      range.startOffset,
      container
    )!;

    const [tgt, tgtOffset] = offsetAfter(node as ValidNode, offset, bias);
    if (!isParent(tgt, container)) {
      setOffset(container, { start: -1 });
    } else {
      const tgtRange = createRange(tgt, tgtOffset);
      setRange(tgtRange);
    }
  }

  getSoftLineBiasWithRange(range?: Range): number {
    if (!range) {
      range = getDefaultRange();
    }
    if (!range) {
      throw new NoRangeError();
    }
    const container = this.findContainer(range.commonAncestorContainer)!;
    if (!container) {
      throw new Error(
        "should not getOffset in block when range expands multi container."
      );
    }

    const [node, offset] = getSoftLineHead(
      range.startContainer,
      range.startOffset,
      container
    )!;
    // const index = this.getIndexOfContainer(container);
    const toHeadRange = createRange(
      node,
      offset,
      range.startContainer,
      range.startOffset
    );
    return tokenBetweenRange(toHeadRange);
  }

  getGlobalOffset(range?: Range) {
    if (!range) {
      range = getDefaultRange();
    }
    if (!range) {
      throw new NoRangeError();
    }
    const offset = rangeToOffset(this.edit_root, range);
    return offset;
  }
  getOffset(range?: Range): Offset {
    if (!range) {
      range = getDefaultRange();
    }
    if (!range) {
      throw new NoRangeError();
    }
    const container = this.findContainer(range.commonAncestorContainer);
    if (!container) {
      throw new Error(
        "should not getOffset in block when range expands multi container."
      );
    }
    const index = this.getIndexOfContainer(container);

    const offset = rangeToOffset(container, range);
    offset.index = index;
    return offset;
  }

  setGlobalOffset(offset: Offset) {
    setOffset(this.edit_root, offset);
  }

  setLocalOffset(
    container: HTMLElement,
    offset: Offset,
    defaultOffset?: Offset
  ) {
    if (!isParent(container, this.edit_root)) {
      throw new Error("Container is not child of block root.");
    }
    let range = offsetToRange(container, offset);
    if (!range) {
      if (!defaultOffset) {
        throw new Error("Cannot get range by given offset and container");
      }
      range = offsetToRange(container, defaultOffset)!;
    }
    setRange(range);
  }

  setOffset(offset: Offset, defaultOffset?: Offset) {
    const container = this.getContainer(offset.index);
    if (!container) {
      throw new Error(
        `${offset.index} can not specify a container in ${this.edit_root}`
      );
    }
    let range = offsetToRange(container, offset);
    if (!range) {
      if (!defaultOffset) {
        throw new Error("Cannot get range by given offset and container");
      }
      range = offsetToRange(container, defaultOffset)!;
    }
    this.setRange(range);
  }

  /**
   * 将 offset 中的负值转换为正值
   */
  correctOffset(offset: Offset): Offset {
    this.getContainer(offset.index);
    const container = this.getContainer(offset.index);
    if (!container) {
      throw new Error("container not found");
    }
    return {
      ...offset,
      start: makeBiasPos(container, offset.start)!,
      end: makeBiasPos(container, offset.end),
    };
  }
}

export type AnyBlock = Block<any>;
