import { describe, expect, test } from "vitest";
import {
  createElement,
  getDefaultRange,
  innerHTMLToNodeList,
} from "@helper/document";
import { getTagName, outerHTML } from "@helper/element";
import { addMarkdownHint } from "@helper/markdown";
import {
  createRange,
  getNextLocation,
  getNextRange,
  getPrevLocation,
  setRange,
  tryGetBoundsRichNode,
} from "@system/range";
import { offsetToRange, setOffset } from "@system/position";

describe("range.ts", () => {
  test("getNextOffset/getPrefOffset", () => {
    const p = createElement("p");
    p.innerHTML = "<i></i>";

    addMarkdownHint(p);
    expect(p.textContent).toBe("**");
    let init = createRange(p, 0);
    setRange(init);
    let [container, offset] = getNextLocation(
      init.startContainer,
      init.startOffset
    )!;
    expect(getTagName(container)).toBe("i");
    expect(offset).toBe(1);

    const init2 = createRange(p, 1);

    [container, offset] = getPrevLocation(
      init2.startContainer,
      init2.startOffset
    )!;
    expect(getTagName(container)).toBe("i");
    expect(offset).toBe(1);
  });

  test("tryGetBoundsRichNode", () => {
    const p = createElement("p");
    document.body.appendChild(p);
    p.innerHTML = "012<i>345</i>678";
    addMarkdownHint(p);
    let range, node;
    setOffset(p, { start: 3 });
    range = getDefaultRange();
    node = tryGetBoundsRichNode(
      range.startContainer,
      range.startOffset,
      "right"
    );
    expect(node?.textContent).toBe("*345*");
    setOffset(p, { start: 4 });
    range = getDefaultRange();
    node = tryGetBoundsRichNode(
      range.startContainer,
      range.startOffset,
      "left"
    );
    expect(node?.textContent).toBe("*345*");
    setOffset(p, { start: 7 });
    range = getDefaultRange();
    node = tryGetBoundsRichNode(
      range.startContainer,
      range.startOffset,
      "right"
    );
    expect(node?.textContent).toBe("*345*");
    setOffset(p, { start: 8 });
    range = getDefaultRange();
    node = tryGetBoundsRichNode(
      range.startContainer,
      range.startOffset,
      "left"
    );
    expect(node?.textContent).toBe("*345*");
  });
});
