import {
  createElement,
  getDefaultRange,
} from "@ohno-editor/core/helper/document";
import {
  indexOfNode,
  outerHTML,
  parentElementWithTag,
} from "@ohno-editor/core/helper/element";
import { Block, BlockData } from "@ohno-editor/core/system/block";
import katex from "katex";
import { RefLocation } from "@ohno-editor/core/system/range";
import {
  BaseBlockSerializer,
  BlockSerializedData,
  EditableFlag,
} from "@ohno-editor/core/system";
import "./style.css";
import { computePosition } from "@floating-ui/dom";
import { markPlain } from "@ohno-editor/core/helper";
export interface EquationData extends BlockData {
  src: string;
}
export class Equation extends Block<EquationData> {
  isMultiEditable: boolean = true;
  mergeable: boolean = false;
  component: {
    math: HTMLElement;
    input: HTMLParagraphElement;
  };
  constructor(data?: EquationData) {
    data = data || { src: "" };
    const root = createElement("pre", {
      attributes: {},
    });

    const math = createElement("math" as keyof HTMLElementTagNameMap, {
      style: {},
    });
    math.contentEditable = "false";
    const input = createElement("p");
    markPlain(input);
    root.appendChild(input);
    root.appendChild(math);
    super("equation", root);

    this.component = {
      math,
      input,
    };
    this.input.textContent = data.src;
    this.update();
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
