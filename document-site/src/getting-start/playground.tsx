import { createDefaultPage } from "../basePage";
import { useEffect, useRef } from "react";

import {
  BackLink,
  Flag,
  InlineSupport,
  KatexMath,
  KeyLabel,
  TodoItem,
  createToolbar,
  outerHTML,
} from "@ohno-editor/core";

const page = createDefaultPage();
const el = document.querySelector("#app") as HTMLElement;

createToolbar();
el.appendChild(createToolbar());

const inlinePlugin = page.getPlugin<InlineSupport>("inlinesupport");

const mathManager = inlinePlugin.getInlineManager<KatexMath>("math");
const keylabelManager = inlinePlugin.getInlineManager<KeyLabel>("keylabel");

const math = mathManager.create("\\int_{a}^{b} f(x) dx");

const backlinkManager = inlinePlugin.getInlineManager<BackLink>("backlink");
const backlink = backlinkManager.create({ content: "Welcom", type: "plain" });

const todoitemManager = inlinePlugin.getInlineManager<TodoItem>("todoitem");
const flagManager = inlinePlugin.getInlineManager<Flag>("flag");

const todoTodoitem = todoitemManager.create({
  status: "deprecated",
  title: "This is an todo item",
});

const data = [
  {
    name: "headings",
    init: {
      children: "ohno playground",
      level: 1,
    },
  },
  {
    name: "paragraph",
    init: {
      children: [
        `ohno support Headings, Blockquote, Paragraph three one line block types`,
      ],
    },
  },
  {
    name: "paragraph",
    init: {
      children: [
        `This is a Paragraph block. Type`,
        outerHTML(
          keylabelManager.create({
            code: "#" as WinKeyCode,
          })
        ),
        outerHTML(
          keylabelManager.create({
            code: ">" as WinKeyCode,
          })
        ),
        `then type`,
        outerHTML(
          keylabelManager.create({
            code: "Space",
          })
        ),
        `to change it as heading or blockquote.`,
      ],
    },
  },
  {
    name: "blockquote",
    init: {
      children: [
        `This is a Blockquote block, you can type `,
        outerHTML(
          keylabelManager.create({
            code: "Backspace",
          })
        ),
        `at line head to change it to paragraph.`,
      ],
    },
  },
  {
    name: "headings",
    init: {
      children: [`This is a Headings block with level 1.`],
      level: 1,
    },
  },
  {
    name: "headings",
    init: {
      children: [`Heading with level 2.`],
      level: 2,
    },
  },
  {
    name: "headings",
    init: {
      children: [`Heading with level 5.`],
      level: 5,
    },
  },
  {
    name: "paragraph",
    init: {
      children: [`ohno also support List, Ordered List and Table`],
    },
  },
  {
    name: "list",
    init: {
      children: [
        [
          outerHTML(
            keylabelManager.create({
              code: "Tab",
            })
          ),
          `to indent`,
        ],
        [
          outerHTML(
            keylabelManager.create({
              code: "Backspace",
            })
          ),
          `or`,
          outerHTML(
            keylabelManager.create({
              shiftKey: true,
              code: "Tab",
            })
          ),
          `to deindent`,
        ],
        [
          outerHTML(
            keylabelManager.create({
              code: "Backspace",
            })
          ),
          `and`,
          outerHTML(
            keylabelManager.create({
              code: "Delete",
            })
          ),
          `can split or merge neighbor list`,
        ],
      ],
      indent: [0, 1, 0],
    },
  },
  {
    name: "ordered_list",
    init: {
      children: [
        [
          outerHTML(
            keylabelManager.create({
              code: "Tab",
            })
          ),
          `to indent`,
        ],
        [
          outerHTML(
            keylabelManager.create({
              code: "Backspace",
            })
          ),
          `or`,
          outerHTML(
            keylabelManager.create({
              shiftKey: true,
              code: "Tab",
            })
          ),
          `to deindent`,
        ],
        [
          outerHTML(
            keylabelManager.create({
              code: "Backspace",
            })
          ),
          `and`,
          outerHTML(
            keylabelManager.create({
              code: "Delete",
            })
          ),
          `can split or merge neighbor list`,
        ],
      ],
      indent: [0, 1, 0],
    },
  },
  {
    name: "table",
    init: {
      row: 3,
      col: 3,
      children: [
        [
          outerHTML(
            keylabelManager.create({
              shiftKey: true,
              metaKey: true,
              code: "ArrowRight",
            })
          ),
          "",
          outerHTML(
            keylabelManager.create({
              shiftKey: true,
              metaKey: true,
              code: "ArrowDown",
            })
          ),
        ],
        [
          "",
          outerHTML(
            keylabelManager.create({
              metaKey: true,
              code: "KeyC",
            }),
            keylabelManager.create({
              metaKey: true,
              code: "KeyV",
            })
          ),
          "",
        ],
        [
          outerHTML(
            keylabelManager.create({
              shiftKey: true,
              metaKey: true,
              code: "ArrowUp",
            })
          ),
          "",
          outerHTML(
            keylabelManager.create({
              shiftKey: true,
              metaKey: true,
              code: "ArrowLeft",
            })
          ),
        ],
      ],
    },
  },
  {
    name: "paragraph",
    init: {
      children: [`There are some other blocks, like Code, Figure.`],
    },
  },
  {
    name: "figure",
    init: {
      src: "https://picsum.photos/500/300",
      caption:
        "Figure block support caption, you can delete it to hide this placehold.",
    },
  },
  {
    name: "code",
    init: {
      code: "Code now is not well supported, edit operation may have problems.",
    },
  },
  {
    name: "paragraph",
    init: {
      children: [
        `You can implement your own component very easily, like divide:`,
      ],
    },
  },
  {
    name: "divide",
    init: {},
  },
  {
    name: "paragraph",
    init: {
      children: [`Here list some ohno project plan:`],
    },
  },
  {
    name: "list",
    init: {
      children: [
        [
          outerHTML(
            flagManager.create({ constrain: ["DONE", "TODO"], first: "TODO" })
          ),
          "Support context menu.",
        ],
        [
          outerHTML(
            flagManager.create({ constrain: ["DONE", "TODO"], first: "TODO" })
          ),
          "Refining Interface.",
        ],
        [
          outerHTML(
            flagManager.create({ constrain: ["DONE", "TODO"], first: "TODO" })
          ),
          "Optimizing user experience.",
        ],
      ],
    },
  },
  {
    name: "headings",
    init: {
      level: 1,
      children: "Rich block support list",
    },
  },
  {
    name: "paragraph",
    init: {
      children: [`Equation is supported by katex, you can edit it by click:`],
    },
  },
  {
    name: "equation",
    init: {
      src: "f(x) = ax+b",
    },
  },
];

data.forEach(({ name, init }) => {
  const block = page.createBlock(name, init);
  page.appendBlock(block);
});

export default function () {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    page.reverseRender((pageRoot) => {
      if (root.current) {
        root.current.appendChild(pageRoot);
      }
    });
  });
  return <div ref={root}></div>;
}
