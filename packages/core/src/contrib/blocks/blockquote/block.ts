import { outerHTML } from "@ohno-editor/core/helper";
import { ChildrenData, createElement } from "@ohno-editor/core/helper/document";

import {
  BaseBlockSerializer,
  Block,
  BlockData,
  BlockSerializedData,
  BlockSerializer,
} from "@ohno-editor/core/system/block";
import { clipRange } from "@ohno-editor/core/system/range";

export interface BlockQuoteData extends BlockData {
  type?: string;
  level?: number; // TODO 用 level 模拟 blockquote 深度
  children?: ChildrenData;
}

export class Blockquote extends Block<BlockQuoteData> {
  constructor(data?: BlockQuoteData) {
    data = data || {};

    const { type, level, children } = data;

    const root = createElement("blockquote", {
      attributes: {},
      className: type,
      children: children,
    });

    super("blockquote", root, { meta: data });
  }

  public get head(): string {
    return ">".repeat(this.meta.level || 1) + " ";
  }
  static create(data: BlockQuoteData) {
    return new Blockquote(data);
  }
}

export class BlockquoteSerializer extends BaseBlockSerializer<Blockquote> {
  toMarkdown(block: Blockquote): string {
    return "> " + block.root.textContent + "\n";
  }
  toHTML(block: Blockquote): string {
    return outerHTML(block.root);
  }
  toJson(block: Blockquote): BlockSerializedData<BlockQuoteData> {
    return {
      type: block.type,
      data: {
        children: block.getFirstEditable().innerHTML,
        level: block.meta.level,
        type: block.meta.type,
      },
    };
  }

  deserialize(data: BlockSerializedData<BlockQuoteData>): Blockquote {
    return new Blockquote(data.data);
  }
}
