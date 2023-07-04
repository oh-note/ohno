import { createElement } from "@ohno-editor/core/helper/document";
import {
  BaseBlockSerializer,
  BlockSerializedData,
} from "@ohno-editor/core/system";
import { Block, BlockData } from "@ohno-editor/core/system/block";
import "./style.css";
import { InlineData } from "@ohno-editor/core/system/inline";

export interface ParagraphData extends BlockData {
  // innerHTML?: string;
  children?: InlineData;
}

export class Paragraph extends Block<ParagraphData> {
  constructor(data?: ParagraphData) {
    data = data || {};
    super("paragraph", data);
  }
  render(data: ParagraphData): HTMLElement {
    const root = createElement("p", {
      attributes: {},
      children: this.deserializeInline(data.children),
    });
    return root;
  }
}

export class ParagraphSerializer extends BaseBlockSerializer<Paragraph> {
  partToMarkdown(block: Paragraph, range: Range): string {
    const res = this.rangedEditable(block, range);
    // if(res.start){}

    if (res.start) {
      return this.serializeInline(res.start, "markdown") + "\n";
    } else if (res.full) {
      return this.toMarkdown(block);
    } else if (res.end) {
      return this.serializeInline(res.end, "markdown") + "\n";
    }
    return "";
  }
  partToJson(
    block: Paragraph,
    range: Range
  ): BlockSerializedData<ParagraphData> {
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
  toMarkdown(block: Paragraph): string {
    const childNodes = Array.from(block.root.childNodes);
    return this.serializeInline(childNodes, "markdown") + "\n";
  }

  toJson(block: Paragraph): BlockSerializedData<ParagraphData> {
    const childNodes = Array.from(block.root.childNodes);
    return {
      type: block.type,
      data: {
        children: this.serializeInline(childNodes, "json"),
      },
    };
  }

  deserialize(data: BlockSerializedData<ParagraphData>): Paragraph {
    return new Paragraph(data.data);
  }
}
