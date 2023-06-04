import { describe, expect, test } from "vitest";
import {
  createElement,
  getDefaultRange,
  innerHTMLToNodeList,
} from "@ohno-editor/core/helper/document";
import { getTagName, outerHTML } from "@ohno-editor/core/helper/element";
import { addMarkdownHint } from "@ohno-editor/core/helper/markdown";
import {
  createRange,
  setRange,
  tryGetBoundsRichNode,
} from "@ohno-editor/core/system/range";
import { setOffset } from "@ohno-editor/core/system/position";
import { defaultSelection } from "@ohno-editor/core/system/selection";

const { getNextLocation, getPrevLocation } = defaultSelection;

describe("range.ts", () => {
  test("getNextOffset/getPrefOffset", () => {
    const p = createElement("p");
    p.innerHTML = "<i></i>";

    addMarkdownHint(p);
    expect(p.textContent).toBe("**");
    let init = createRange(p, 0);
    setRange(init);
    let [container, offset] = getNextLocation(
      [init.startContainer, init.startOffset],
      p
    )!;
    expect(getTagName(container)).toBe("i");
    expect(offset).toBe(1);

    const init2 = createRange(p, 1);

    [container, offset] = getPrevLocation([
      init2.startContainer,
      init2.startOffset,
    ])!;
    expect(getTagName(container)).toBe("i");
    expect(offset).toBe(1);
  });

  test("tryGetBoundsRichNode", () => {
    const p = createElement("p");
    document.body.appendChild(p);
    p.innerHTML = "012<i>345</i>678";
    addMarkdownHint(p);
    let range, node;
    setOffset(p, { start: 3, end: 3 });
    range = getDefaultRange();
    node = tryGetBoundsRichNode(
      range.startContainer,
      range.startOffset,
      "right"
    );
    expect(node?.textContent).toBe("*345*");
    setOffset(p, { start: 4, end: 4 });
    range = getDefaultRange();
    node = tryGetBoundsRichNode(
      range.startContainer,
      range.startOffset,
      "left"
    );
    expect(node?.textContent).toBe("*345*");
    setOffset(p, { start: 7, end: 7 });
    range = getDefaultRange();
    node = tryGetBoundsRichNode(
      range.startContainer,
      range.startOffset,
      "right"
    );
    expect(node?.textContent).toBe("*345*");
    setOffset(p, { start: 8, end: 8 });
    range = getDefaultRange();
    node = tryGetBoundsRichNode(
      range.startContainer,
      range.startOffset,
      "left"
    );
    expect(node?.textContent).toBe("*345*");
  });
});
