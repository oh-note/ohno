import { createElement } from "@ohno-editor/core/helper/document";
import {
  BaseBlockSerializer,
  Block,
  BlockData,
  BlockSerializedData,
} from "@ohno-editor/core/system/block";
import "./style.css";
export interface DivideData extends BlockData {}

export class Divide extends Block<DivideData> {
  isMultiEditable: boolean = true;
  mergeable: boolean = false;

  constructor(init?: DivideData) {
    const root = createElement("div", {
      attributes: {},
    });

    super("divide", root);
  }
}

export class FigureSerializer extends BaseBlockSerializer<Divide> {
  toMarkdown(block: Divide): string {
    return `\n---\n`;
  }

  toHTML(block: Divide): string {
    return this.outerHTML(block.root);
  }

  toJson(block: Divide): BlockSerializedData<DivideData> {
    return {
      type: block.type,
      data: {},
    };
  }

  deserialize(data: BlockSerializedData<DivideData>): Divide {
    return new Divide(data.data);
  }
}
