import "./style.css";
import { Page } from "./system/page";
import {
  createElement,
  innerHTMLToNodeList,
  makeInlineBlock,
} from "./helper/document";
import katex from "katex";
import {
  Blockquote,
  BlockquoteHandlers,
  HeadingHandlers,
  Headings,
  Paragraph,
  ParagraphHandlers,
} from "./contrib/blocks";
import { DefaultBlockHandler } from "./contrib";

const page = new Page({
  handlers: [
    { globalHandler: new DefaultBlockHandler() },
    ParagraphHandlers,
    HeadingHandlers,
    BlockquoteHandlers,
  ],
});

const el = document.querySelector("#app") as HTMLElement;
if (el) {
  page.render(el);
}

const formula = "\\int_{a}^{b} f(x) dx"; // 要插入的公式
// { displayMode: true }
const renderedFormula = katex.renderToString(formula, { output: "mathml" });

const wrap = makeInlineBlock({
  attributes: { value: formula },
  el: innerHTMLToNodeList(renderedFormula),
  serailizer: "katex",
});

let innerHTML =
  "Lor<i>em ipsum</i> ipsum <b>dolor <i>sit <code>amet</code></i></b>, consectetur adipiscing elit, sed do eiusmod <code>tempor <b><i><code>incididunt</code></i></b></code> ut labore et dolore magna aliqua.";

innerHTML = "012<b>456</b>89<i>012</i>";

page.appendBlock(new Paragraph({ innerHTML, children: [wrap] }));
page.appendBlock(new Headings({ level: 1, innerHTML: "Heading 1" }));
page.appendBlock(new Paragraph({ innerHTML, children: [wrap] }));
page.appendBlock(new Paragraph({}));
page.appendBlock(new Paragraph({ innerHTML, children: [wrap] }));
page.appendBlock(new Paragraph({ innerHTML, children: [wrap] }));
page.appendBlock(new Blockquote({ innerHTML, children: [wrap] }));
innerHTML = "";
page.appendBlock(new Blockquote({ innerHTML, children: [wrap] }));
// page.appendBlock(new ParagraphQuote(undefined, undefined, "hello"));
// page.appendBlock(new H1(undefined, undefined, "hello"));

// document.addEventListener("selectionchange", () => {
//   console.log(document.getSelection());
// });
// const np = document.createElement("textarea");
// np.value = "123123123123";
// np.addEventListener("selectionchange", (e) => {
//   console.log(e);
// });
// np.contentEditable = "true";
// document.body.appendChild(np);

document.body.appendChild(
  createElement("button", {
    textContent: "append",
    eventHandler: {
      click: () => {
        page.appendBlock(
          new Blockquote({ el: createElement("p", { textContent: "Hello" }) })
        );
      },
    },
  })
);

const ipt = createElement("input", {});
document.body.appendChild(ipt);

document.body.appendChild(
  createElement("button", {
    textContent: "insert before",
    eventHandler: {
      click: () => {
        page.insertBlockBefore(
          ipt.value,
          new Blockquote({
            el: createElement("p", { textContent: "Hello Insert Before" }),
          })
        );
      },
    },
  })
);

document.body.appendChild(
  createElement("button", {
    textContent: "insert after",
    eventHandler: {
      click: () => {
        page.insertBlockAfter(
          ipt.value,
          new Blockquote({
            el: createElement("p", { textContent: "Hello Insert After" }),
          })
        );
      },
    },
  })
);

document.body.appendChild(
  createElement("button", {
    textContent: "replace",
    eventHandler: {
      click: () => {
        page.replaceBlock(
          ipt.value,
          new Blockquote({
            el: createElement("p", { textContent: "Hello replace" }),
          })
        );
      },
    },
  })
);

document.body.appendChild(
  createElement("button", {
    textContent: "remove",
    eventHandler: {
      click: () => {
        page.removeBlock(ipt.value);
      },
    },
  })
);
