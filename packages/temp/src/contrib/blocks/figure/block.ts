import { isParent, createElement } from "@ohno/core/system/functional";
import {
  BaseBlockSerializer,
  Block,
  BlockData,
  BlockSerializedData,
  EditableFlag,
  RefLocation,
  InlineData,
} from "@ohno/core/system/types";
import "./style.css";
import {
  isHide,
  isShow,
  markHide,
  markShow,
} from "@ohno/core/system/status";
export interface FigureData extends BlockData {
  src: string;
  caption?: InlineData;
}

export class Figure extends Block<FigureData> {
  isMultiEditable: boolean = true;
  mergeable: boolean = false;

  constructor(data?: FigureData) {
    data = data || { src: "" };
    super("figure", data, { meta: data });
  }

  render(data: FigureData): HTMLElement {
    const img = createElement("img", { attributes: { src: data.src } });
    const figcaption = createElement("figcaption", {
      children: this.deserializeInline(data.caption),
    });

    const root = createElement("figure", {
      attributes: {},
      children: [img, figcaption],
    });

    if (!data.caption) {
      markHide(figcaption);
    }

    return root;
  }
  public get length(): number {
    return this.hasCaption ? 2 : 1;
  }

  public get editables(): HTMLElement[] {
    if (this.hasCaption) {
      return [this.img, this.figcaption];
    }
    return [this.img];
  }

  public get inner(): HTMLElement {
    return this.img;
  }
  public get hasCaption(): boolean {
    return isShow(this.figcaption);
  }

  public get img(): HTMLImageElement {
    return this.root.querySelector("img")!;
  }

  public get figcaption(): HTMLElement {
    return this.root.querySelector("figcaption")!;
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
    const childNodes = Array.from(block.figcaption.childNodes);
    return `\n![${this.serializeInline(childNodes, "markdown")}](${
      block.src
    })\n`;
  }

  toJson(block: Figure): BlockSerializedData<FigureData> {
    const childNodes = Array.from(block.figcaption.childNodes);
    return {
      type: block.type,
      data: {
        src: block.src,
        caption: this.serializeInline(childNodes, "json"),
      },
    };
  }

  deserialize(data: BlockSerializedData<FigureData>): Figure {
    return new Figure(data.data);
  }
}
