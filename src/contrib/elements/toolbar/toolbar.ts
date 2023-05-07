import { createElement } from "@/helper/document";

export interface DropdownButton {
  tips: string;
}

export function createToolbarGroup() {}

export function createToolbar() {
  const toolbar = createElement("div", { className: "oh-is-toolbar" });
  return toolbar;
}
