import {
  createElement,
  getDefaultRange,
  makeInlineBlock,
} from "@ohno-editor/core/helper/document";
import {
  indexOfNode,
  parentElementWithTag,
} from "@ohno-editor/core/helper/element";
import { Block, BlockInit } from "@ohno-editor/core/system/block";

export interface FigureInit extends BlockInit {
  src: string;
}

export class Figure extends Block<FigureInit> {
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
    super("figure", init);
  }

  // 所有多 Container 下的 currentContainer 只考虑 range.startContainer 位置
  currentContainer() {
    const range = getDefaultRange();
    const container = this.findContainer(range.commonAncestorContainer);
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
