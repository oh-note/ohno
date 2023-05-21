import {
  BackLink,
  BlockInit,
  InlineSupport,
  KatexMath,
  Table,
  createTextNode,
} from "@ohno-editor/core";
import { createDefaultPage } from "../basePage";

const page = createDefaultPage();

const inlinePlugin = page.getPlugin<InlineSupport>("inlinesupport");
const mathManager = inlinePlugin.getInlineManager<KatexMath>("math");
const math = mathManager.create("\\int_{a}^{b} f(x) dx");

const backlinkManager = inlinePlugin.getInlineManager<BackLink>("backlink");
const backlink = backlinkManager.create();

const data = [
  {
    name: "table",
    init: {
      shape: {
        row: 3,
        col: 3,
        innerHTMLs: [
          ["shift + alt + →", undefined, "shift + alt + ↓"],
          ["", "ctrl+c ctrl+v", ""],
          ["shift + alt + ↑", undefined, "shift + alt + ←"],
        ],
      },
    },
  },
  {
    name: "paragraph",
    init: {
      children: [
        "Error 2023-05-21-15-58：ctrl+A Delete will raise an Exception",
      ],
    },
  },
];

data.forEach(({ name, init }) => {
  const block = page.createBlock(name, init as BlockInit);
  page.appendBlock(block);
});

export default page;
