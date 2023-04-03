import { createElement } from "../helper/document";
import { Block, Order } from "../system/block";
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  dispatchKeyDown,
  setBeforeHandlers,
} from "../system/handler";

export class Paragraph extends Block {
  constructor(
    el?: HTMLElement,
    order?: Order,
    innerHTML?: string,
    children?: Node[]
  ) {
    if (!el) {
      el = createElement("p", {
        attributes: { placeholder: "type / for start" },
      });
    }
    if (innerHTML) {
      el.innerHTML = innerHTML;
    }
    if (children) {
      children.forEach((item) => {
        if (item) {
          el?.appendChild(item);
        }
      });
    }
    super(el, order);
  }
}

export class ParagraphHandler extends Handler implements KeyDispatchedHandler {
  block_type: string = "p";
  handleKeyPress(e: KeyboardEvent, context: EventContext): boolean | void {
    dispatchKeyDown(this, e, context);
  }

  handleEnterDown(e: KeyboardEvent, { page }: EventContext): boolean | void {
    console.log(e);
    e.stopPropagation();
    e.preventDefault();
    page.appendBlock(new Paragraph());
  }
  handleSpaceDown(e: KeyboardEvent, context: EventContext): boolean | void {
    e.stopPropagation();
    e.preventDefault();
  }
}

setBeforeHandlers(new ParagraphHandler());
