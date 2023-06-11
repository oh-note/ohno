import {
  ChildrenData,
  HTMLElementTagName,
  createElement,
  createTextNode,
  dechildren,
} from "@ohno-editor/core/helper/document";
import { BlockEventContext } from "./handler";
import {
  ClientRectObject,
  ComputePositionConfig,
  VirtualElement,
  computePosition,
} from "@floating-ui/dom";
import { IComponent, IContainer, IInline } from "./base";
import { InlineSubmit, InlineSupport } from "../contrib";
import { makeRangeInNode, setRange } from "./range";
import {
  ValidNode,
  addMarkdownHint,
  getTagName,
  innerHTML,
  removeMarkdownHint,
} from "../helper";

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

export interface InlineNodeInit {
  children?: ChildrenData;
  dataset?: { [key: string]: any };
  className?: string;
  tagName: string;
}

export interface InlineSerializedData {
  type: "inline";
  data: InlineNodeInit[];
  plain?: boolean;
}

export class InlineSerializer {
  serializeNode(node: Node): InlineNodeInit {
    const tagName = getTagName(node);

    if (tagName === "#text") {
      return { tagName, children: [node.textContent || ""] };
    } else if (node instanceof HTMLElement) {
      // 所有特殊元素交给 inline serializer
      return {
        tagName,
        className: node.className,
        dataset: node.dataset,
        children: [node.innerHTML],
      };
    } else {
      return { tagName: "span", children: ["Unhandled type", node.nodeName] };
    }
  }
  serialize(range: Range): InlineSerializedData {
    const frag = Array.from(range.cloneContents().childNodes);
    removeMarkdownHint(...frag);

    return {
      type: "inline",
      data: frag.flatMap((item) => {
        return this.serializeNode(item);
      }),
    };
  }

  toMarkdown(range: Range): string {
    // TODO markdown serializer
    const frag = Array.from(range.cloneContents().childNodes);
    removeMarkdownHint(...frag);
    return innerHTML(...frag);
  }
  toHTML(range: Range): string {
    const frag = Array.from(range.cloneContents().childNodes);
    removeMarkdownHint(...frag);
    return innerHTML(...frag);
  }

  deserializeNode(init: InlineNodeInit): Node {
    const { tagName, children, dataset, className } = init;

    if (tagName === "#text") {
      return createTextNode(dechildren(children || []).join(""));
    } else {
      return createElement(tagName as HTMLElementTagName, {
        children,
        dataset,
        className,
      });
    }
  }

  deserialize(data: InlineSerializedData): ValidNode[] {
    if (data.type != "inline") {
      throw new Error("Sanity check");
    }
    const nodes = data.data.flatMap((item) => {
      return this.deserializeNode(item) as ValidNode;
    });

    if (!data.plain) {
      addMarkdownHint(...nodes);
    }
    return nodes;
  }
}
