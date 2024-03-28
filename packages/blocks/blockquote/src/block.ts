import { createElement } from "@ohno/core/system/functional";
import {
  InlineData,
  Block,
  BlockData,
  BaseBlockSerializer,
  BlockSerializedData,
} from "@ohno/core/system/types";

export interface BlockQuoteData extends BlockData {
  type?: string;
  level?: number; // TODO, not implemented
  children?: InlineData;
}

export class BlockQuote extends Block<BlockQuoteData> {
  constructor(data?: BlockQuoteData) {
    data = data || {};
    super("blockquote", data, { meta: data });
  }
  render(data: BlockQuoteData): HTMLElement {
    const { type, children } = data;

    const root = createElement("blockquote", {
      attributes: {},
      className: type,
      children: this.deserializeInline(children),
    });
    return root;
  }

  public get length(): number {
    return 1;
  }

  public get editables(): HTMLElement[] {
    return [this.inner];
  }

  public get head(): string {
    return ">".repeat(this.meta.level || 1) + " ";
  }
}

export class BlockquoteSerializer extends BaseBlockSerializer<BlockQuote> {
  partToMarkdown(block: BlockQuote, range: Range): string {
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
    block: BlockQuote,
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
  toMarkdown(block: BlockQuote): string {
    const childNodes = Array.from(block.root.childNodes);
    return "> " + this.serializeInline(childNodes, "markdown") + "\n";
  }

  toJson(block: BlockQuote): BlockSerializedData<BlockQuoteData> {
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

  deserialize(data: BlockSerializedData<BlockQuoteData>): BlockQuote {
    return new BlockQuote(data.data);
  }
}
