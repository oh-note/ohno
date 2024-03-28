import { createElement } from "@ohno/core/system/functional";

import { describe, test } from "vitest";
import { PlainSelection } from "@ohno/core/system/selection";

describe("plainSelection", () => {
  test("", () => {
    const plain = new PlainSelection();
    const p = createElement("p", { children: ["1", "<b>456</b>"] });
    plain.getNextLocation([p, 0], p);
  });
});
