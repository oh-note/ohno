import {
  createElement,
  innerHTMLToNodeList,
  getTagName,
  outerHTML,
} from "../../../system/functional";
import {
  BlockSerializedData,
  OhNoClipboardData,
  Page,
  RangedBlockEventContext,
  IPlugin,
} from "../../../system/types";

import sanitizeHtml from "sanitize-html";
import { CodeData } from "../../blocks/code/block";

export type ParserResult = {
  data: OhNoClipboardData["data"];
};

export type NodeParser = (
  node: Node,
  dataTransfer: DataTransfer
) => ParserResult;
export type KindParser = (datatransfer: DataTransfer) => ParserResult;
export type FileParser = (file: File) => ParserResult;

export class PasteAll implements IPlugin {
  root: HTMLElement;
  name: string = "pasteall";
  parent?: Page | undefined;
  nodeParser: { [key: string]: NodeParser } = {};
  kindParser: { [key: string]: KindParser } = {};
  fileParser: { [key: string]: FileParser } = {};
  constructor() {
    this.root = createElement("div", {
      className: "oh-is-pasteall",
      textContent: "",
    });
  }
  destory(): void {
    throw new Error("Method not implemented.");
  }
  setParent(parent?: Page | undefined): void {
    this.parent = parent;
  }
  registerNodeParser(tagName: string, parser: NodeParser) {
    this.nodeParser[tagName] = parser;
  }
  registerKindParser(kind: string, parser: KindParser) {
    this.kindParser[kind] = parser;
  }

  parse(
    clipboardData: DataTransfer,
    context: RangedBlockEventContext
  ): OhNoClipboardData {
    const ohnoClipboardData: OhNoClipboardData["data"] = [];
    // debugger;
    const plugin = context.page.getPlugin<PasteAll>("pasteall");
    for (const key in this.kindParser) {
      if (clipboardData.getData(key)) {
        const result = this.kindParser[key](clipboardData);
        ohnoClipboardData.push(...result.data);
      }
    }

    Array.from(clipboardData.files).map((item) => {
      if (this.fileParser[item.type]) {
        const result = this.fileParser[item.type](item);
        ohnoClipboardData.push(...result.data);
      } else {
        ohnoClipboardData.push({
          data: {
            code: "unsupport file type `" + item.type + "`\n" + item.name,
          },
          type: "code",
        } as BlockSerializedData<CodeData>);
      }
    });

    const html = clipboardData.getData("text/html");
    const cleanHTML = sanitizeHtml(html);
    const rawNodes = innerHTMLToNodeList(html);
    const nodes = innerHTMLToNodeList(cleanHTML);

    nodes.forEach((item) => {
      const tagName = getTagName(item);
      if (this.nodeParser[tagName]) {
        const result = this.nodeParser[tagName](item, clipboardData);
        ohnoClipboardData.push(...result.data);
      } else if (tagName === "span") {
        // ohnoClipboardData.push({
        //   type: "inline",
        //   data: [
        //     { tagName: "#text", children: (item as HTMLElement).innerHTML },
        //   ],
        // } as InlineSerializedData);
      } else {
        ohnoClipboardData.push({
          data: {
            code: "unsupport node type `" + tagName + "`\n" + outerHTML(item),
            language: "html",
          },
          type: "code",
        } as BlockSerializedData<CodeData>);
      }
    });

    const ohnodata = {
      data: ohnoClipboardData,
    } as OhNoClipboardData;
    return ohnodata;
  }
}
