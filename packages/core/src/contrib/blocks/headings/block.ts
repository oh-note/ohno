import { ChildrenData, createElement } from "@ohno-editor/core/helper/document";
import {
  BaseBlockSerializer,
  BlockSerializedData,
} from "@ohno-editor/core/system";
import { Block, BlockData } from "@ohno-editor/core/system/block";
import { clipRange } from "@ohno-editor/core/system/range";
import "./style.css";
import { outerHTML } from "@ohno-editor/core/helper";
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingsData extends BlockData {
  level: HeadingLevel;
  children?: ChildrenData;
}

export class Headings extends Block<HeadingsData> {
  constructor(data?: HeadingsData) {
    data = data || { level: 2 };
    const root = createElement(`h${data.level}`, {
      attributes: {},
      children: data.children,
    });

    super("headings", root, { meta: data });
  }
  public get level(): HeadingLevel {
    return this.meta.level;
  }

  // toMarkdown(range?: Range | undefined): string {
  //   if (!range || range.collapsed) {
  //     return this.head + (this.inner.textContent || "");
  //   }
  //   const innerRange = clipRange(this.inner, range);
  //   if (innerRange) {
  //     return this.head + innerRange.cloneContents().textContent;
  //   }
  //   return "";
  // }

  // serialize(option?: any): BlockSerializedData<HeadingsData> {
  //   const init = { level: this.meta.level, children: this.inner.innerHTML };
  //   return [{ type: this.type, init }];
  // }
}

export class HeadingsSerializer extends BaseBlockSerializer<Headings> {
  toMarkdown(block: Headings): string {
    return "#".repeat(block.level) + " " + block.root.textContent;
  }

  toHTML(block: Headings): string {
    return this.outerHTML(block.root);
  }
  toJson(block: Headings): BlockSerializedData<HeadingsData> {
    return {
      type: block.type,
      data: {
        level: block.level,
        children: block.getFirstEditable().innerHTML,
      },
    };
  }

  deserialize(data: BlockSerializedData<HeadingsData>): Headings {
    return new Headings(data.data);
  }
}
