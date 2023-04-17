import { createElement } from "@helper/document";
import { Block, BlockInit, Order } from "@system/block";
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  dispatchKeyDown,
  setBeforeHandlers,
} from "@system/handler";

export interface BlockQuoteInit extends BlockInit {
  innerHTML?: string;
  children?: HTMLElement[];
}

export class BlockQuote extends Block<BlockQuoteInit> {
  constructor(init?: BlockQuoteInit) {
    init = init || {};
    if (!init.el) {
      init.el = createElement("blockquote", {});
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

export class BlockquoteHandler extends Handler implements KeyDispatchedHandler {
  block_type: string = "blockquote";
  handleKeyPress(e: KeyboardEvent, context: EventContext): boolean | void {
    dispatchKeyDown(this, e, context);
  }

  handleEnterDown(e: KeyboardEvent, { page }: EventContext): boolean | void {
    e.stopPropagation();
    e.preventDefault();
    page.appendBlock(new BlockQuote());
  }
  handleSpaceDown(e: KeyboardEvent, context: EventContext): boolean | void {
    e.stopPropagation();
    e.preventDefault();
  }
}

setBeforeHandlers(new BlockquoteHandler());
