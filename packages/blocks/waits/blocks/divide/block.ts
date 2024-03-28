import { createElement } from "../../../system/functional";
import {
  BaseBlockSerializer,
  Block,
  BlockData,
  BlockSerializedData,
} from "../../../system/types";
import "./style.css";
export interface DivideData extends BlockData {}

export class Divide extends Block<DivideData> {
  isMultiEditable: boolean = true;
  mergeable: boolean = false;

  constructor(data?: DivideData) {
    super("divide", data || {});
  }
  length: number = 1;
  editables: HTMLElement[] = [this.inner];
  render(data: DivideData): HTMLElement {
    const root = createElement("div", {
      attributes: {},
    });
    return root;
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
