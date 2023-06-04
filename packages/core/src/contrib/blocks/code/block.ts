import { createElement } from "@ohno-editor/core/helper/document";
import {
  BaseBlockSerializer,
  BlockSerializedData,
} from "@ohno-editor/core/system";
import { Block, BlockData } from "@ohno-editor/core/system/block";
import { clipRange } from "@ohno-editor/core/system/range";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import "./style.css";
import { markPlain, outerHTML } from "@ohno-editor/core/helper";
import {
  PlainSelection,
  SelectionMethods,
} from "@ohno-editor/core/system/selection";
export interface CodeData extends BlockData {
  language?: string;
  code?: string;
}

export class Code extends Block<CodeData> {
  mergeable: boolean = false;
  plain: HTMLElement;
  lno: HTMLElement;
  render: HTMLElement;
  selection: SelectionMethods = new PlainSelection();
  constructor(data?: CodeData) {
    data = Object.assign({}, { code: " " }, data);

    const plain = createElement("p", { textContent: data.code || " " });
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
      children: [plain],
    });
    const body = createElement("div", {
      className: "code-body",
      children: [lno, container],
    });
    const inner = createElement("div", {
      className: "root",
      children: [head, body],
    });

    const root = createElement("pre", {
      attributes: {},
      children: [inner],
    });
    super("code", root, { meta: data, plain: true });
    this.plain = plain;
    this.render = render;
    this.lno = lno;
    this.updateRender();
  }

  public get inner(): HTMLElement {
    return this.plain;
  }

  public get language(): string {
    return this.meta.language || "";
  }

  public get code(): string {
    return this.plain.textContent || "";
  }

  updateRender() {
    if (this.plain.textContent === "") {
      this.plain.textContent = " ";
    }
    const code = this.plain.textContent || " ";
    const html = hljs.highlightAuto(code).value;
    this.plain.innerHTML = html;
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

  // toMarkdown(range?: Range | undefined): string {
  //   if (!range || range.collapsed) {
  //     return this.head + (this.inner.textContent || "") + this.tail;
  //   }
  //   const innerRange = clipRange(this.inner, range);
  //   if (innerRange) {
  //     return this.head + innerRange.cloneContents().textContent + this.tail;
  //   }
  //   return "";
  // }

  // serialize(option?: any): BlockSerializedData<CodeData> {
  //   const init = {
  //     code: this.plain.textContent || " ",
  //     language: this.meta.language,
  //   };

  //   return [{ type: this.type, init, unmergeable: false }];
  // }
}

export class CodeSerializer extends BaseBlockSerializer<Code> {
  toMarkdown(block: Code): string {
    return "```" + block.language + "\n" + block.code + "\n```\n";
  }
  toHTML(block: Code): string {
    return outerHTML(block.root);
  }
  toJson(block: Code): BlockSerializedData<CodeData> {
    return {
      type: block.type,
      data: {
        code: block.code,
        language: block.language,
      },
    };
  }

  deserialize(data: BlockSerializedData<CodeData>): Code {
    return new Code(data.data);
  }
}
