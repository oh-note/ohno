import { outerHTML } from "@ohno-editor/core/helper";
import { createElement } from "@ohno-editor/core/helper/document";

import {
  BaseBlockSerializer,
  Block,
  BlockData,
  BlockSerializedData,
} from "@ohno-editor/core/system/block";
import { InlineData } from "@ohno-editor/core/system/inline";

export interface BlockQuoteData extends BlockData {
  type?: string;
  level?: number; // TODO 用 level 模拟 blockquote 深度
  children?: InlineData;
}

export class Blockquote extends Block<BlockQuoteData> {
  constructor(data?: BlockQuoteData) {
    data = data || {};

    super("blockquote", data, { meta: data });
  }
  render(data: BlockQuoteData): HTMLElement {
    const { type, level, children } = data;

    const root = createElement("blockquote", {
      attributes: {},
      className: type,
      children: this.deserializeInline(children),
    });
    return root;
  }

  public get head(): string {
    return ">".repeat(this.meta.level || 1) + " ";
  }
  static create(data: BlockQuoteData) {
    return new Blockquote(data);
  }
}

export class BlockquoteSerializer extends BaseBlockSerializer<Blockquote> {
  partToMarkdown(block: Blockquote, range: Range): string {
    const res = this.rangedEditable(block, range);
    // if(res.start){}
    if (res.start) {
      return "> " + this.serializeInline(res.start, "markdown") + "\n";
    } else if (res.full) {
      return this.toMarkdown(block);
    } else if (res.end) {
      return "> " + this.serializeInline(res.end, "markdown") + "\n";
    }
    return "";
  }
  partToJson(
    block: Blockquote,
    range: Range
  ): BlockSerializedData<BlockQuoteData> {
    const res = this.rangedEditable(block, range);
    if (res.start) {
      return {
        type: block.type,
        data: {
          children: this.serializeInline(res.start, "json"),
        },
      };
    } else if (res.full) {
      return this.toJson(block);
    } else if (res.end) {
      return {
        type: block.type,
        data: {
          children: this.serializeInline(res.end, "json"),
        },
      };
    }
    return { type: block.type, data: {} };
  }
  toMarkdown(block: Blockquote): string {
    const childNodes = Array.from(block.root.childNodes);
    return "> " + this.serializeInline(childNodes, "markdown") + "\n";
  }

  toJson(block: Blockquote): BlockSerializedData<BlockQuoteData> {
    const childNodes = Array.from(block.root.childNodes);
    return {
      type: block.type,
      data: {
        children: this.serializeInline(childNodes, "json"),
        level: block.meta.level,
        type: block.meta.type,
      },
    };
  }

  deserialize(data: BlockSerializedData<BlockQuoteData>): Blockquote {
    return new Blockquote(data.data);
  }
}
