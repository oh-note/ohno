import "./style.css";
import "./inlineStyle.css";
import { Page } from "./system/page";

import { List, ListBlock } from "@/contrib/blocks/list";
import { KatexMathInline } from "./contrib/inlines/math";

import { OrderedList, OrderedListBlock } from "./contrib/blocks/orderedList";
import { Code, CodeBlock } from "./contrib/blocks/code";
import { Table, TableBlock } from "./contrib/blocks/table";
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
import { DragablePlugin } from "./contrib/plugins/dragable";
import { SlashMenuPlugin } from "./contrib/plugins/slashmenu";
import { ToolbarPlugin } from "./contrib/plugins/toolbar";
import { InlineSupportPlugin } from "./contrib/plugins/inlineSupport";
import { InlineSupport } from "./contrib/plugins/inlineSupport/plugin";
import { KatexMath } from "./contrib/inlines/math/inline";
import { BackLinkInline } from "./contrib/inlines/backlink";
import { BackLink } from "./contrib/inlines/backlink/inline";
import { EquationBlock, Equation } from "./contrib/blocks/equation";

const page = new Page({
  components: {
    blocks: [
      ParagraphBlock(),
      HeadingsBlock(),
      BlockQuoteBlock(),
      ListBlock(),
      OrderedListBlock(),
      CodeBlock(),
      TableBlock(),
      EquationBlock(),
    ],
    extraHandlers: [
      DefaultBlockHandlerEntry(),
      MultiBlockHandlerEntry(),
      CompositionHandlerEntry(),
      InlineHandlerEntry(),
    ],
    plugins: [
      DragablePlugin(),
      SlashMenuPlugin(),
      ToolbarPlugin(),
      InlineSupportPlugin(),
    ],
    inlines: [
      KatexMathInline(),
      BackLinkInline({
        onLoad: (content) => {
          return new Promise((resolve) => {
            if (content.length > 8) {
              resolve([
                {
                  cite: "https://github.com/sailist",
                  content: "Welcome to visit my homepage",
                  type: "link",
                },
                {
                  cite: "https://github.com/sailist/ohno",
                  content: "Ohno is an open source project.",
                  type: "link",
                },
              ]);
            } else if (content.length < 3) {
              resolve([
                {
                  cite: "https://github.com/sailist",
                  content: "Welcome to visit my homepage",
                  type: "link",
                },
                {
                  cite: "https://github.com/sailist/ohno",
                  content: "Ohno is an open source project.",
                  type: "link",
                },
              ]);
            } else {
              setTimeout(() => {
                resolve([
                  {
                    cite: "",
                    content: "BackLink options are dynamicly loaded.",
                    type: "plain",
                  },
                ]);
              }, 1000);
            }
          });
        },
      }),
    ],
  },
});

const el = document.querySelector("#app") as HTMLElement;
if (el) {
  page.render(el);
}

const inlinePlugin = page.getPlugin<InlineSupport>("inlinesupport");
const mathManager = inlinePlugin.getInlineManager<KatexMath>("math");
const wrap = mathManager.create("\\int_{a}^{b} f(x) dx");

const backlinkManager = inlinePlugin.getInlineManager<BackLink>("backlink");
const backlink = backlinkManager.create();

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
page.appendBlock(
  new Table({ shape: { row: 3, col: 4, innerHTMLs: [["3", undefined, "4"]] } })
);
page.appendBlock(new Blockquote({ children: [backlink] }));
page.appendBlock(new Equation({ src: "f(a) = a^2 + bx" }));
// page.appendBlock(new Paragraph({ innerHTML, children: [wrap] }));
// page.appendBlock(
//   new Paragraph({ innerHTML: Array(20).fill("long text ").join(" ") })
// );

// page.appendBlock(new Figure({ src: "/vite.svg" }));
page.appendBlock(new OrderedList({ innerHTMLs: [innerHTML] }));
page.appendBlock(new List({ innerHTMLs: [innerHTML, innerHTML] }));
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
