import { outerHTML, createElement } from "../../../system/functional";

import { Block, BlockData } from "../../../system/types";
import katex from "katex";
import {
  BaseBlockSerializer,
  BlockSerializedData,
  EditableFlag,
} from "../../../system/types";
import { markPlain } from "../../../system/status";

import "./style.css";
import { computePosition } from "@floating-ui/dom";
export interface EquationData extends BlockData {
  src: string;
}
export class Equation extends Block<EquationData> {
  isMultiEditable: boolean = false;
  mergeable: boolean = false;
  component!: {
    math: HTMLElement;
    input: HTMLParagraphElement;
  };
  constructor(data?: EquationData) {
    data = data || { src: "" };

    super("equation", data);
  }
  render(data: EquationData): HTMLElement {
    const root = createElement("pre", {
      attributes: {},
    });

    const math = createElement("math" as keyof HTMLElementTagNameMap, {
      style: {},
    });
    // math.contentEditable = "false";
    const input = createElement("p");
    markPlain(input);
    root.appendChild(input);
    root.appendChild(math);
    this.component = {
      math,
      input,
    };
    this.input.textContent = data.src;
    this.update();
    return root;
  }

  length: number = 1;

  public get editables(): HTMLElement[] {
    return [this.inner];
  }

  public get inner(): HTMLElement {
    return this.component.input;
  }

  public get input(): HTMLParagraphElement {
    return this.component.input;
  }

  public get equation(): string {
    return this.input.textContent || "";
  }

  getEditable(flag: EditableFlag): HTMLElement {
    return this.component.input;
  }

  floatMode() {
    this.input.style.display = "block";
    this.component.math.style.position = "absolute";
    this.component.math.style.width = getComputedStyle(this.root).width;
    computePosition(this.root, this.component.math, {
      placement: "top-start",
    }).then(({ x, y }) => {
      Object.assign(this.component.math.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }

  textMode() {
    this.input.style.position = "unset";
  }
  hideMode() {
    this.component.math.style.position = "unset";
    this.component.math.style.width = "unset";
    this.input.style.display = "none";
  }

  update() {
    let html;
    try {
      html = katex.renderToString(this.input.textContent || "Empty", {
        displayMode: true,
        output: "mathml",
      });
    } catch (error) {
      // 渲染失败，将错误信息作为 HTML 内容返回
      html = `<span style="color: red;">${(error as any).message}</span>`;
    }
    this.component.math.innerHTML = html;
  }

  // serialize(option?: any): BlockSerializedData<EquationData> {
  //   const init = { src: this.input.textContent || "" };
  //   return [{ type: this.type, init, unmergeable: false }];
  // }
}

export class EquationSerializer extends BaseBlockSerializer<Equation> {
  toMarkdown(block: Equation): string {
    return "$$\n" + block.equation + "\n$$\n";
  }
  toHTML(block: Equation): string {
    return outerHTML(block.component.math);
  }
  toJson(block: Equation): BlockSerializedData<EquationData> {
    return {
      type: block.type,
      data: {
        src: block.equation,
      },
    };
  }

  deserialize(data: BlockSerializedData<EquationData>): Equation {
    return new Equation(data.data);
  }
}
