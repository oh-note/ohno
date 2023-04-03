import { loadConfigFromFile } from "vite";
import { createElement } from "./document";
import { getTagName } from "./element";
import { addMarkdownHint } from "./markdown";
import {
  offsetToRange,
  getTokenSize,
  rangeToOffset,
  getNextRange,
} from "./position";
import { describe, expect, test } from "vitest";

function tryThis(p: HTMLElement) {
  const size = getTokenSize(p);
  for (let i = 0; i < size; i++) {
    const range = offsetToRange(p, { start: i })!;
    const rerange = offsetToRange(p, { start: i - size - 1 })!;
    expect(range.startContainer).toBe(rerange.startContainer);
    expect(range.startOffset).toBe(rerange.startOffset);
  }
  let res = "";
  for (let i = 0; i < size; i++) {
    const offset = { start: i, end: i + 1 };
    const range = offsetToRange(p, offset)!;
    try {
      res += range.cloneContents().textContent;
    } catch {}
  }
  expect(res).toBe(p.textContent);
}

describe("offsetToRange", () => {
  test("2023-04-03-09-39", () => {
    const p = createElement("p");
    p.innerHTML = "L<b>d<i>i<code>c</code></i></b>";
    //  L <b> d <i> i <code> c </code> </i> </b>
    // 0 1   2 3   4 5      6 7       8    9    10
    // Lor<b>|**<i>*|a*</i>**</b>m
    addMarkdownHint(p);
    const coffset = rangeToOffset(p, offsetToRange(p, { start: 8, end: 9 })!);
    expect(coffset.start).toBe(8);
    expect(coffset.end).toBe(9);
  });

  test("2023-04-03-08-48", () => {
    const p = createElement("p");
    p.innerHTML = "Lor<b><i>a</i></b>m";
    // Lor<b>|**<i>*|a*</i>**</b>m
    addMarkdownHint(p);
    expect(
      offsetToRange(p, { start: 4, end: 5 })!.cloneContents().textContent
    ).toBe("*");

    expect(
      offsetToRange(p, { start: 6, end: 7 })!.cloneContents().textContent
    ).toBe("*");

    expect(
      offsetToRange(p, { start: 7, end: 8 })!.cloneContents().textContent
    ).toBe("**");

    p.innerHTML = "L<b>d<i>i<code>c</code></i></b>";
    //  L <b> d <i> i <code> c </code> </i> </b>
    // 0 1   2 3   4 5      6 7       8    9    10
    addMarkdownHint(p);
    expect(
      offsetToRange(p, { start: 7, end: 8 })!.cloneContents().textContent
    ).toBe("`");
    expect(
      offsetToRange(p, { start: 8, end: 9 })!.cloneContents().textContent
    ).toBe("*");
  });

  test("2023-04-03-00-28", () => {
    const p = createElement("p");
    p.innerHTML = "Lor<b>e<i>a</i>sd</b>m";
    //                        |   |
    //                        7   8
    addMarkdownHint(p);

    expect(
      offsetToRange(p, { start: 5, end: 6 })!.cloneContents().textContent
    ).toBe("*");
    // TODO happy-dom bugs, TypeError: clone.substringData is not a function
    expect(
      offsetToRange(p, { start: 7, end: 8 })!.cloneContents().textContent
    ).toBe("*");
  });

  test("2023-04-02-21-50", () => {
    const p = createElement("p");
    p.innerHTML = "Lor<b>e</b>m";

    expect(
      offsetToRange(p, { start: 4, end: 5 })!.cloneContents().textContent
    ).toBe("e");
  });

  test("reOrder", () => {
    const p = createElement("p");
    function tryThis() {
      const size = getTokenSize(p);
      for (let i = 0; i < size; i++) {
        const range = offsetToRange(p, { start: i })!;
        const rerange = offsetToRange(p, { start: i - size - 1 })!;
        expect(range.startContainer).toBe(rerange.startContainer);
        expect(range.startOffset).toBe(rerange.startOffset);
      }
      let res = "";
      for (let i = 0; i < size; i++) {
        const offset = { start: i, end: i + 1 };
        const range = offsetToRange(p, offset)!;
        try {
          res += range.cloneContents().textContent;
        } catch {}
      }
      expect(res).toBe(p.textContent);
    }
    p.innerHTML = "Lorem";
    tryThis();
    p.innerHTML = "Lor<b>e</b>m";
    tryThis();
    p.innerHTML = "Lor<b>e<i>a</i>sd</b>m";
    tryThis();
    p.innerHTML = "Lor<b>e<i>a</i>sd</b>m";
    addMarkdownHint(p);
    tryThis();
    p.innerHTML = "Lor<b>e<i>a</i>sd</b>m";
    tryThis();
    p.innerHTML = "<b>e<i>a</i>sd</b>m";
    tryThis();
    p.innerHTML = "L<b>d<i>i<code>c</code></i></b>";
    addMarkdownHint(p);
    tryThis();
    p.innerHTML =
      "Lorem ipsum <b>dolor <i>sit <code>amet</code></i></b>, consectetur adipiscing elit, sed do eiusmod <code>tempor <b><i><code>incididunt</code></i></b></code> ut labore et dolore magna aliqua.";
    addMarkdownHint(p);
    tryThis();
  });
  test("emptyChild", () => {});
  test("mathElement", () => {
    const p = createElement("p");
    p.innerHTML = "Loiajsdn<b>bold</b>";
    addMarkdownHint(p);
    // tryThis();
  });

  test("inOrder", () => {
    const p = createElement("p");
    p.innerHTML = "Lorem";
    expect(getTokenSize(p)).toBe(5);
    p.innerHTML = "Lor<b>e</b>m";
    expect(getTokenSize(p)).toBe(7);
    p.innerHTML = "Lor<b>e<i>a</i>sd</b>m";
    expect(getTokenSize(p)).toBe(12);
    addMarkdownHint(p);
    expect(getTokenSize(p)).toBe(12);
    let range: Range;
    range = offsetToRange(p, { start: 0 })!;
    expect(range.startContainer.textContent).toBe("Lor");
    expect(range.startOffset).toBe(0);
    range = offsetToRange(p, { start: 1 })!;
    expect(range.startOffset).toBe(1);
    range = offsetToRange(p, { start: 3 })!;
    expect(range.startOffset).toBe(3);
    expect(range.startContainer.textContent).toBe("Lor");
    range = offsetToRange(p, { start: 4 })!;
    expect(range.startContainer.textContent).toBe("e");
    expect(getTagName(range.startContainer)).toBe("#text");
    expect(range.startOffset).toBe(0);
    range = offsetToRange(p, { start: 5 })!;
    expect(range.startContainer.textContent).toBe("e");
    expect(getTagName(range.startContainer)).toBe("#text");
    expect(range.startOffset).toBe(1);
    range = offsetToRange(p, { start: 6 })!;
    expect(range.startContainer.textContent).toBe("a");
    expect(getTagName(range.startContainer)).toBe("#text");
    expect(range.startOffset).toBe(0);

    p.innerHTML = "<b>e</b>m<i>a</i>";
    expect(getTokenSize(p)).toBe(7);
    addMarkdownHint(p);

    range = offsetToRange(p, { start: 0 })!;
    expect(getTagName(range.startContainer)).toBe("p");
    expect(range.startOffset).toBe(0);

    range = offsetToRange(p, { start: 5 })!;
    expect(getTagName(range.startContainer.parentElement!)).toBe("i");
    expect(range.startOffset).toBe(0);
  });
});

describe("rangeToOffset", () => {
  test("default", () => {
    const p = createElement("p");
    function tryThis() {
      const size = getTokenSize(p);
      for (let i = 0; i < size; i++) {
        const offset = { start: i };
        const coffset = rangeToOffset(p, offsetToRange(p, offset)!);
        expect(offset.start).toBe(coffset.start);
      }
    }
    p.innerHTML = "Lor<b>e<i>a</i>sd</b>m";
    tryThis();
    p.innerHTML = "L<b>d<i>i<code>c</code></i></b>";
    //    L <b> ** d <i> * i <code> ` c ` </code> * </i> ** </b>";
    //   0 1   2  3 4   5 6 7      8 9 0 1       2 3    4  5
    addMarkdownHint(p);
    tryThis();
  });
});
