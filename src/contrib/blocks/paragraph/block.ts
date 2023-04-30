import { createElement } from "@/helper/document";
import { Block, BlockInit } from "@/system/block";

export interface ParagraphInit extends BlockInit {
  innerHTML?: string;
  children?: HTMLElement[];
}

export class Paragraph extends Block<ParagraphInit> {
  constructor(init?: ParagraphInit) {
    // placeholder: "type / for start"
    init = init || {};
    if (!init.el) {
      init.el = createElement("p", {
        attributes: {},
      });
    }
    if (init.innerHTML) {
      init.el.innerHTML = init.innerHTML;
    }
    if (init.children) {
      init.children.forEach((item) => {
        if (item) {
          init!.el?.appendChild(item.cloneNode(true));
        }
      });
    }

    super(init);
  }
}
