import "./style.css";
import { Block } from "./system/block";
import { Page } from "./system/page";
import {
  createElement,
  createInlineBlock,
  innerHTMLToNodeList,
  makeInlineBlock,
} from "./helper/document";
import katex from "katex";
import { Paragraph } from "./blocks";

const page = new Page();
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

const innerHTML =
  "Lorem ipsum <b>dolor <i>sit <code>amet</code></i></b>, consectetur adipiscing elit, sed do eiusmod <code>tempor <b><i><code>incididunt</code></i></b></code> ut labore et dolore magna aliqua.";

page.appendBlock(new Paragraph(undefined, undefined, innerHTML, [wrap]));

document.body.appendChild(
  createElement("button", {
    textContent: "append",
    eventHandler: {
      click: () => {
        page.appendBlock(
          new Block(createElement("p", { textContent: "Hello" }))
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
          new Block(createElement("p", { textContent: "Hello Insert Before" }))
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
          new Block(createElement("p", { textContent: "Hello Insert After" }))
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
          new Block(createElement("p", { textContent: "Hello replace" }))
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
