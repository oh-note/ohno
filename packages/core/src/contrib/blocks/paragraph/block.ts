import { createElement } from "@/helper/document";
import { BlockSerializedData } from "@/system/base";
import { Block, BlockInit } from "@/system/block";

export interface ParagraphInit extends BlockInit {
  innerHTML?: string;
  children?: HTMLElement[];
}

export class Paragraph extends Block<ParagraphInit> {
  constructor(init?: ParagraphInit) {
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

    super("paragraph", init);
  }
  serialize(option?: any): BlockSerializedData<ParagraphInit> {
    const init = { innerHTML: this.inner.innerHTML };
    return [{ type: this.type, init }];
  }
}
