import { describe, expect, test } from "vitest";

import { createElement } from "../../helper/document";
import { Paragraph } from "..";
import { InsertText } from "./text";
import { Page } from "../../system/page";

function makeFakePage() {
  const page = new Page();
  const root = createElement("div");
  document.body.appendChild(root);
  page.render(root);
  page.blocks.first!.value.el.innerHTML = "Ohno World!";
  return page;
}

describe("test command", () => {
  test("insertText", () => {
    const page = makeFakePage();

    let block = page.findBlock("n")!;
    expect(block.el.textContent).toBe("Ohno World!");
    let command = new InsertText({
      block: block,
      offset: { start: 0 },
      page: page,
      value: "O",
    });

    page.emit(command);
    expect(block.el.textContent).toBe("OOhno World!");
    page.history.undo();
    expect(block.el.textContent).toBe("Ohno World!");

    command = new InsertText({
      block: block,
      offset: { start: 11 },
      page: page,
      value: "try long",
    });
    page.emit(command);

    block = new Paragraph();
    page.appendBlock(block);
    command = new InsertText({
      block: block,
      offset: { start: 0 },
      page: page,
      value: "try long",
    });
    page.emit(command);

    expect(block.el.textContent).toBe("try long");
    page.history.undo();
    expect(block.el.textContent).toBe("");
  });
});
