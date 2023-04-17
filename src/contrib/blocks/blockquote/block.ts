import { createElement } from "@helper/document";
import { Block, BlockInit } from "@system/block";

export interface BlockQuoteInit extends BlockInit {
  innerHTML?: string;
  children?: HTMLElement[];
}

export class Blockquote extends Block<BlockQuoteInit> {
  constructor(init?: BlockQuoteInit) {
    init = init || {};
    if (!init.el) {
      init.el = createElement("blockquote", {
        attributes: {},
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
