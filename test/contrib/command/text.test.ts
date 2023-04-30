import { describe, expect, test } from "vitest";

import { createElement, getDefaultRange } from "@/helper/document";

import { TextDeleteSelection } from "@/contrib/commands/text";
import { Page } from "@/system/page";
import { addMarkdownHint } from "@/helper/markdown";
import { offsetToRange, rangeToOffset } from "@/system/position";
import { setRange } from "@/system/range";
import { TextInsert } from "@/contrib/commands";

function makeFakePage() {
  const page = new Page();
  const root = createElement("div");
  document.body.appendChild(root);
  page.render(root);
  page.blockChain.first!.value.root.innerHTML = "012";

  return page;
}

function makeFakeHTMLPage() {
  const page = new Page();
  const root = createElement("div");
  document.body.appendChild(root);
  page.render(root);
  page.blockChain.first!.value.root.innerHTML = "012<b>456</b>89";
  addMarkdownHint(page.blockChain.first!.value.root);
  return page;
}

describe("test command", () => {
  test("TextInsert", () => {
    const page = makeFakePage();

    let block = page.findBlock("n")!;
    expect(block.root.textContent).toBe("012");
    block.setOffset({ start: -1 });

    let command = new TextInsert({
      block: block,
      insertOffset: { start: 0 },
      page: page,
      innerHTML: "O",
    });
    page.executeCommand(command);
    expect(block.root.textContent).toBe("O012");
    page.history.undo();
    expect(block.root.textContent).toBe("012");

    command = new TextInsert({
      block: block,
      insertOffset: { start: 0 },
      page: page,
      innerHTML: "<i>content</i>",
    });
    page.executeCommand(command);

    expect(block.root.textContent).toBe("*content*012");
    page.history.undo();
    expect(block.root.textContent).toBe("012");
  });

  test("delete selection", () => {
    const page = makeFakeHTMLPage();
    let block = page.findBlock("n")!;
    expect(block.root.textContent).toBe("012**456**89");
    // "012<b>4[56</b>8]9" -> "012[<b>4[56</b>]8]9" -> "012[<b>4|</b>8]9";
    const range = offsetToRange(block.root, { start: 5, end: 9 })!;
    setRange(range);
    let del = new TextDeleteSelection({
      page: page,
      block: block,
      delOffset: { start: 5, end: 9 },
    });

    page.executeCommand(del);
    expect(block.root.textContent).toBe("012**4**9");
    // "012<b>4|</b>9";
    expect(rangeToOffset(block.root, getDefaultRange()).start).toBe(5);
    // "012[<b>4|</b>8]9" -> "012 9" -> "012[<b>4[56</b>]8]9"
    page.history.undo();
    expect(block.root.textContent).toBe("012**456**89");
  });
});
