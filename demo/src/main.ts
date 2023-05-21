import { createDefaultPage } from "./basePage";

import {
  BackLink,
  BlockInit,
  InlineSupport,
  KatexMath,
  KeyLabel,
  Table,
  TodoItem,
  createTextNode,
  outerHTML,
} from "@ohno-editor/core";

const page = createDefaultPage();
const el = document.querySelector("#app") as HTMLElement;

const inlinePlugin = page.getPlugin<InlineSupport>("inlinesupport");

const mathManager = inlinePlugin.getInlineManager<KatexMath>("math");
const keylabelManager = inlinePlugin.getInlineManager<KeyLabel>("keylabel");

const math = mathManager.create("\\int_{a}^{b} f(x) dx");

const backlinkManager = inlinePlugin.getInlineManager<BackLink>("backlink");
const backlink = backlinkManager.create({ content: "Welcom", type: "plain" });

const todoitemManager = inlinePlugin.getInlineManager<TodoItem>("todoitem");
const todoDeprecateditem = todoitemManager.create({
  status: "deprecated",
  title: "This is an todo item",
});
const todoTodoitem = todoitemManager.create({
  status: "deprecated",
  title: "This is an todo item",
});
const todoDoingitem = todoitemManager.create({
  status: "deprecated",
  title: "This is an todo item",
});
const todoDoneitem = todoitemManager.create({
  status: "deprecated",
  title: "This is an todo item",
});

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
      children: [
        `ohno is a rich text editor designed from the bottom up, aiming to achieve minimal bugs and maximum scalability with the simplest code possible, while providing a friendly and customizable user editing experience.`,
      ],
    },
  },

  {
    name: "headings",
    init: { innerHTML: "What functions ohno provided", level: 2 },
  },
  { name: "paragraph", init: { children: ["For users:"] } },
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
  { name: "paragraph", init: { children: ["For developers:"] } },
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
    init: { children: ["Please follow each step below:"] },
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
    name: "headings",
    init: { innerHTML: "Abundant inline component support", level: 1 },
  },
  {
    name: "blockquote",
    init: {
      children: [createTextNode("Backlink: "), backlink],
    },
  },
  {
    name: "blockquote",
    init: {
      children: [createTextNode("Inline math: "), math],
    },
  },
  {
    name: "blockquote",
    init: {
      children: [createTextNode("TodoItem: "), todoTodoitem],
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
    init: {
      children: [
        "Type",
        keylabelManager.create({ altKey: true, code: "ArrowUp" }),
        "/",
        keylabelManager.create({ altKey: true, code: "ArrowDown" }),
        "to switch block.",
      ],
    },
  },
  {
    name: "paragraph",
    init: {
      children: [
        "Type",
        keylabelManager.create({ ctrlKey: true, code: "KeyZ" }),
        "to undo all your operations.",
      ],
    },
  },
  {
    name: "code",
    init: { code: "Type <b>ctrl+z</b> to undo all your operations." },
  },
];

data.forEach(({ name, init }) => {
  const block = page.createBlock(name, init as BlockInit);
  page.appendBlock(block);
});
keylabelManager;
page.appendBlock(
  new Table({
    shape: {
      row: 3,
      col: 3,
      innerHTMLs: [
        [
          outerHTML(
            keylabelManager.create({
              shiftKey: true,
              metaKey: true,
              code: "ArrowRight",
            })
          ),
          undefined,
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
          undefined,
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
  })
);

page.reverseRender((root) => {
  el.appendChild(root);
});

import error_page1 from "./errors/tablefirst";

error_page1.reverseRender((root) => {
  document.querySelector("#error")?.appendChild(root);
});
