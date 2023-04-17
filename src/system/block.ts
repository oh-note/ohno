import { addMarkdownHint } from "@helper/markdown";
import {
  Offset,
  makeBiasPos,
  offsetToRange,
  rangeToOffset,
  setOffset,
} from "./position";
import { OperationHandlerFn } from "./operation";
import {
  getNextRange,
  getNextWordRange,
  getPrevRange,
  getPrevWordRange,
  isFirstLine,
  isLastLine,
  setRange,
} from "./range";
import { getDefaultRange } from "@helper/document";
import { Page } from "./page";

export type Order = string;

export interface BlockInit {
  order?: Order;
  type?: string;
  el?: HTMLElement;
}

/**
 * Block 会默认对所有 children 添加 markdown hint
 */
export class Block<T extends BlockInit> {
  el: HTMLElement;
  type: string;
  init?: T;
  page?: Page;
  multiContainer: boolean = false;
  order: Order = "";
  constructor(init?: T) {
    const { el, type, order } = init as BlockInit;
    if (!el) {
      throw new Error("root el should be created befire constructor");
    }

    this.el = el;
    el.classList.add("oh-is-block");
    this.type = type || el.tagName.toLowerCase();
    if (order) {
      this.order = order;
    }
    this.init = init;
    addMarkdownHint(el);
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
    this.el.classList.add("active");
  }
  /**
   * 表示 block 已失去焦点
   */
  deactivate() {
    this.el.classList.remove("active");
  }
  /**
   * 表示 block 已不可见，但内部元素仍然还存在
   */
  detached() {
    this.page = undefined;
    this.deactivate();
  }

  equals(block: Block<T>) {
    return block.el === this.el;
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
    this.el.setAttribute("order", order);
  }

  currentContainer() {
    // document.getSelection().focusNode
    return this.el;
  }

  getContainer(index?: number) {
    return this.el;
  }

  leftContainer(el?: HTMLElement) {
    return null;
  }
  rightContainer(el?: HTMLElement) {
    return null;
  }
  aboveContainer(el?: HTMLElement) {
    return null;
  }
  belowContainer(el?: HTMLElement) {
    return null;
  }

  firstContainer() {
    return this.el;
  }
  lastContainer() {
    return this.el;
  }
  containers(): HTMLElement[] {
    return [this.el];
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

  getIndexOfContainer(container: HTMLElement, reversde?: boolean): number {
    if (reversde) {
      return -1;
    }
    return 0;
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

  getPrevRange(range: Range, container?: HTMLElement): Range | null {
    if (!container) {
      container = this.currentContainer();
    }
    return getPrevRange(range, container);
    // return null;
  }
  getNextRange(range: Range, container?: HTMLElement): Range | null {
    if (!container) {
      container = this.currentContainer();
    }
    return getNextRange(range, container);
  }
  getTokenSize(): number {
    return 0;
  }
  getPosition(
    range: Range,
    reversed?: boolean,
    container?: HTMLElement
  ): Offset {
    if (!container) {
      container = this.currentContainer();
    }

    const offset = rangeToOffset(container, range);
    offset.index = this.getIndexOfContainer(container);
    if (reversed) {
      return offset; // TODO should be reversed
    } else {
      return offset;
    }
  }
  getInlinePosition(range: Range, container?: HTMLElement): Offset {
    if (!container) {
      container = this.currentContainer();
    }
    return { start: 0 };
  }

  setInlinePositionAtLastLine(offset: Offset, container?: HTMLElement) {
    if (!container) {
      container = this.currentContainer();
    }
  }
  setPosition(offset: Offset, container?: HTMLElement) {
    if (!container) {
      container = this.currentContainer();
    }
    setOffset(container, offset);
  }
  setRange(range: Range) {
    setRange(range);
  }
  getOffset(): Offset {
    const root = this.currentContainer();
    const range = getDefaultRange();
    if (!range) {
      throw new Error("Cannot calculate offset without focus");
    }
    return rangeToOffset(root, range);
  }
  setOffset(offset: Offset) {
    const container = this.getContainer(offset.index);
    const range = offsetToRange(container, offset)!;
    this.setRange(range);
  }

  /**
   * 将 offset 中的负值转换为正值
   */
  correctOffset(offset: Offset): Offset {
    this.getContainer(offset.index);
    return {
      ...offset,
      start: makeBiasPos(this.getContainer(offset.index), offset.start)!,
      end: makeBiasPos(this.getContainer(offset.index), offset.end),
    };
  }
}

export type AnyBlock = Block<any>;

export type BlockOperations = { [key: string]: OperationHandlerFn };
