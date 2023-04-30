import {
  createElement,
  createTextNode,
  innerHTMLToNodeList,
  makeInlineBlock,
} from "@/helper/document";
import { ValidNode, getTagName, outerHTML } from "@/helper/element";
import { addMarkdownHint } from "@/helper/markdown";
import {
  offsetToRange,
  getTokenSize,
  rangeToOffset,
  FIRST_POSITION,
  LAST_POSITION,
  offsetAfter,
  locationToBias,
  biasToLocation,
} from "@/system/position";
import { describe, expect, test } from "vitest";
import katex from "katex";
import {
  createRange,
  getNextLocation,
  getPrevLocation,
  setRange,
} from "@/system/range";

function tryThis(p: ValidNode) {
  const size = getTokenSize(p);
  for (let i = 0; i < size; i++) {
    const range = offsetToRange(p, { start: i })!;
    const rerange = offsetToRange(p, { start: i - size - 1 })!;
    expect(range.startContainer).toStrictEqual(rerange.startContainer);
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

describe("offsetAfter", () => {
  test("|text", () => {
    const p = createElement("p", { textContent: "0123" });
    let [container, offset] = offsetAfter(p, 0, 3);
    expect(container.textContent).toBe("0123");
    expect(offset).toBe(3);
  });

  test("|<b>1234</b>", () => {
    const p = createElement("p");
    p.innerHTML = "<b>1234</b>";
    let container, offset;
    [container, offset] = offsetAfter(p, 0, 3);
    expect(locationToBias(p, container, offset)).toBe(3);
    [container, offset] = offsetAfter(p, 0, 1);
    expect(locationToBias(p, container, offset)).toBe(1);
    addMarkdownHint(p);
    [container, offset] = offsetAfter(p, 0, 1);
    expect(locationToBias(p, container, offset)).toBe(1);
  });

  test("|<b><i></i></b>1234", () => {
    const p = createElement("p");
    p.innerHTML = "<b><i></i></b>1234";
    const n = getTokenSize(p);

    const [container, offset] = offsetAfter(p, 0, 5);
    expect(locationToBias(p, container, offset)).toBe(5);
    for (let i = 0; i < n; i++) {
      const [container, offset] = offsetAfter(p, 0, i);
      expect(locationToBias(p, container, offset)).toBe(i);
    }
  });

  test("0123<b>456</b>78<i>90</i>123", () => {
    const p = createElement("p");
    p.innerHTML = "0123<b>456</b>78<i>90</i>123";
    addMarkdownHint(p);
    const n = getTokenSize(p);
    const [container, offset] = offsetAfter(p, 0, 5);
    expect(locationToBias(p, container, offset)).toBe(5);
    for (let i = 0; i < n; i++) {
      const [container, offset] = offsetAfter(p, 0, i);
      expect(locationToBias(p, container, offset)).toBe(i);
    }
  });
});

describe("position", () => {
  test("getPrevOffset/getNextOffset", () => {
    const p = createElement("p");
    p.innerHTML = "L<b>d<i>i<code>c</code></i></b>";
    addMarkdownHint(p);
    let init = offsetToRange(p, { start: 8, end: 9 })!;
    expect(getPrevLocation(init.endContainer, init.endOffset)).toStrictEqual([
      init.startContainer,
      init.startOffset,
    ]);

    setRange(init);
    const size = getTokenSize(p);
    for (let i = 0; i < size; i++) {
      const offset = { start: i, end: i + 1 };
      init = offsetToRange(p, offset)!;
      expect(
        getNextLocation(init.startContainer, init.startOffset)
      ).toStrictEqual([init.endContainer, init.endOffset]);
      expect(getPrevLocation(init.endContainer, init.endOffset)).toStrictEqual([
        init.startContainer,
        init.startOffset,
      ]);
    }
  });

  test("offsetToRange/text node", () => {
    const text = createTextNode("012345");
    expect(offsetToRange(text, FIRST_POSITION)?.startContainer).toStrictEqual(
      text
    );
    expect(offsetToRange(text, FIRST_POSITION)?.startOffset).toBe(0);
    expect(offsetToRange(text, LAST_POSITION)?.endContainer).toStrictEqual(
      text
    );
    expect(offsetToRange(text, LAST_POSITION)?.endOffset).toBe(text.length);
    tryThis(text);
  });

  test("rangeToOffset/2023-04-03-09-39", () => {
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

  test("offsetToRange/2023-04-03-08-48", () => {
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

  test("rangeToOffset/**|**/2023.04.16", () => {
    const p = createElement("p");
    p.innerHTML = "<b></b>";
    addMarkdownHint(p);
    const res = rangeToOffset(p, createRange(p.firstChild!, 1));
    expect(res.start).toBe(1);
  });

  test("offsetToRange/2023-04-03-00-28", () => {
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

  test("offsetToRange/2023-04-02-21-50", () => {
    const p = createElement("p");
    p.innerHTML = "Lor<b>e</b>m";

    expect(
      offsetToRange(p, { start: 4, end: 5 })!.cloneContents().textContent
    ).toBe("e");
  });

  test("offsetToRange", () => {
    const p = createElement("p");

    p.innerHTML = "Lorem";
    tryThis(p);
    p.innerHTML = "Lor<b>e<i>a</i>sd</b>m";
    tryThis(p);
    p.innerHTML = "Lor<b>e<i>a</i>sd</b>m";
    addMarkdownHint(p);
    tryThis(p);
    p.innerHTML = "<b>e<i>a</i>sd</b>m";
    tryThis(p);
    p.innerHTML = "<b><i>t</i><i></i></b>";
    tryThis(p);
    p.innerHTML = "L<b>d<i>i<code>c</code></i></b>";
    addMarkdownHint(p);
    tryThis(p);
    p.innerHTML =
      "Lorem ipsum <b>dolor <i>sit <code>amet</code></i></b>, consectetur adipiscing elit, sed do eiusmod <code>tempor <b><i><code>incididunt</code></i></b></code> ut labore et dolore magna aliqua.";
    addMarkdownHint(p);
    tryThis(p);
  });

  test("rangeToOffset/<p><b>?|</b></p>", () => {
    const p = createElement("p", { children: [createElement("b")] });
    // expect(outerHTML(p)).toBe("<p><b></b></p>");
    const range = document.createRange();

    p.innerHTML = "<b>text</b>";
    // <b>text|</b>
    range.setStart(p.firstChild!, 1);
    expect(rangeToOffset(p, range).start).toBe(5);

    p.innerHTML = "<b><i></i></b>";
    // <b><i></i>|</b>
    range.setStart(p.firstChild!, 1);
    expect(rangeToOffset(p, range).start).toBe(3);
    // <b>|<i></i></b>
    range.setStart(p.firstChild!, 0);
    expect(rangeToOffset(p, range).start).toBe(1);
    p.innerHTML = "<b>123<i></i></b>";
    range.setStart(p.firstChild!, 1);
    expect(rangeToOffset(p, range).start).toBe(4);

    p.innerHTML = "<b></b>";
    range.setStart(p, 1);
    expect(rangeToOffset(p, range).start).toBe(2);
  });
  test("mathElement", () => {
    const p = createElement("p");
    addMarkdownHint(p);
    const value = "f(x)=ax+b";

    p.appendChild(
      makeInlineBlock({
        serailizer: "katex",
        attributes: { value: value },
        el: innerHTMLToNodeList(katex.renderToString(value)),
      })
    );
    expect(getTokenSize(p)).toBe(2);
    // |<label>...</label>
    expect(offsetToRange(p, { start: 0 })?.startOffset).toBe(0);
    // [<label>...</label>]
    expect(getTagName(offsetToRange(p, { start: 1 })?.startContainer!)).toBe(
      "label"
    );
    // <label>...</label>|
    expect(offsetToRange(p, { start: 2 })?.startOffset).toBe(0);
    expect(getTagName(offsetToRange(p, { start: 2 })?.startContainer!)).toBe(
      "#text"
    );
    expect(offsetToRange(p, { start: 2 })?.startContainer.textContent).toBe("");
    expect(rangeToOffset(p, offsetToRange(p, { start: 2 })!).start).toBe(2);
    expect(offsetToRange(p, { start: 3 })).toBe(null);
  });

  test("2023-04-03-18-15", () => {
    // 边界条件
    const p = createElement("p");
    p.innerHTML = "<b>t</b>";
    // <b>t</b>| -> container = p, offset = 1, container.childList[offset] === null
    expect(rangeToOffset(p, offsetToRange(p, { start: 3 })!).start).toBe(3);
    p.innerHTML = "<b><i>t</i><i></i></b>";

    expect(getTagName(offsetToRange(p, { start: 4 })?.startContainer!)).toBe(
      "b"
    );
    expect(rangeToOffset(p, offsetToRange(p, { start: 4 })!).start).toBe(4);
    expect(rangeToOffset(p, offsetToRange(p, { start: 6 })!).start).toBe(6);
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
    expect(getTagName(range.startContainer)).toBe("#text");
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

describe("getTokenSize", () => {
  test("with_root", () => {
    const p = createElement("p");
    p.innerHTML = "<b><i></i></b>";
    addMarkdownHint(p);
    expect(getTokenSize(p.firstChild as ValidNode, true)).toBe(4);
  });
});

describe("locationToBias", () => {
  test("raw text", () => {
    const text = createTextNode("0123456789");
    locationToBias(text, text, 3);
  });
});
