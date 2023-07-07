import { describe, expect, test } from "vitest";
import {
  createElement,
  getDefaultRange,
  getTagName,
  outerHTML,
  addMarkdownHint,
  createRange,
  setRange,
  tryGetBoundsRichNode,
} from "@ohno-editor/core/system/functional";
import { defaultSelection } from "@ohno-editor/core/system/selection";

describe("range.ts", () => {
  test("getNextOffset/getPrefOffset", () => {
    const p = createElement("p");
    p.innerHTML = "<i></i>";

    addMarkdownHint(p);
    expect(p.textContent).toBe("**");
    let init = createRange(p, 0);
    setRange(init);
    let [container, offset] = defaultSelection.getNextLocation(
      [init.startContainer, init.startOffset],
      p
    )!;
    expect(getTagName(container)).toBe("i");
    expect(offset).toBe(1);

    const init2 = createRange(p, 1);

    [container, offset] = defaultSelection.getPrevLocation([
      init2.startContainer,
      init2.startOffset,
    ])!;
    expect(getTagName(container)).toBe("i");
    expect(offset).toBe(1);
  });
});
