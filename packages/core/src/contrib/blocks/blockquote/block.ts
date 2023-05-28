import {
  ChildrenPayload,
  createElement,
} from "@ohno-editor/core/helper/document";
import { BlockSerializedData } from "@ohno-editor/core/system/base";
import { Block, BlockInit } from "@ohno-editor/core/system/block";
import { clipRange } from "@ohno-editor/core/system/range";

export interface BlockQuoteInit extends BlockInit {
  type?: string;
  level?: number; // TODO 用 level 模拟 blockquote 深度
  children?: ChildrenPayload;
}

export class Blockquote extends Block<BlockQuoteInit> {
  constructor(init?: BlockQuoteInit) {
    init = init || {};
    if (!init.el) {
      init.el = createElement("blockquote", {
        attributes: {},
        children: init.children,
      });
    }

    super("blockquote", init);
  }

  public get head(): string {
    return ">".repeat(this.init.level || 1) + " ";
  }

  toMarkdown(range?: Range | undefined): string {
    if (!range || range.collapsed) {
      return this.head + (this.inner.textContent || "");
    }
    const innerRange = clipRange(this.inner, range);
    if (innerRange) {
      return this.head + innerRange.cloneContents().textContent;
    }
    return "";
  }

  serialize(option?: any): BlockSerializedData<BlockQuoteInit> {
    return [{ type: this.type, init: { children: this.root.innerHTML } }];
  }
}
