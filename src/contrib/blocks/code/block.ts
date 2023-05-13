import { createElement, createTextNode } from "@/helper/document";
import { outerHTML } from "@/helper/element";
import { BlockSerializedData } from "@/system/base";
import { Block, BlockInit } from "@/system/block";
import { Offset } from "@/system/position";
import { clipRange } from "@/system/range";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import "./style.css";
export interface CodeInit extends BlockInit {
  language?: string;
  code?: string;
}

export class Code extends Block<CodeInit> {
  mergeable: boolean = false;
  plain: HTMLElement;
  render: HTMLElement;
  constructor(init?: CodeInit) {
    const init_ = Object.assign({}, { code: "" }, init);
    if (!init_.el) {
      const plain = createElement("p", { textContent: init_.code || "" });
      const render = createElement("code");
      init_.el = createElement("pre", {
        attributes: {},
        children: [render, plain],
      });
      super("code", init_);
      this.plain = plain;
      this.render = render;
      this.updateRender();
    } else {
      super("code", init_);
      this.plain = init_.el.querySelector("p")!;
      this.render = init_.el.querySelector("code")!;
      if (!this.plain || !this.render) {
        throw new Error("Sanity Check");
      }
    }
  }

  public get inner(): HTMLElement {
    return this.plain;
  }

  updateRender() {
    const code = this.plain.textContent || "";
    const html = hljs.highlightAuto(code).value;
    this.render.innerHTML = html;
  }
  // serialize(option?: any): CodeInit {
  //   return { code: this.plain.textContent || "", language: this.init.language };
  // }
  serialize(option?: any): BlockSerializedData<CodeInit> {
    const init = {
      code: this.plain.textContent || "",
      language: this.init.language,
    };

    return [{ type: this.type, init, unmergeable: false }];
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
}
