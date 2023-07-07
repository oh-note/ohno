import { createElement } from "@ohno-editor/core/system/functional";

import { describe, test } from "vitest";
import { PlainSelection } from "@ohno-editor/core/system/selection";

describe("plainSelection", () => {
  test("", () => {
    const plain = new PlainSelection();
    const p = createElement("p", { children: ["1", "<b>456</b>"] });
    plain.getNextLocation([p, 0], p);
  });
});
