import { ChildrenData, createElement } from "@ohno-editor/core/helper/document";
import {
  BaseBlockSerializer,
  BlockSerializedData,
} from "@ohno-editor/core/system";
import { Block, BlockData } from "@ohno-editor/core/system/block";
import "./style.css";
import { outerHTML } from "@ohno-editor/core/helper";

export interface ParagraphData extends BlockData {
  // innerHTML?: string;
  children?: ChildrenData;
}

export class Paragraph extends Block<ParagraphData> {
  constructor(data?: ParagraphData) {
    data = data || {};

    const root = createElement("p", {
      attributes: {},
      children: data.children,
    });

    super("paragraph", root);
  }
}

export class ParagraphSerializer extends BaseBlockSerializer<Paragraph> {
  toMarkdown(block: Paragraph): string {
    return block.root.textContent + "\n";
  }
  toHTML(block: Paragraph): string {
    return outerHTML(block.root);
  }
  toJson(block: Paragraph): BlockSerializedData<ParagraphData> {
    return {
      type: block.type,
      data: {
        children: block.getFirstEditable().innerHTML,
      },
    };
  }

  deserialize(data: BlockSerializedData<ParagraphData>): Paragraph {
    return new Paragraph(data.data);
  }
}
