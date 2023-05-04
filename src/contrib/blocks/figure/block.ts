import {
  createElement,
  getDefaultRange,
  makeInlineBlock,
} from "@/helper/document";
import { indexOfNode, parentElementWithTag } from "@/helper/element";
import { Block, BlockInit } from "@/system/block";

export interface FigureInit extends BlockInit {
  src: string;
}

export class Figure extends Block<FigureInit> {
  type: string = "figure";
  isMultiEditable: boolean = true;
  mergeable: boolean = false;
  constructor(init?: FigureInit) {
    init = init || { src: "" };
    if (!init.el) {
      init.el = createElement("figure", {
        attributes: {},
      });
    }
    const img = createElement("img", { attributes: { src: init.src } });
    const label = createElement("label", { children: [img] });
    init.el.appendChild(label);
    super(init);
  }

  // 所有多 Container 下的 currentContainer 只考虑 range.startContainer 位置
  currentContainer() {
    // document.getSelection().focusNode
    const range = getDefaultRange();
    const container = this.findContainer(range.commonAncestorContainer);
    // const li = parentElementWithTag(range.startContainer, "figure", this.root);
    if (!container) {
      throw new Error(
        "Error when get currentContainer: focus are not in li element"
      );
    }
    return container;
  }
  findContainer(node: Node): HTMLElement | null {
    return parentElementWithTag(node, "figure", this.root);
  }
}
