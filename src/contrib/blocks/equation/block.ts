import { createElement, getDefaultRange } from "@/helper/document";
import { indexOfNode, parentElementWithTag } from "@/helper/element";
import { Block, BlockInit } from "@/system/block";
import katex from "katex";
export interface EquationInit extends BlockInit {
  src: string;
}

export class Equation extends Block<EquationInit> {
  type: string = "equation";
  multiContainer: boolean = true;
  mergeable: boolean = false;
  constructor(init?: EquationInit) {
    init = init || { src: "" };
    if (!init.el) {
      init.el = createElement("pre", {
        attributes: {},
      });
    }

    const html = katex.renderToString(init.src, {
      displayMode: true,
      output: "mathml",
    });
    const math = createElement("math", { innerHTML: html });
    init.el.appendChild(math);
    super(init);
  }

  // 所有多 Container 下的 currentContainer 只考虑 range.startContainer 位置
  currentContainer() {
    // document.getSelection().focusNode
    const range = getDefaultRange();

    const li = parentElementWithTag(range.startContainer, "li", this.root);
    if (!li) {
      throw new Error(
        "Error when get currentContainer: focus are not in li element"
      );
    }
    return li;
  }
}
