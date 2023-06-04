import { BackLink, InlineSupport, KatexMath } from "@ohno-editor/core";
import { createDefaultPage } from "../basePage";

const page = createDefaultPage();

const inlinePlugin = page.getPlugin<InlineSupport>("inlinesupport");
const mathManager = inlinePlugin.getInlineManager<KatexMath>("math");
const backlinkManager = inlinePlugin.getInlineManager<BackLink>("backlink");

const data = [
  {
    name: "table",
    init: {
      row: 3,
      col: 3,
      children: [
        ["shift + alt + →", "", "shift + alt + ↓"],
        ["", "ctrl+c ctrl+v", ""],
        ["shift + alt + ↑", "", "shift + alt + ←"],
      ],
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
  const block = page.createBlock(name, init);
  page.appendBlock(block);
});

export default page;
