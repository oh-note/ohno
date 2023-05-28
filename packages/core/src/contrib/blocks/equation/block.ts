import {
  createElement,
  getDefaultRange,
} from "@ohno-editor/core/helper/document";
import {
  indexOfNode,
  parentElementWithTag,
} from "@ohno-editor/core/helper/element";
import { Block, BlockInit } from "@ohno-editor/core/system/block";
import katex from "katex";
import { RefLocation } from "@ohno-editor/core/system/range";
import {
  BlockSerializedData,
  EditableFlag,
} from "@ohno-editor/core/system/base";
import "./style.css";
import { computePosition } from "@floating-ui/dom";
import { markPlain } from "@ohno-editor/core/helper";
export interface EquationInit extends BlockInit {
  src: string;
}
export class Equation extends Block<EquationInit> {
  isMultiEditable: boolean = true;
  mergeable: boolean = false;
  component: {
    math: HTMLElement;
    input: HTMLParagraphElement;
  };
  constructor(init?: EquationInit) {
    init = init || { src: "" };
    if (!init.el) {
      init.el = createElement("pre", {
        attributes: {},
      });
    }

    const math = createElement("math" as keyof HTMLElementTagNameMap, {
      style: {},
    });
    math.contentEditable = "false";
    const input = createElement("p");
    markPlain(input);
    init.el.appendChild(input);
    init.el.appendChild(math);
    super("equation", init);

    this.component = {
      math,
      input,
    };
    this.input.textContent = init.src;
    this.update();
  }
  public get inner(): HTMLElement {
    return this.component.input;
  }

  public get input(): HTMLParagraphElement {
    return this.component.input;
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

  serialize(option?: any): BlockSerializedData<EquationInit> {
    const init = { src: this.input.textContent || "" };
    return [{ type: this.type, init, unmergeable: false }];
  }
}
