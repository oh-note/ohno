import {
  parentElementWithTag,
  createElement,
} from "@ohno/core/system/functional";
import {
  BlockEventContext,
  PagesHandleMethods,
} from "@ohno/core/system/types";

export class InlineTest implements PagesHandleMethods {
  el: HTMLElement;
  constructor() {
    this.el = createElement("div");
    this.el.appendChild(createElement("input"));
  }

  handleMouseUp(e: MouseEvent, context: BlockEventContext): boolean | void {
    const { block, range } = context;
    if (
      range &&
      parentElementWithTag(range.startContainer, "label", block.root)
    ) {
      console.log("Find inline element");
      return true;
    }
  }
  handleClick(e: MouseEvent, context: BlockEventContext): boolean | void {
    const { block, range } = context;
    if (
      range &&
      parentElementWithTag(range.startContainer, "label", block.root)
    ) {
      console.log("Find inline element");
      return true;
    }
  }
}
