import { createElement } from "../../helper/document";
import { Block, BlockInit, Order } from "../../system/block";
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  dispatchKeyDown,
  setBeforeHandlers,
} from "../../system/handler";
import { Paragraph } from "./paragraph";

export interface HeadingsInit extends BlockInit {
  innerHTML?: string;
  children?: HTMLElement[];
  level: "h1" | "h2" | "h3" | "h4" | "h5";
}

export class Headings extends Block<HeadingsInit> {
  constructor(init?: HeadingsInit) {
    init = init || { level: "h2" };
    init.type = "heading";
    if (!init.el) {
      init.el = createElement(init.level, {});
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
  block_type: string = "heading";
  constructor(name: string) {
    super();
    this.block_type = name;
  }
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

setBeforeHandlers(new BlockquoteHandler("heading"));
// setBeforeHandlers(new BlockquoteHandler("h1"));
// setBeforeHandlers(new BlockquoteHandler("h2"));
// setBeforeHandlers(new BlockquoteHandler("h3"));
// setBeforeHandlers(new BlockquoteHandler("h4"));
// setBeforeHandlers(new BlockquoteHandler("h5"));
