import {
  HTMLElementTagName,
  createElement,
  createTextNode,
  innerHTMLToNodeList,
  getLabelType,
  getTagName,
  isHintHTMLElement,
  outerHTML,
} from "@ohno-editor/core/helper";
import { InlineBase } from "./imp";

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
