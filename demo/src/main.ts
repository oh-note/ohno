import "@ohno-editor/core/style.css";
import { BlockInit, Page, createTextNode } from "@ohno-editor/core";
import { List, ListBlock } from "@ohno-editor/core/contrib/blocks/list";
import { KatexMathInline } from "@ohno-editor/core//contrib/inlines/math";

import {
  OrderedList,
  OrderedListBlock,
} from "@ohno-editor/core//contrib/blocks/orderedList";
import { Code, CodeBlock } from "@ohno-editor/core//contrib/blocks/code";
import { Table, TableBlock } from "@ohno-editor/core//contrib/blocks/table";
import { DefaultBlockHandlerEntry } from "@ohno-editor/core//core/default";
import { MultiBlockHandlerEntry } from "@ohno-editor/core//core/multiblock";
import { CompositionHandlerEntry } from "@ohno-editor/core//core/composition";
import { InlineHandlerEntry } from "@ohno-editor/core//core/inline";
import {
  BlockQuoteBlock,
  Blockquote,
  Headings,
  HeadingsBlock,
  Paragraph,
  ParagraphBlock,
} from "@ohno-editor/core//contrib/blocks";
import { DragablePlugin } from "@ohno-editor/core//contrib/plugins/dragable";
import { SlashMenuPlugin } from "@ohno-editor/core//contrib/plugins/slashmenu";
import { ToolbarPlugin } from "@ohno-editor/core//contrib/plugins/toolbar";
import { InlineSupportPlugin } from "@ohno-editor/core//contrib/plugins/inlineSupport";
import { InlineSupport } from "@ohno-editor/core//contrib/plugins/inlineSupport/plugin";
import { KatexMath } from "@ohno-editor/core//contrib/inlines/math/inline";
import { BackLinkInline } from "@ohno-editor/core//contrib/inlines/backlink";
import { BackLink } from "@ohno-editor/core//contrib/inlines/backlink/inline";
import {
  EquationBlock,
  Equation,
} from "@ohno-editor/core//contrib/blocks/equation";

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
      InlineSupportPlugin(),
      // ToolbarPlugin(),
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
const math = mathManager.create("\\int_{a}^{b} f(x) dx");

const backlinkManager = inlinePlugin.getInlineManager<BackLink>("backlink");
const backlink = backlinkManager.create();

let innerHTML =
  "Lor<em>em ipsum</em> ipsum <b>dolor <i>sit <code>amet</code></i></b>, consectetur adipiscing elit, sed do eiusmod <code>tempor <b><i>code incididunt code</i></b></code> ut labore et dolore magna aliqua.";

const data = [
  {
    name: "headings",
    init: {
      innerHTML: "ohno... Another block-style, markdown suppoted, rich editor",
      level: 1,
    },
  },
  {
    name: "paragraph",
    init: {
      innerHTML: `ohno is a rich text editor designed from the bottom up, aiming to achieve minimal bugs and maximum scalability with the simplest code possible, while providing a friendly and customizable user editing experience.`,
    },
  },

  {
    name: "headings",
    init: { innerHTML: "What functions ohno provided", level: 2 },
  },
  { name: "paragraph", init: { innerHTML: "For users:" } },
  {
    name: "list",
    init: {
      innerHTMLs: [
        "Markdown-style editing experience",
        "Reliable editing results",
        "Optimized user experience",
      ],
    },
  },
  { name: "paragraph", init: { innerHTML: "For developers:" } },
  {
    name: "list",
    init: {
      innerHTMLs: [
        "Clear architectural design",
        "Near-linear scalability in complexity",
        "Rich component examples",
      ],
    },
  },
  {
    name: "headings",
    init: { innerHTML: "Talk is cheap, show me your EDITOR", level: 2 },
  },
  {
    name: "paragraph",
    init: { innerHTML: "Please follow each step below:" },
  },
  {
    name: "headings",
    init: { innerHTML: "|<- type <code>#</code> and space here", level: 4 },
  },
  {
    name: "headings",
    init: { innerHTML: "|<- type <code>Backspace</code> here", level: 1 },
  },
  {
    name: "list",
    init: {
      innerHTMLs: [
        "First line",
        "|<- type <code>Backspace x 2</code> here",
        "Last line",
      ],
    },
  },
  {
    name: "blockquote",
    init: {
      children: [createTextNode("Edit this backlink"), backlink],
    },
  },
  {
    name: "blockquote",
    init: {
      children: [createTextNode("Edit this inline math"), math],
    },
  },
  {
    name: "equation",
    init: {
      src: "f(x) = ax + b",
    },
  },
  {
    name: "paragraph",
    init: { innerHTML: "Type <code>Alt+ ↑↓</code> to move block." },
  },
  {
    name: "paragraph",
    init: { innerHTML: "Type <b>ctrl+z</b> to undo all your operations." },
  },

  // { name: "headings", init: { innerHTML: "Why less bugs", level: 2 } },
  // { name: "headings", init: { innerHTML: "Why more extensible", level: 2 } },
  // { name: "paragraph", init: { innerHTML: "Why use it" } },
  // { name: "paragraph", init: { innerHTML: "Why use it" } },
];

data.forEach(({ name, init }) => {
  const block = page.createBlock(name, init as BlockInit);
  page.appendBlock(block);
});

page.appendBlock(
  new Table({
    shape: {
      row: 3,
      col: 3,
      innerHTMLs: [
        ["shift + alt + →", undefined, "shift + alt + ↓"],
        ["", "ctrl+c ctrl+v", ""],
        ["shift + alt + ↑", undefined, "shift + alt + ←"],
      ],
    },
  })
);
