import {
  createElement,
  createTextNode,
  innerHTMLToNodeList,
  makeInlineBlock,
} from "@ohno-editor/core/helper";

import {
  ValidNode,
  getTagName,
  outerHTML,
} from "@ohno-editor/core/helper/element";
import { addMarkdownHint } from "@ohno-editor/core/helper/markdown";
import {
  intervalToRange,
  getTokenSize,
  rangeToInterval,
  offsetAfter,
  locationToBias,
  biasToLocation,
} from "@ohno-editor/core/system/position";
import { describe, expect, test } from "vitest";
import katex from "katex";
import { createRange, setRange } from "@ohno-editor/core/system/range";
import { defaultSelection } from "@ohno-editor/core/system/selection";

function tryThis(p: ValidNode) {
  let global: { [key: string]: any } = {};
  try {
    const size = getTokenSize(p);
    for (let i = 0; i < size; i++) {
      global = { i };
      const loc = biasToLocation(p, i)!;
      global["loc"] = loc;
      global["reloc"] = loc;
      const reloc = biasToLocation(p, i - size - 1)!;
      expect(loc).toStrictEqual(reloc);
    }
    let res = "";
    for (let i = 0; i < size; i++) {
      const offset = { start: i, end: i + 1 };
      const range = intervalToRange(p, offset)!;
      try {
        res += range.cloneContents().textContent;
      } catch (error) {}
    }
    expect(res).toBe(p.textContent);
  } catch (error) {
    console.log(`${p.textContent}, `);
    console.log(global);
    throw error;
  }
}

describe("offsetAfter", () => {
  test("|text", () => {
    const p = createElement("p", { textContent: "0123" });
    const [container, offset] = offsetAfter(p, 0, 3);
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
    let init = intervalToRange(p, { start: 8, end: 9 })!;
    expect(
      defaultSelection.getPrevLocation([init.endContainer, init.endOffset])
    ).toStrictEqual([init.startContainer, init.startOffset]);

    setRange(init);
    const size = getTokenSize(p);
    for (let i = 0; i < size; i++) {
      const offset = { start: i, end: i + 1 };
      init = intervalToRange(p, offset)!;
      expect(
        defaultSelection.getNextLocation(
          [init.startContainer, init.startOffset],
          p
        )
      ).toStrictEqual([init.endContainer, init.endOffset]);
      expect(
        defaultSelection.getPrevLocation([init.endContainer, init.endOffset])
      ).toStrictEqual([init.startContainer, init.startOffset]);
    }
  });

  test("offsetToRange/text node", () => {
    const text = createTextNode("012345");
    tryThis(text);
  });

  test("rangeToOffset/2023-04-03-09-39", () => {
    const p = createElement("p");
    p.innerHTML = "L<b>d<i>i<code>c</code></i></b>";
    //  L <b> d <i> i <code> c </code> </i> </b>
    // 0 1   2 3   4 5      6 7       8    9    10
    // Lor<b>|**<i>*|a*</i>**</b>m
    addMarkdownHint(p);
    const coffset = rangeToInterval(
      p,
      intervalToRange(p, { start: 8, end: 9 })!
    );
    expect(coffset.start).toBe(8);
    expect(coffset.end).toBe(9);
  });

  test("offsetToRange/2023-04-03-08-48", () => {
    const p = createElement("p");
    p.innerHTML = "Lor<b><i>a</i></b>m";
    // Lor<b>|**<i>*|a*</i>**</b>m
    addMarkdownHint(p);
    expect(
      intervalToRange(p, { start: 4, end: 5 })!.cloneContents().textContent
    ).toBe("*");

    expect(
      intervalToRange(p, { start: 6, end: 7 })!.cloneContents().textContent
    ).toBe("*");

    expect(
      intervalToRange(p, { start: 7, end: 8 })!.cloneContents().textContent
    ).toBe("**");

    p.innerHTML = "L<b>d<i>i<code>c</code></i></b>";
    //  L <b> d <i> i <code> c </code> </i> </b>
    // 0 1   2 3   4 5      6 7       8    9    10
    addMarkdownHint(p);
    expect(
      intervalToRange(p, { start: 7, end: 8 })!.cloneContents().textContent
    ).toBe("`");
    expect(
      intervalToRange(p, { start: 8, end: 9 })!.cloneContents().textContent
    ).toBe("*");
  });

  test("rangeToOffset/**|**/2023.04.16", () => {
    const p = createElement("p");
    p.innerHTML = "<b></b>";
    addMarkdownHint(p);
    const res = rangeToInterval(p, createRange(p.firstChild!, 1));
    expect(res.start).toBe(1);
  });

  test("offsetToRange/2023-04-03-00-28", () => {
    const p = createElement("p");
    p.innerHTML = "Lor<b>e<i>a</i>sd</b>m";
    //                        |   |
    //                        7   8
    addMarkdownHint(p);

    expect(
      intervalToRange(p, { start: 5, end: 6 })!.cloneContents().textContent
    ).toBe("*");
    // TODO happy-dom bugs, TypeError: clone.substringData is not a function
    expect(
      intervalToRange(p, { start: 7, end: 8 })!.cloneContents().textContent
    ).toBe("*");
  });

  test("offsetToRange/2023-04-02-21-50", () => {
    const p = createElement("p");
    p.innerHTML = "Lor<b>e</b>m";

    expect(
      intervalToRange(p, { start: 4, end: 5 })!.cloneContents().textContent
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
    expect(rangeToInterval(p, range).start).toBe(5);

    p.innerHTML = "<b><i></i></b>";
    // <b><i></i>|</b>
    range.setStart(p.firstChild!, 1);
    expect(rangeToInterval(p, range).start).toBe(3);
    // <b>|<i></i></b>
    range.setStart(p.firstChild!, 0);
    expect(rangeToInterval(p, range).start).toBe(1);
    p.innerHTML = "<b>123<i></i></b>";
    range.setStart(p.firstChild!, 1);
    expect(rangeToInterval(p, range).start).toBe(4);

    p.innerHTML = "<b></b>";
    range.setStart(p, 1);
    expect(rangeToInterval(p, range).start).toBe(2);
  });
  test("mathElement", () => {
    const p = createElement("p");
    addMarkdownHint(p);
    const value = "f(x)=ax+b";
    const label = makeInlineBlock({
      serailizer: "katex",
      attributes: { value: value },
      el: innerHTMLToNodeList(katex.renderToString(value)),
    });
    p.appendChild(label);
    expect(getTokenSize(p)).toBe(2);
    // |<label>...</label>
    expect(biasToLocation(p, 0)![1]).toBe(0);
    // [<label>...</label>]
    expect(biasToLocation(p, 1)).toStrictEqual([label, 0]);
    // <label>...</label>|
    expect(biasToLocation(p, 2)).toStrictEqual([p, 1]);
    expect(biasToLocation(p, 3)).toBe(null);
  });

  test("2023-04-03-18-15", () => {
    // 边界条件
    const p = createElement("p");
    p.innerHTML = "<b>t</b>";
    // <b>t</b>| -> container = p, offset = 1, container.childList[offset] === null
    tryThis(p);
    p.innerHTML = "<b><i>t</i><i></i></b>";
    expect(getTagName(biasToLocation(p, 4)![0])).toBe("b");
    tryThis(p);
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

    tryThis(p);

    p.innerHTML = "<b>e</b>m<i>a</i>";
    expect(getTokenSize(p)).toBe(7);
    tryThis(p);
    addMarkdownHint(p);
  });
});

describe("rangeToOffset", () => {
  test("default", () => {
    const p = createElement("p");
    p.innerHTML = "Lor<b>e<i>a</i>sd</b>m";
    tryThis(p);
    p.innerHTML = "L<b>d<i>i<code>c</code></i></b>";
    tryThis(p);
    addMarkdownHint(p);
    tryThis(p);
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
