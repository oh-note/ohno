import {
  ChildrenPayload,
  createElement,
} from "@ohno-editor/core/helper/document";
import { BlockSerializedData } from "@ohno-editor/core/system/base";
import { Block, BlockInit } from "@ohno-editor/core/system/block";

export interface ParagraphInit extends BlockInit {
  innerHTML?: string;
  children?: ChildrenPayload;
}

export class Paragraph extends Block<ParagraphInit> {
  constructor(init?: ParagraphInit) {
    init = init || {};

    init.el = createElement("p", {
      attributes: {},
      children: init.children,
    });

    if (init.innerHTML) {
      // throw new Error("InnerHTML is deprecated, use children");
      console.error("InnerHTML is deprecated, use children");
    }

    super("paragraph", init);
  }
  serialize(option?: any): BlockSerializedData<ParagraphInit> {
    const init = { innerHTML: this.inner.innerHTML };
    return [{ type: this.type, init }];
  }
}
