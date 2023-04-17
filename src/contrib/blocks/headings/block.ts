import { createElement } from "@helper/document";
import { Block, BlockInit} from "@system/block";
export interface HeadingsInit extends BlockInit {
  innerHTML?: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children?: HTMLElement[];
}

export class Headings extends Block<HeadingsInit> {
  constructor(init?: HeadingsInit) {
    init = init || { level: 2 };
    init.type = "headings";
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
          init!.el?.appendChild(item);
        }
      });
    }

    super(init);
  }
}
