import { createElement } from "@ohno-editor/core/helper/document";

export interface DropdownButton {
  tips: string;
}

export function createToolbarGroup() {}

export function createToolbar() {
  const toolbar = createElement("div", {
    className: "oh-is-toolbar",
    children: [createElement("button", { textContent: "B" })],
  });
  return toolbar;
}
