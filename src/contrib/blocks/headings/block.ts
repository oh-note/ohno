import { createElement } from "@/helper/document";
import { Block, BlockInit } from "@/system/block";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingsInit extends BlockInit {
  innerHTML?: string;
  level: HeadingLevel;
  children?: HTMLElement[];
}

export class Headings extends Block<HeadingsInit> {
  type: string = "headings";
  constructor(init?: HeadingsInit) {
    init = init || { level: 2 };
    if (!init.el) {
      init.el = createElement(`h${init.level}`, {
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
