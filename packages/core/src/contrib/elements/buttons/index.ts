import { createElement } from "@ohno-editor/core/helper/document";

export function createButton(content: string) {
  return createElement("button", { textContent: content });
}

export function createIconButton() {
  return createElement("button");
}

export function createInputButton() {}
