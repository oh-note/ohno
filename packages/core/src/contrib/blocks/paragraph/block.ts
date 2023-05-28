import {
  ChildrenPayload,
  createElement,
} from "@ohno-editor/core/helper/document";
import { BlockSerializedData } from "@ohno-editor/core/system/base";
import { Block, BlockInit } from "@ohno-editor/core/system/block";
import "./style.css";

export interface ParagraphInit extends BlockInit {
  // innerHTML?: string;
  children?: ChildrenPayload;
}

export class Paragraph extends Block<ParagraphInit> {
  constructor(init?: ParagraphInit) {
    init = init || {};

    init.el = createElement("p", {
      attributes: {},
      children: init.children,
    });

    super("paragraph", init);
  }
  serialize(option?: any): BlockSerializedData<ParagraphInit> {
    const init = { children: this.inner.innerHTML };
    return [{ type: this.type, init }];
  }
}
