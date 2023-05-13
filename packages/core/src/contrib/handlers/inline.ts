import { createElement } from "@/helper/document";
import { isParent, parentElementWithTag } from "@/helper/element";
import { EventContext, Handler } from "@/system/handler";

export class InlineTest extends Handler {
  el: HTMLElement;
  constructor() {
    super();
    this.el = createElement("div");
    this.el.appendChild(createElement("input"));
  }

  handleMouseUp(e: MouseEvent, context: EventContext): boolean | void {
    const { block, range } = context;
    if (
      range &&
      parentElementWithTag(range.startContainer, "label", block.root)
    ) {
      console.log("Find inline element");
      return true;
    }
  }
  handleClick(e: MouseEvent, context: EventContext): boolean | void {
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
