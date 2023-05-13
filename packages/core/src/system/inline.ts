import { ElementTagName, createElement } from "@/helper/document";
import { EventContext } from "./handler";
import { ClientRectObject, VirtualElement } from "@floating-ui/dom";
import {
  BlockSerializedData,
  IComponent,
  IContainer,
  IInline,
  InlineSerializedData,
} from "./base";
import { removeMarkdownHint } from "@/helper/markdown";
import { getTagName } from "@/helper/element";

export interface InlineInit {
  [key: string]: any;
  name: string;
}

/** Each type of inline should extend InlineBase to manage the corresponding HTMLElement */
export class InlineBase<T extends InlineInit = InlineInit> implements IInline {
  name: string = "";
  parent?: IComponent | undefined;
  root: HTMLElement;
  current?: HTMLLabelElement;
  snap?: HTMLLabelElement;
  context?: EventContext;

  destory(): void {}

  /**
   * Handles the hover event on the inline element.
   * @param label - The HTMLLabelElement representing the inline element.
   * @param context - The EventContext object containing event-related information.
   */
  hover(label: HTMLLabelElement, context: EventContext): void {
    this.current = label;
    this.context = context;
  }

  /**
   * Handles the edit event on the inline element.
   * @param label - The HTMLLabelElement representing the inline element.
   * @param context - The EventContext object containing event-related information.
   */
  edit(label: HTMLLabelElement, context: EventContext): void {
    this.current = label;
    this.context = context;
    context.page.setActiveInline(label);
  }

  /**
   * Handles the exit event from the inline element.
   */
  exit(): void {
    // this.context.page.setActiveInline(label);
  }

  /**
   * Constructs an instance of InlineBase.
   * @param init - The initialization object for the InlineBase.
   */
  constructor(init: T) {
    this.root = createElement("div", {
      className: `oh-is-${init.name} inline`,
    });
    this.name = init.name;
  }
  serialize(label: HTMLLabelElement): InlineSerializedData<InnerHTMLInit> {
    return [];
  }
  /**
   * Creates the HTMLLabelElement for the inline element.
   * @param payload - The payload data for creating the inline element.
   * @returns The created HTMLLabelElement.
   */
  create(payload: any): HTMLLabelElement {
    return createElement("label", { textContent: `not implemented.` });
  }

  /**
   * Sets the parent container of the inline element.
   * @param parent - The parent container element.
   */
  setParent(parent?: IContainer | undefined): void {
    this.parent = parent;
  }
}

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

export interface InnerHTMLInit {
  children?: InnerHTMLInit[];
  tagName: string;
  innerHTMLs?: string[];
}
