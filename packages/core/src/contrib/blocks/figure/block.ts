import {
  createElement,
  getDefaultRange,
} from "@ohno-editor/core/helper/document";
import {
  isParent,
  parentElementWithTag,
} from "@ohno-editor/core/helper/element";
import {
  BaseBlockSerializer,
  Block,
  BlockData,
  BlockSerializedData,
} from "@ohno-editor/core/system/block";
import "./style.css";
import { EditableFlag, RefLocation } from "@ohno-editor/core/system";
import { isHide, isShow, markHide, markShow } from "@ohno-editor/core/helper";
export interface FigureData extends BlockData {
  src: string;
  caption?: string;
}

export class Figure extends Block<FigureData> {
  isMultiEditable: boolean = true;
  mergeable: boolean = false;
  img: HTMLImageElement;
  figcaption: HTMLElement;
  constructor(init?: FigureData) {
    init = init || { src: "" };
    const root = createElement("figure", {
      attributes: {},
    });

    super("figure", root, { meta: init });
    const img = createElement("img", { attributes: { src: init.src } });
    const figcaption = createElement("figcaption", { innerHTML: init.caption });
    this.img = img;
    this.figcaption = figcaption;
    if (!init.caption) {
      markHide(figcaption);
    }
    root.appendChild(img);
    root.appendChild(figcaption);
  }
  public get inner(): HTMLElement {
    return this.img;
  }
  public get hasCaption(): boolean {
    return isShow(this.figcaption);
  }
  public get src() {
    return this.img.src;
  }
  public get caption() {
    if (isHide(this.figcaption)) {
      return "";
    }
    return this.figcaption.innerHTML;
  }

  closeFigCaption() {
    return markHide(this.figcaption);
  }
  openFigCaption() {
    return markShow(this.figcaption);
  }

  findEditable(node: Node): HTMLElement | null;
  findEditable(node: Node, raise?: boolean | undefined): HTMLElement;
  findEditable(node: Node, raise?: boolean | undefined): HTMLElement | null {
    if (isParent(node, this.img)) {
      return this.img;
    } else if (isParent(node, this.figcaption)) {
      return this.figcaption;
    }
    if (raise) {
      throw new Error("editable not found");
    }
    return null;
  }
  getAboveEditable(editable: HTMLElement): HTMLElement | null {
    if (editable instanceof HTMLImageElement) {
      return null;
    }
    return this.img;
  }
  getBelowEditable(editable: HTMLElement): HTMLElement | null {
    if (editable instanceof HTMLImageElement && this.hasCaption) {
      return this.figcaption;
    }
    return null;
  }
  getLeftEditable(editable: HTMLElement): HTMLElement | null {
    return this.getAboveEditable(editable);
  }
  getRightEditable(editable: HTMLElement): HTMLElement | null {
    return this.getBelowEditable(editable);
  }
  getPrevEditable(editable: HTMLElement): HTMLElement | null {
    return this.getLeftEditable(editable);
  }
  getNextEditable(editable: HTMLElement): HTMLElement | null {
    return this.getRightEditable(editable);
  }

  getEditable(flag: EditableFlag): HTMLElement {
    if (flag instanceof HTMLElement) {
      return flag;
    }
    if (flag < 0) {
      flag++;
      if (this.hasCaption) {
        flag++;
      }
    }
    if (flag === 0) {
      return this.img;
    } else if (flag === 1) {
      return this.figcaption;
    } else {
      throw new Error("no more than 1, got " + flag);
    }
  }

  getEditableIndex(editable: HTMLElement): number {
    if (editable instanceof HTMLImageElement) {
      return 0;
    }
    return 1;
  }

  getLastEditable(): HTMLElement {
    if (this.hasCaption) {
      return this.figcaption;
    }
    return this.img;
  }
  getFirstEditable(): HTMLElement {
    return this.img;
  }

  getEditables(
    start?: number | undefined,
    end?: number | undefined
  ): HTMLElement[] {
    if (this.hasCaption) {
      return [this.img, this.figcaption];
    }
    return [this.img];
  }

  isLocationInFirstLine(loc: RefLocation): boolean {
    if (isParent(loc[0], this.figcaption)) {
      return super.isLocationInFirstLine(loc);
    }
    return true;
  }
  isLocationInLastLine(loc: RefLocation): boolean {
    if (isParent(loc[0], this.figcaption)) {
      return super.isLocationInLastLine(loc);
    }
    return true;
  }
  getSoftLineHead(loc: RefLocation): RefLocation {
    if (isParent(loc[0], this.figcaption)) {
      return super.getSoftLineHead(loc);
    }
    return [this.img, 0];
  }
  getSoftLineTail(loc: RefLocation): RefLocation {
    if (isParent(loc[0], this.figcaption)) {
      return super.getSoftLineTail(loc);
    }
    return [this.img, 0];
  }

  getSoftLineBias(loc: RefLocation): number {
    if (isParent(loc[0], this.figcaption)) {
      return super.getSoftLineBias(loc);
    }
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
        caption: block.caption,
      },
    };
  }

  deserialize(data: BlockSerializedData<FigureData>): Figure {
    return new Figure(data.data);
  }
}
