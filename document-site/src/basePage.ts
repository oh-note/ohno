import "@ohno-editor/core/style.css";
import {
  ContextMenuPlugin,
  DivideBlock,
  FigureBlock,
  FlagInline,
  KeyLabelInline,
  KeyVisPlugin,
  LinkPlugin,
  Page,
  PasteAllPlugin,
  TodoItemInline,
} from "@ohno-editor/core";
import { ListBlock } from "@ohno-editor/core/contrib/blocks/list";
import { KatexMathInline } from "@ohno-editor/core//contrib/inlines/math";

import { OrderedListBlock } from "@ohno-editor/core//contrib/blocks/orderedList";
import { CodeBlock } from "@ohno-editor/core//contrib/blocks/code";
import { TableBlock } from "@ohno-editor/core//contrib/blocks/table";
import { DefaultBlockHandlerEntry } from "@ohno-editor/core//core/default";
import { MultiBlockHandlerEntry } from "@ohno-editor/core//core/multiblock";
import { CompositionHandlerEntry } from "@ohno-editor/core//core/composition";
import {
  BlockQuoteBlock,
  HeadingsBlock,
  ParagraphBlock,
} from "@ohno-editor/core//contrib/blocks";
import { DragablePlugin } from "@ohno-editor/core//contrib/plugins/dragable";
import { SlashMenuPlugin } from "@ohno-editor/core//contrib/plugins/slashmenu";
import { InlineSupportPlugin } from "@ohno-editor/core//system/inline";
import { BackLinkInline } from "@ohno-editor/core//contrib/inlines/backlink";
import { EquationBlock } from "@ohno-editor/core//contrib/blocks/equation";

export function createDefaultPage() {
  const page = new Page({
    components: {
      blocks: [
        ParagraphBlock(),
        HeadingsBlock(),
        DivideBlock(),
        BlockQuoteBlock(),
        ListBlock(),
        OrderedListBlock(),
        CodeBlock(),
        TableBlock(),
        FigureBlock(),
        EquationBlock(),
      ],
      extraHandlers: [
        DefaultBlockHandlerEntry(),
        MultiBlockHandlerEntry(),
        CompositionHandlerEntry(),
      ],
      plugins: [
        ContextMenuPlugin(),
        LinkPlugin(),
        InlineSupportPlugin(),
        DragablePlugin(),
        SlashMenuPlugin(),
        KeyVisPlugin(),
        PasteAllPlugin(),
      ],
      inlines: [
        FlagInline({}),
        KeyLabelInline(),
        TodoItemInline({}),
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
    blocks: [],
  });
  return page;
}
