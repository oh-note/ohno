import { createElement } from "@ohno-editor/core/system/functional";

export function createButton(content: string) {
  return createElement("button", { textContent: content });
}

export function createIconButton() {
  return createElement("button");
}

export function createInputButton() {}
