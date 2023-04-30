import { createElement, createTextNode } from "@/helper/document";
import { outerHTML } from "@/helper/element";
import { Block, BlockInit } from "@/system/block";
import { Offset } from "@/system/position";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

export interface CodeInit extends BlockInit {
  language?: string;
  code?: string;
}

export class Code extends Block<CodeInit> {
  type: string = "code";

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
      super(init_);
      this.plain = plain;
      this.render = render;
      this.updateRender();
    } else {
      super(init_);
      this.plain = init_.el.querySelector("p")!;
      this.render = init_.el.querySelector("code")!;
      if (!this.plain || !this.render) {
        throw new Error("Sanity Check");
      }
    }
  }
  public get edit_root(): HTMLElement {
    return this.plain;
  }

  // getOffset(range?: Range | undefined): Offset {

  // }
  // setOffset(offset: Offset, defaultOffset?: Offset | undefined): void {

  // }
  // getNextRange(range: Range, container?: HTMLElement | undefined): Range | null {

  // }
  // getNextWordPosition(range: Range, container?: HTMLElement | undefined): Range | null {

  // }
  // getPrevRange(range: Range, container?: HTMLElement | undefined): Range | null {

  // }
  // getPrevWordPosition(range: Range, container?: HTMLElement | undefined): Range | null {

  // }

  updateRender() {
    const code = this.plain.textContent || "";
    const html = hljs.highlightAuto(code).value;
    this.render.innerHTML = html;
  }
}
