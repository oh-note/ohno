import { createElement } from "../../helper/document";
import { Block, BlockInit, Order } from "../../system/block";
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  dispatchKeyDown,
  setBeforeHandlers,
} from "../../system/handler";

export interface ParagraphInit extends BlockInit {
  innerHTML?: string;
  children?: HTMLElement[];
}

export class Paragraph extends Block<ParagraphInit> {
  constructor(init?: ParagraphInit) {
    init = init || {};
    if (!init.el) {
      init.el = createElement("p", {
        attributes: { placeholder: "type / for start" },
      });
    }
    if (init.innerHTML) {
      init.el.innerHTML = init.innerHTML;
    }
    if (init.children) {
      init.children.forEach((item) => {
        if (item) {
          init!.el?.appendChild(item);
        }
      });
    }
    super(init);
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
