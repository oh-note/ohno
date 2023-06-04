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
import {
  PlainSelection,
  defaultSelection,
} from "@ohno-editor/core/system/selection";

describe("plainSelection", () => {
  test("", () => {
    const plain = new PlainSelection();
    const p = createElement("p", { children: ["1", "<b>456</b>"] });
    plain.getNextLocation([p, 0], p);
  });
});
