import { addMarkdownHint } from "../helper/markdown";
import {
  Offset,
  getNextRange,
  getNextWordRange,
  getPrevRange,
  getPrevWordRange,
  setRange,
} from "../helper/position";
import { OperationHandlerFn } from "./operation";

export type Order = string;

export class Block {
  el: HTMLElement;
  type: string;
  order: Order = "";
  constructor(el: HTMLElement, order?: Order) {
    this.el = el;
    el.classList.add("oh-is-block");
    this.type = el.tagName.toLowerCase();
    if (order) {
      this.order = order;
    }
    addMarkdownHint(el);
  }

  assignOrder(order: Order) {
    this.order = order;
    this.el.setAttribute("order", order);
  }

  currentContainer() {
    // document.getSelection().focusNode
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
    return false;
  }
  isLastLine(range: Range, container?: HTMLElement): boolean {
    if (!container) {
      container = this.currentContainer();
    }
    return false;
  }
  getPrevWordPosition(range: Range, container?: HTMLElement): Range | null {
    if (!container) {
      container = this.currentContainer();
    }
    console.log(container);
    return getPrevWordRange(container, range);
  }

  getNextWordPosition(range: Range, container?: HTMLElement): Range | null {
    if (!container) {
      container = this.currentContainer();
    }
    return getNextWordRange(container, range);
  }

  getPrevPosition(range: Range, container?: HTMLElement): Range | null {
    if (!container) {
      container = this.currentContainer();
    }
    return getPrevRange(container, range);
    // return null;
  }
  getNextPosition(range: Range, container?: HTMLElement): Range | null {
    if (!container) {
      container = this.currentContainer();
    }
    return getNextRange(container, range);
  }
  getTokenSize(): number {
    return 0;
  }
  getPosition(reversed?: boolean, container?: HTMLElement): Offset {
    if (!container) {
      container = this.currentContainer();
    }
    if (reversed) {
      return { start: -1 };
    } else {
      return { start: 0 };
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
  }
  setRange(range: Range, container?: HTMLElement) {
    if (!container) {
      container = this.currentContainer();
    }
    setRange(range);
  }
}

export type BlockOperations = { [key: string]: OperationHandlerFn };
