import { describe, expect, test } from "vitest";

// import { TextDeleteSelection } from "@ohno/core/contrib/commands/text";
import { Page } from "@ohno/core/system/types";
import {
  getIntervalFromRange,
  getRangeFromInterval,
  createElement,
  getDefaultRange,
  setRange,
  addMarkdownHint,
} from "@ohno/core/system/functional";
import { RichTextDelete, TextInsert } from "@ohno/core/contrib/commands";

function makeFakePage() {
  const page = new Page();
  const root = createElement("div");
  document.body.appendChild(root);
  page.render(root);
  page.chain.first!.value.root.innerHTML = "012";

  return page;
}

function makeFakeHTMLPage() {
  const page = new Page();
  const root = createElement("div");
  document.body.appendChild(root);
  page.render(root);
  page.chain.first!.value.root.innerHTML = "012<b>456</b>89";
  addMarkdownHint(page.chain.first!.value.root);
  return page;
}

describe("test command", () => {
  test("TextInsert", () => {
    const page = makeFakePage();

    const block = page.query("n")!;
    expect(block.root.textContent).toBe("012");
    page.setLocation(block.getLocation(-1, 0)!);

    let command = new TextInsert({
      block: block,
      index: 0,
      start: 0,
      page: page,
      innerHTML: "O",
    });
    page.executeCommand(command);
    expect(block.root.textContent).toBe("O012");
    page.history.undo();
    expect(block.root.textContent).toBe("012");

    command = new TextInsert({
      block: block,
      index: 0,
      start: 0,
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
    const block = page.query("n")!;
    expect(block.root.textContent).toBe("012**456**89");
    // "012<b>4[56</b>8]9" -> "012[<b>4[56</b>]8]9" -> "012[<b>4|</b>8]9";
    const range = getIntervalFromRange(block.root, { start: 5, end: 9 })!;
    setRange(range);
    let del = new RichTextDelete({
      page: page,
      block: block,
      start: 5,
      token_number: 4,
      index: 0,
    });

    page.executeCommand(del);
    expect(block.root.textContent).toBe("012**4**9");
    // "012<b>4|</b>9";
    expect(getRangeFromInterval(block.root, getDefaultRange()).start).toBe(5);
    // "012[<b>4|</b>8]9" -> "012 9" -> "012[<b>4[56</b>]8]9"
    page.history.undo();
    expect(block.root.textContent).toBe("012**456**89");
  });
});
