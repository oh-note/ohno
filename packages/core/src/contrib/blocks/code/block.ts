import {
  createElement,
  createTextNode,
  innerHTMLToNodeList,
} from "@ohno-editor/core/helper/document";
import {
  BaseBlockSerializer,
  BlockSerializedData,
  Page,
} from "@ohno-editor/core/system";
import { Block, BlockData } from "@ohno-editor/core/system/block";
import {
  clipRange,
  createRange,
  getLineInfo,
  getValidAdjacent,
} from "@ohno-editor/core/system/range";
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

  selection: SelectionMethods = new PlainSelection();
  constructor(data?: CodeData) {
    data = Object.assign({}, { code: " " }, data);

    const editer = createElement("code", { textContent: data.code || " " });
    markPlain(editer);

    const head = createElement("div", {
      className: "code-head",
    });
    const lno = createElement("div", {
      className: "line-number",
    });

    const container = createElement("div", {
      className: "container",
      children: [editer],
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
    this.plain = editer;

    this.lno = lno;
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

  setParent(parent?: Page | undefined): void {
    super.setParent(parent);
    if (parent) {
      this.updateRender();
    }
  }

  updateRender() {
    if (this.plain.textContent === "") {
      this.plain.textContent = " ";
    }

    const code = this.plain.textContent || " ";
    const html = hljs.highlightAuto(code).value;
    // debugger;
    const lineNodes = html
      .trimEnd()
      .split("\n")
      .flatMap((item) => {
        return [
          createElement("li", {
            children: innerHTMLToNodeList(item),
          }),
          createTextNode("\n"),
        ];
      });
    this.plain.replaceChildren(...lineNodes);

    const lineNumber = lineNodes.length;
    const offset = this.lno.childNodes.length;

    // if (offset > lineNumber) {
    //   while (this.lno.childNodes[lineNumber]) {
    //     this.lno.childNodes[lineNumber].remove();
    //   }
    // } else {
    //   Array(lineNumber - offset)
    //     .fill(0)
    //     .forEach((item, index) => {
    //       const lineh = getComputedStyle(lineNodes[index + offset]).height;
    //       this.lno.appendChild(
    //         createElement("div", {
    //           textContent: index + offset + "",
    //           style: { height: lineh },
    //         })
    //       );
    //     });
    // }
  }
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
