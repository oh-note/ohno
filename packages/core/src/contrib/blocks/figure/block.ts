import {
  createElement,
  getDefaultRange,
} from "@ohno-editor/core/helper/document";
import { parentElementWithTag } from "@ohno-editor/core/helper/element";
import {
  BaseBlockSerializer,
  Block,
  BlockData,
  BlockSerializedData,
} from "@ohno-editor/core/system/block";
import "./style.css";
import { RefLocation } from "@ohno-editor/core/system";
export interface FigureData extends BlockData {
  src: string;
}

export class Figure extends Block<FigureData> {
  isMultiEditable: boolean = true;
  mergeable: boolean = false;
  img: HTMLElement;
  constructor(init?: FigureData) {
    init = init || { src: "" };
    const root = createElement("figure", {
      attributes: {},
    });

    super("figure", root, { meta: init });
    const img = createElement("img", { attributes: { src: init.src } });
    this.img = img;
    root.appendChild(img);
  }
  public get inner(): HTMLElement {
    return this.img;
  }
  public get src() {
    return this.meta.src;
  }
  isLocationInFirstLine(loc: RefLocation): boolean {
    return true;
  }
  isLocationInLastLine(loc: RefLocation): boolean {
    return true;
  }
  getSoftLineHead(loc: RefLocation): RefLocation {
    return [this.img, 0];
  }
  getSoftLineTail(loc: RefLocation): RefLocation {
    return [this.img, 0];
  }
  getSoftLineBias(loc: RefLocation): number {
    return 0;
  }
}

export class FigureSerializer extends BaseBlockSerializer<Figure> {
  toMarkdown(block: Figure): string {
    return `\n![](${block.src})\n`;
  }

  toHTML(block: Figure): string {
    return this.outerHTML(block.root);
  }

  toJson(block: Figure): BlockSerializedData<FigureData> {
    return {
      type: block.type,
      data: {
        src: block.src,
      },
    };
  }

  deserialize(data: BlockSerializedData<FigureData>): Figure {
    return new Figure(data.data);
  }
}
