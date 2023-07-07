import {
  createElement,
  createTextNode,
  innerHTMLToNodeList,
  outerHTML,
} from "@ohno-editor/core/system/functional";
import {
  BaseBlockSerializer,
  BlockSerializedData,
  Block,
  BlockData,
  PlainSelection,
  RefLocation,
  SelectionMethods,
} from "@ohno-editor/core/system/types";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import "./style.css";
import { markPlain } from "@ohno-editor/core/system/status";

export interface CodeData extends BlockData {
  language?: string;
  code?: string;
}

export class Code extends Block<CodeData> {
  mergeable: boolean = false;

  plain!: HTMLElement;
  lno!: HTMLElement;

  selection: SelectionMethods = new PlainSelection();
  constructor(data?: CodeData) {
    data = Object.assign({}, { code: " " }, data);
    super("code", data, { meta: data, plain: true });
  }

  public get length(): number {
    return 1;
  }

  public get editables(): HTMLElement[] {
    return [this.plain];
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
  render(data: CodeData): HTMLElement {
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
    this.plain = editer;
    this.lno = lno;
    return root;
  }
  async lazy_render(): Promise<void> {
    this.updateRender();
  }

  isLocationInLastLine(loc: RefLocation): boolean {
    const range = this.selection.createRange();
    range.selectNode(this.inner.lastChild as Node);
    const [_, a] = this.selection.getRects(range);
    range.setStart(...loc);
    const [__, b] = this.selection.getRects(range);

    return this.selection.inSameLine(a, b);
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
