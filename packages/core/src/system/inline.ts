import {
  ElementTagName,
  createElement,
} from "@ohno-editor/core/helper/document";
import { BlockEventContext } from "./handler";
import {
  ClientRectObject,
  ComputePositionConfig,
  VirtualElement,
  computePosition,
} from "@floating-ui/dom";
import {
  BlockSerializedData,
  IComponent,
  IContainer,
  IInline,
  IInlineManager,
  InlineSerializedData,
} from "./base";
import { removeMarkdownHint } from "@ohno-editor/core/helper/markdown";
import { getTagName } from "@ohno-editor/core/helper/element";
import { InlineSubmit, InlineSupport } from "../contrib";
import { isActivate, isHover } from "../helper";
import { makeRangeInNode, setRange } from "./range";

export interface InlineInit {
  [key: string]: any;
  name: string;
}
// 要么是外置编辑，要么是内置编辑，都可以基于 handler 实现自身的逻辑，不冲突，事件分发下去
// 随后是
// 目前唯一不确定的是 checkbox，明天简单调试好其他 inline 后快速试一下
/** Each type of inline should extend InlineBase to manage the corresponding HTMLElement */
export class InlineBase<T extends InlineInit = InlineInit> implements IInline {
  name: string = "";
  parent?: IComponent | undefined;
  root: HTMLElement;
  current?: HTMLLabelElement;
  snap?: HTMLLabelElement;
  context?: BlockEventContext;
  plugin!: InlineSupport;
  /** exit means current and snap is not valid */
  status: string = "exit";
  latest: boolean = false;
  setInlineManager(plugin: InlineSupport): void {
    this.plugin = plugin;
  }
  destory(): void {}

  isShow(component: HTMLElement) {
    return component.style.display !== "none";
  }

  show(component: HTMLElement) {
    component.style.display = "unset";
  }

  hide(component: HTMLElement) {
    component.style.display = "none";
  }

  float(
    label: HTMLLabelElement,
    float_component: HTMLElement,
    options?: Partial<ComputePositionConfig>
  ) {
    float_component.style.position = "absolute";
    this.show(float_component);
    computePosition(label, float_component, options).then(({ x, y }) => {
      Object.assign(float_component.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }

  submit(exit: boolean = true) {
    if (!this.latest && this.current && this.snap) {
      const { page, block } = this.context!;
      const command = new InlineSubmit({
        page,
        label: this.current!,
        old: this.snap!,
        block,
      });
      if (!exit) {
        command.removeCallback();
      }
      page.executeCommand(command);
      this.latest = true;
    }
  }

  cancel() {
    if (!this.latest && this.current && this.snap) {
      for (const key in this.snap.dataset) {
        this.current.dataset[key] = this.snap.dataset[key];
      }
      this.current!.innerHTML = this.snap!.innerHTML;
      this.latest = true;
    }
  }

  setStatus(flag: string) {
    const old = this.status;
    this.status = flag;
    this.onStatusChange(flag, old);
  }
  onStatusChange(current: string, prev: string) {}

  /**
   * Handles the hover event on the inline element.
   * @param label - The HTMLLabelElement representing the inline element.
   * @param context - The EventContext object containing event-related information.
   */
  hover(label: HTMLLabelElement, context: BlockEventContext): void {
    this.submit();
    this.snap = label.cloneNode(true) as HTMLLabelElement;
    this.current = label;
    this.context = context;
    this.latest = true;
    this.setStatus("hover");
    this.plugin.setActiveInline();
    this.plugin.setHoveredInline("cursor", label);
    this.hover_subclass(label, context);
  }
  hover_subclass(label: HTMLLabelElement, context: BlockEventContext): void {}

  /**
   * @param label - The HTMLLabelElement representing the inline element.
   * @param context - The EventContext object containing event-related information.
   */
  activate(label: HTMLLabelElement, context: BlockEventContext): void {
    this.snap = label.cloneNode(true) as HTMLLabelElement;
    this.current = label;
    this.context = context;
    this.latest = true;
    this.setStatus("activate");
    this.activate_subclass(label, context);
    this.plugin.setHoveredInline("cursor");
    this.plugin.setHoveredInline("mouse");
  }

  activate_subclass(
    label: HTMLLabelElement,
    context: BlockEventContext
  ): void {}

  makeRangeInNode(el: HTMLElement, range?: Range) {
    setRange(makeRangeInNode(el, range));
  }

  /**
   * Handles the exit event from the inline element.
   */
  exit(): void {
    if (this.current && this.context) {
      this.submit();
      this.exit_subclass(this.current, this.context);
      if (this.plugin.activeInline === this.current) {
        this.plugin.setActiveInline();
      }
      if (this.plugin.mouseHoveredInline === this.current) {
        this.plugin.setHoveredInline("mouse");
      }
      if (this.plugin.cursorHoveredInline === this.current) {
        this.plugin.setHoveredInline("cursor");
      }
      this.current = undefined;
      this.snap = undefined;
      this.context = undefined;
      this.setStatus("exit");
    }
  }
  exit_subclass(label: HTMLLabelElement, context: BlockEventContext): void {}

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
