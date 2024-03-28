import "@ohno/core/style.css";
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
} from "@ohno/core";
import { ListBlock } from "@ohno/core/contrib/blocks/list";
import { KatexMathInline } from "@ohno/core//contrib/inlines/math";

import { OrderedListBlock } from "@ohno/core//contrib/blocks/orderedList";
import { CodeBlock } from "@ohno/core//contrib/blocks/code";
import { TableBlock } from "@ohno/core//contrib/blocks/table";
import { DefaultBlockHandlerEntry } from "@ohno/core//core/default";
import { MultiBlockHandlerEntry } from "@ohno/core//core/multiblock";
import { CompositionHandlerEntry } from "@ohno/core//core/composition";
import {
  BlockQuoteBlock,
  HeadingsBlock,
  ParagraphBlock,
} from "@ohno/core//contrib/blocks";
import { DragablePlugin } from "@ohno/core//contrib/plugins/dragable";
import { SlashMenuPlugin } from "@ohno/core//contrib/plugins/slashmenu";
import { InlineSupportPlugin } from "@ohno/core//system/inline";
import { BackLinkInline } from "@ohno/core//contrib/inlines/backlink";
import { EquationBlock } from "@ohno/core//contrib/blocks/equation";

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
