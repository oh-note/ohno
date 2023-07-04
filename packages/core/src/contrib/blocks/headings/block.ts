import { ChildrenData, createElement } from "@ohno-editor/core/helper/document";
import {
  BaseBlockSerializer,
  BlockSerializedData,
} from "@ohno-editor/core/system";
import { Block, BlockData } from "@ohno-editor/core/system/block";
import { clipRange } from "@ohno-editor/core/system/range";
import "./style.css";
import { outerHTML } from "@ohno-editor/core/helper";
import { InlineData } from "@ohno-editor/core/system/inline";
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingsData extends BlockData {
  level: HeadingLevel;
  children?: InlineData;
}

export class Headings extends Block<HeadingsData> {
  constructor(data?: HeadingsData) {
    data = data || { level: 2 };

    super("headings", data, { meta: data });
  }
  public get level(): HeadingLevel {
    return this.meta.level;
  }

  public get levelStr(): string {
    return "#".repeat(this.level) + " ";
  }

  render(data: HeadingsData): HTMLElement {
    const root = createElement(`h${data.level}`, {
      attributes: {},
      children: this.deserializeInline(data.children),
    });
    return root;
  }
}

export class HeadingsSerializer extends BaseBlockSerializer<Headings> {
  partToMarkdown(block: Headings, range: Range): string {
    const res = this.rangedEditable(block, range);
    // if(res.start){}
    if (res.start) {
      return (
        block.levelStr + this.serializeInline(res.start, "markdown") + "\n"
      );
    } else if (res.full) {
      return this.toMarkdown(block);
    } else if (res.end) {
      return block.levelStr + this.serializeInline(res.end, "markdown") + "\n";
    }
    return "";
  }
  partToJson(block: Headings, range: Range): BlockSerializedData<HeadingsData> {
    const res = this.rangedEditable(block, range);
    if (res.start) {
      return {
        type: block.type,
        data: {
          level: block.level,
          children: this.serializeInline(res.start, "json"),
        },
      };
    } else if (res.full) {
      return this.toJson(block);
    } else if (res.end) {
      return {
        type: block.type,
        data: {
          level: block.level,
          children: this.serializeInline(res.end, "json"),
        },
      };
    }
    return { type: block.type, data: { level: block.level } };
  }

  toMarkdown(block: Headings): string {
    const childNodes = Array.from(block.root.childNodes);
    return (
      "#".repeat(block.level) +
      " " +
      this.serializeInline(childNodes, "markdown") +
      "\n"
    );
  }

  toJson(block: Headings): BlockSerializedData<HeadingsData> {
    const childNodes = Array.from(block.root.childNodes);
    return {
      type: block.type,
      data: {
        level: block.level,
        children: this.serializeInline(childNodes, "json"),
      },
    };
  }

  deserialize(data: BlockSerializedData<HeadingsData>): Headings {
    return new Headings(data.data);
  }
}
