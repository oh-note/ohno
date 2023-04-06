import { addMarkdownHint } from "../helper/markdown";
import {
  Offset,
  getNextRange,
  getNextWordRange,
  getPrevRange,
  getPrevWordRange,
  isFirstLine,
  isLastLine,
  rangeToOffset,
  setPosition,
  setRange,
} from "../helper/position";
import { OperationHandlerFn } from "./operation";

export type Order = string;

export interface BlockInit {
  order?: Order;
  type?: string;
  el?: HTMLElement;
}

export class Block<T extends BlockInit> {
  el: HTMLElement;
  type: string;
  init?: T;
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

  equals(block: Block<T>) {
    return block.el === this.el;
  }

  assignOrder(order: Order) {
    this.order = order;
    this.el.setAttribute("order", order);
  }

  currentContainer() {
    // document.getSelection().focusNode
    return this.el;
  }

  getContainer(index: number) {
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
    return false;
  }
  isRight(range: Range, container?: HTMLElement): boolean {
    if (!container) {
      container = this.currentContainer();
    }
    return false;
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
    // console.log(container);
    return getPrevWordRange(container, range);
  }

  getNextWordPosition(range: Range, container?: HTMLElement): Range | null {
    if (!container) {
      container = this.currentContainer();
    }
    return getNextWordRange(container, range);
  }

  getPrevRange(range: Range, container?: HTMLElement): Range | null {
    if (!container) {
      container = this.currentContainer();
    }
    return getPrevRange(container, range);
    // return null;
  }
  getNextRange(range: Range, container?: HTMLElement): Range | null {
    if (!container) {
      container = this.currentContainer();
    }
    return getNextRange(container, range);
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
    setPosition(container, offset);
  }
  setRange(range: Range, container?: HTMLElement) {
    if (!container) {
      container = this.currentContainer();
    }
    setRange(range);
  }
}

export type AnyBlock = Block<any>;

export type BlockOperations = { [key: string]: OperationHandlerFn };
