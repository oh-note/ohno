import { createElement } from "@ohno-editor/core/helper/document";
import { BlockSerializedData } from "@ohno-editor/core/system/base";
import { Block, BlockInit } from "@ohno-editor/core/system/block";
import { clipRange } from "@ohno-editor/core/system/range";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import "./style.css";
import { markPlain } from "@ohno-editor/core/helper";
export interface CodeInit extends BlockInit {
  language?: string;
  code?: string;
}

export class Code extends Block<CodeInit> {
  mergeable: boolean = false;
  plain: HTMLElement;
  lno: HTMLElement;
  render: HTMLElement;
  constructor(init?: CodeInit) {
    const init_ = Object.assign({}, { code: " " }, init);
    if (!init_.el) {
      const plain = createElement("p", { textContent: init_.code || " " });
      markPlain(plain);
      const render = createElement("code");

      const head = createElement("div", {
        className: "code-head",
      });
      const lno = createElement("div", {
        className: "line-number",
      });

      const container = createElement("div", {
        className: "container",
        children: [render, plain],
      });
      const body = createElement("div", {
        className: "code-body",
        children: [lno, container],
      });
      const root = createElement("div", {
        className: "root",
        children: [head, body],
      });

      init_.el = createElement("pre", {
        attributes: {},
        children: [root],
      });
      super("code", init_);
      this.plain = plain;
      this.render = render;
      this.lno = lno;
      this.updateRender();
    } else {
      throw new Error("Sanity Check");
    }
  }

  public get inner(): HTMLElement {
    return this.plain;
  }

  updateRender() {
    if (this.plain.textContent === "") {
      this.plain.textContent = " ";
    }
    const code = this.plain.textContent || " ";
    const html = hljs.highlightAuto(code).value;
    this.render.innerHTML = html;
    const lineNumber = code.split("\n").length;
    const offset = this.lno.childNodes.length;
    if (offset > lineNumber) {
      while (this.lno.childNodes[lineNumber]) {
        this.lno.childNodes[lineNumber].remove();
      }
    } else {
      Array(lineNumber - offset)
        .fill(0)
        .forEach((item, index) => {
          this.lno.appendChild(
            createElement("div", { textContent: index + offset + "" })
          );
        });
    }
  }

  public get language(): string {
    return this.init.language || "";
  }

  public get head(): string {
    return "```" + this.language + "\n";
  }

  public get tail(): string {
    return "\n```";
  }

  toMarkdown(range?: Range | undefined): string {
    if (!range || range.collapsed) {
      return this.head + (this.inner.textContent || "") + this.tail;
    }
    const innerRange = clipRange(this.inner, range);
    if (innerRange) {
      return this.head + innerRange.cloneContents().textContent + this.tail;
    }
    return "";
  }

  serialize(option?: any): BlockSerializedData<CodeInit> {
    const init = {
      code: this.plain.textContent || " ",
      language: this.init.language,
    };

    return [{ type: this.type, init, unmergeable: false }];
  }
}
