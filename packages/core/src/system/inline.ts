import {
  HTMLElementTagName,
  createElement,
  createTextNode,
  innerHTMLToNodeList,
} from "@ohno-editor/core/helper/document";
import { BlockEventContext } from "./handler";
import { ComputePositionConfig, computePosition } from "@floating-ui/dom";
import { IComponent, IContainer, IInline } from "./base";
import { InlineSubmit, InlineSupport } from "../contrib";
import { makeRangeInNode, setRange } from "./range";
import {
  getLabelType,
  getTagName,
  isHintHTMLElement,
  outerHTML,
} from "../helper";

export interface InlineInit {
  [key: string]: any;
  name: string;
}
// 要么是外置编辑，要么是内置编辑，都可以基于 handler 实现自身的逻辑，不冲突，事件分发下去
// 随后是
// 目前唯一不确定的是 checkbox，明天简单调试好其他 inline 后快速试一下
/** Each type of inline should extend InlineBase to manage the corresponding HTMLElement */
export abstract class InlineBase<T extends InlineInit = InlineInit>
  implements IInline
{
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

export interface InlineSerializedData {
  type: "inline";
  data: InlineData[];
}

export type PlainData = { type: "#text"; text: string };
export type RichData = { type: HTMLElementTagName; children: InlineData };
export type LabelData = {
  type: "label";
  label_type: string;
  data: { [key: string]: any };
};
export type UnresolvedData = {
  type: "#unresolved";
  tagName: string;
  className: string;
  dataset: { [key: string]: string };
  innerHTML: string;
};

export type InlineDataElement =
  | string
  | undefined
  | null
  | PlainData
  | RichData
  | LabelData
  | UnresolvedData;

export type InlineData = InlineDataElement[] | string;

export interface NodeSerializer {
  test(node: Node): boolean;
  toMarkdown(node: Node, parent: InlineSerializer): string;
  toJson(node: Node, parent: InlineSerializer): InlineData;
  deserialize(data: InlineDataElement, parent: InlineSerializer): Node[];
}
export abstract class LabelSerializer<T extends InlineBase = InlineBase>
  implements NodeSerializer
{
  manager: T;
  constructor(manager: T) {
    this.manager = manager;
  }
  test(node: HTMLLabelElement): boolean {
    return true;
  }
  abstract toMarkdown(node: HTMLLabelElement, parent: InlineSerializer): string;
  abstract toJson(node: HTMLLabelElement, parent: InlineSerializer): InlineData;
  abstract deserialize(data: LabelData, parent: InlineSerializer): Node[];
}

export class CommonRichSerializer implements NodeSerializer {
  supported = new Set(["b", "string", "i", "a", "code", "em", "#text"]);
  test(node: Node): boolean {
    const tagName = getTagName(node);
    return this.supported.has(tagName);
  }
  toMarkdown(node: Node, parent: InlineSerializer): string {
    const tagName = getTagName(node);
    if (tagName === "#text") {
      return node.textContent || "";
    }

    const innerResult = parent.serialize(
      Array.from(node.childNodes),
      "markdown"
    );

    switch (tagName) {
      case "em":
      case "b":
      case "strong":
        return `**${innerResult}**`;
      case "i":
        return `*${innerResult}*`;
      case "a": {
        const href = (node as HTMLLinkElement).href;
        const url = encodeURIComponent(href);
        return `[${innerResult}](${url})`;
      }
      case "code":
        return `\`${innerResult}\``;
    }

    throw new Error("Method not implemented.");
  }
  toJson(node: Node, parent: InlineSerializer): InlineData {
    const tagName = getTagName(node);
    if (tagName === "#text") {
      return [{ type: "#text", text: node.textContent || "" } as PlainData];
    }

    const innerResult = parent.serialize(Array.from(node.childNodes), "json");

    return [{ type: tagName, children: innerResult } as RichData];
  }

  deserialize(data: PlainData | RichData, parent: InlineSerializer): Node[] {
    if (data.type === "#text") {
      return [createTextNode((data as PlainData).text)];
    } else {
      const typed = data as RichData;
      const childrenNodes = parent.deserialize(typed.children);
      return [createElement(typed.type, { children: childrenNodes })];
    }
  }
}

export class InlineSerializer {
  map: { [key: string]: NodeSerializer } = {};
  common: CommonRichSerializer;
  constructor() {
    this.common = new CommonRichSerializer();
  }

  registerLabelSerializer(type: string, serializer: LabelSerializer) {
    this.map[type] = serializer;
  }

  toMarkdown(nodes: Node[]): string {
    return nodes
      .map((node) => {
        const tagName = getTagName(node);
        if (tagName === "label") {
          const labelType = getLabelType(node as HTMLLabelElement);
          if (!this.map[labelType]) {
            const errorUrl = encodeURIComponent(
              `ohno://?type=error&tagName=${tagName}&labelType=${labelType}`
            );
            return `[Error parse md: ${tagName}/${labelType}](${errorUrl})`;
          }
          return this.map[labelType].toMarkdown(node as HTMLLabelElement, this);
        } else if (this.common.test(node)) {
          return this.common.toMarkdown(node, this);
        } else if (this.map[tagName]) {
          return this.map[tagName].toMarkdown(node, this);
        } else if (isHintHTMLElement(node)) {
          return "";
        } else {
          const errorUrl = encodeURIComponent(
            `ohno://?type=error&tagName=${tagName}`
          );
          return `[Error parse md: ${tagName}](${errorUrl})`;
        }
      })
      .join("");
  }
  toJson(nodes: Node[]): InlineData {
    return nodes.flatMap((node) => {
      const tagName = getTagName(node);
      if (tagName === "label") {
        const label = node as HTMLLabelElement;
        const labelType = getLabelType(label);
        if (!this.map[labelType]) {
          return [
            {
              type: "#unresolved",
              className: label.className,
              dataset: label.dataset,
              tagName: tagName,
              innerHTML: label.innerHTML,
            } as UnresolvedData,
          ];
        }
        return this.map[labelType].toJson(node, this);
      } else if (this.common.test(node)) {
        return this.common.toJson(node, this);
      } else if (this.map[tagName]) {
        return this.map[tagName].toJson(node, this);
      } else if (isHintHTMLElement(node)) {
        return [];
      } else {
        if (node instanceof HTMLElement) {
          return [
            {
              type: "#unresolved",
              className: node.className,
              dataset: node.dataset,
              tagName: tagName,
              innerHTML: node.innerHTML,
            } as UnresolvedData,
          ];
        } else {
          return [
            {
              type: "#unresolved",
              tagName: tagName,
            } as UnresolvedData,
          ];
        }
      }
    });
  }
  toHTML(nodes: Node[]) {
    return outerHTML(...nodes);
  }

  serialize(nodes: Node[], type: "markdown"): string;
  serialize(nodes: Node[], type: "html"): string;
  serialize(nodes: Node[], type: "json"): InlineData;
  serialize(nodes: Node[], type: "markdown" | "html" | "json"): any {
    if (type === "markdown") {
      return this.toMarkdown(nodes);
    } else if (type === "html") {
      return outerHTML(...nodes);
    } else if (type === "json") {
      return this.toJson(nodes);
    }
    throw new Error("not implemented");
  }
  deserialize(data: InlineData): Node[] {
    if (typeof data === "string") {
      return innerHTMLToNodeList(data);
    }

    return data.flatMap((item) => {
      if (typeof item === "string") {
        return innerHTMLToNodeList(item);
      } else if (!item) {
        return [createTextNode()];
      } else if (item.type === "label") {
        return this.map[(item as LabelData).label_type].deserialize(
          item as LabelData,
          this
        );
      } else if (item.type === "#text") {
        return this.common.deserialize(item, this);
      } else if (item.type === "#unresolved") {
        const { tagName, innerHTML, dataset, className } =
          item as UnresolvedData;
        return [
          createElement(tagName as HTMLElementTagName, {
            dataset: dataset,
            innerHTML: innerHTML,
            className: className,
          }),
        ];
      } else {
        return this.common.deserialize(item, this);
      }
    });
  }
}
