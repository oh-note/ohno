import { ClientRectObject, VirtualElement } from "@floating-ui/dom";

/**
 * 4 states of Inline:
 *  - unactive: The default state when the cursor is in other positions, displayed normally.
 *  - hover: When the mouse hovers over the inline element, indicated by CSS, with a light background color.
 *  - active: When exiting from edit mode or moving the cursor over it, the focus is still on the page, with a dark background color, registered on the page.
 *  - edit: When clicked by the mouse or pressing Enter in active state, the page may lose focus depending on whether there is an additional editing box, with a dark background color, registered on the page.
 */
export class RangeElement implements VirtualElement {
  range: Range;
  constructor(range: Range) {
    this.range = range;
    this.contextElement = this.range.startContainer as Element;
  }

  /**
   * Retrieves the bounding client rectangle of the range element.
   * @returns The ClientRectObject representing the bounding client rectangle.
   */
  getBoundingClientRect(): ClientRectObject {
    return this.range.getBoundingClientRect();
  }

  contextElement?: Element | undefined;
}

export class MouseElement implements VirtualElement {
  mouseEvent: MouseEvent;
  contextElement?: Element | undefined;
  constructor(e: MouseEvent) {
    this.mouseEvent = e;
    this.contextElement =
      document.elementFromPoint(e.clientX, e.clientY) || undefined;
  }
  getBoundingClientRect(): ClientRectObject {
    const { clientX, clientY } = this.mouseEvent;
    return {
      width: 0,
      height: 0,
      x: clientX,
      y: clientY,
      top: clientY,
      left: clientX,
      right: clientX,
      bottom: clientY,
    };
  }
}
