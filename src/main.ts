import "./style.css";
import "./inlineStyle.css";
import { Page } from "./system/page";
import {
  createElement,
  innerHTMLToNodeList,
  makeInlineBlock,
} from "./helper/document";
import katex from "katex";

import { List, ListBlock } from "@/contrib/blocks/list";
import dropdown from "./contrib/plugins/dropdown";
import math from "./contrib/inlines/math";

import { BlockCreate } from "./contrib/commands/block";
import { OrderedList, OrderedListBlock } from "./contrib/blocks/orderedList";
import { Code, CodeBlock } from "./contrib/blocks/code";
import { Table } from "./contrib/blocks/table";
import { Figure } from "./contrib/blocks/figure";
import { Equation } from "./contrib/blocks/equation";
import { DefaultBlockHandlerEntry } from "./core/default";
import { MultiBlockHandlerEntry } from "./core/multiblock";
import { CompositionHandlerEntry } from "./core/composition";
import { InlineHandlerEntry } from "./core/inline";
import {
  BlockQuoteBlock,
  Blockquote,
  Headings,
  HeadingsBlock,
  Paragraph,
  ParagraphBlock,
} from "./contrib/blocks";

const page = new Page({
  components: {
    blocks: [
      ParagraphBlock(),
      HeadingsBlock(),
      BlockQuoteBlock(),
      ListBlock(),
      OrderedListBlock(),
      CodeBlock(),
      // HeadingsBlockEntry,
      // BlockquoteBlockEntry,
      // OrderedListBlockEntry,
      // ListBlockEntry,
      // TableBlockEntry,
      // FigureBlockEntry,
      // CodeBlockEntry,
    ],
    extraHandlers: [
      DefaultBlockHandlerEntry(),
      MultiBlockHandlerEntry(),
      CompositionHandlerEntry(),
      InlineHandlerEntry(),
    ],
    // plugins: [
    //   dropdown([
    //     {
    //       plain: "Heading 1",
    //       type: "plain",
    //       filter: "Heading 1",
    //       onSelect: ({ page, block }) => {
    //         const newBlock = new Headings();
    //         const command = new BlockCreate({
    //           block,
    //           page,
    //           newBlock,
    //           where: "after",
    //         });
    //         page.executeCommand(command);
    //       },
    //     },
    //     { plain: "Heading 2", type: "plain", filter: "Heading 2" },
    //     { plain: "Heading 3", type: "plain", filter: "Heading 3" },
    //     { plain: "Heading 4", type: "plain", filter: "Heading 4" },
    //     { plain: "Heading 5", type: "plain", filter: "Heading 5" },
    //   ]),
    //   math(),
    // ],
  },
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
  "Lor<em>em ipsum</em> ipsum <b>dolor <i>sit <code>amet</code></i></b>, consectetur adipiscing elit, sed do eiusmod <code>tempor <b><i>code incididunt code</i></b></code> ut labore et dolore magna aliqua.";

page.appendBlock(new Paragraph({ innerHTML, children: [wrap] }));
page.appendBlock(new Headings({ level: 1, innerHTML: "Heading 1" }));
// page.appendBlock(new Paragraph({ innerHTML, children: [wrap] }));
// page.appendBlock(new Paragraph({}));
// innerHTML = "012<b>456</b>89<i>012</i>";
// page.appendBlock(new Paragraph({ children: [wrap] }));
// page.appendBlock(new Paragraph({ innerHTML, children: [wrap] }));
// page.appendBlock(new Paragraph({ innerHTML, children: [wrap] }));
page.appendBlock(new Code({ code: "print('hello world!')" }));
// page.appendBlock(new Table({ shape: { row: 3, col: 3 } }));
page.appendBlock(new Blockquote({ innerHTML, children: [wrap] }));
// page.appendBlock(new Equation({ src: "f(a) = a^2 + bx" }));
// page.appendBlock(
//   new Paragraph({ innerHTML: Array(20).fill("long text ").join(" ") })
// );

// page.appendBlock(new Figure({ src: "/vite.svg" }));
page.appendBlock(new OrderedList({ firstLiInnerHTML: innerHTML }));
page.appendBlock(new List({ firstLiInnerHTML: innerHTML }));
// page.appendBlock(
//   new List({
//     children: [
//       createElement("li", { innerHTML: "012<b>345</b>6" }),
//       createElement("li", { innerHTML: "123<b>456</b>7" }),
//       createElement("li", { innerHTML: "234<b>567</b>8" }),
//       createElement("li", { innerHTML: "2345678" }),
//       createElement("li", {
//         innerHTML: Array(20).fill("long text ").join(" "),
//       }),
//       createElement("li", { innerHTML: "2345678" }),
//     ],
//   })
// );
// innerHTML = "";
// page.appendBlock(new Blockquote({ innerHTML, children: [wrap] }));
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

// document.body.appendChild(
//   createElement("button", {
//     textContent: "append",
//     eventHandler: {
//       click: () => {
//         page.appendBlock(
//           new Blockquote({ el: createElement("p", { textContent: "Hello" }) })
//         );
//       },
//     },
//   })
// );

// const ipt = createElement("input", {});
// document.body.appendChild(ipt);

// document.body.appendChild(
//   createElement("button", {
//     textContent: "insert before",
//     eventHandler: {
//       click: () => {
//         page.insertBlockBefore(
//           ipt.value,
//           new Blockquote({
//             el: createElement("p", { textContent: "Hello Insert Before" }),
//           })
//         );
//       },
//     },
//   })
// );

// document.body.appendChild(
//   createElement("button", {
//     textContent: "insert after",
//     eventHandler: {
//       click: () => {
//         page.insertBlockAfter(
//           ipt.value,
//           new Blockquote({
//             el: createElement("p", { textContent: "Hello Insert After" }),
//           })
//         );
//       },
//     },
//   })
// );

// document.body.appendChild(
//   createElement("button", {
//     textContent: "replace",
//     eventHandler: {
//       click: () => {
//         page.replaceBlock(
//           ipt.value,
//           new Blockquote({
//             el: createElement("p", { textContent: "Hello replace" }),
//           })
//         );
//       },
//     },
//   })
// );

// document.body.appendChild(
//   createElement("button", {
//     textContent: "remove",
//     eventHandler: {
//       click: () => {
//         page.removeBlock(ipt.value);
//       },
//     },
//   })
// );
