import { OH_INLINEBLOCK } from "./consts";
import { validChildNodes } from "./element";

export type HTMLElementTagName = keyof HTMLElementTagNameMap;
export type ElementTagName = keyof HTMLElementTagNameMap | "#text";
export type HTMLElementType = HTMLElementTagNameMap[HTMLElementTagName];
export type EventAttribute = {
  [key in keyof HTMLElementEventMap]?: (e: HTMLElementEventMap[key]) => void;
};

export function createTextNode(text?: string): Text {
  text = text || "";
  return document.createTextNode(text);
}

export function createFlagNode(): HTMLElement {
  return createElement("span");
}
export interface InlineBlock {
  serailizer: string;
  el: Node[];
  attributes?: { [key: string]: string };
}

export function makeInlineBlock(inline: InlineBlock) {
  const res = createElement("label", {
    children: inline.el,
    className: OH_INLINEBLOCK,
    attributes: Object.assign({}, inline.attributes, {
      serializer: inline.serailizer,
    }),
    style: { display: "inline-block" },
  });
  return res;
}

export function innerHTMLToNodeList(innerHTML: string): Node[] {
  const wrap = createElement("span");
  wrap.innerHTML = innerHTML;
  return Array.from(wrap.childNodes);
}

export function createInlineBlock(
  el?: HTMLElement,
  innerHTML?: string,
  value?: string
): HTMLElement {
  const res = createElement("label", {
    children: el ? [el] : undefined,
    className: OH_INLINEBLOCK,
    attributes: { value: value },
    style: { display: "inline-block" },
  });
  if (innerHTML) {
    res.innerHTML = innerHTML;
  }
  return res;
}

export function createElement<K extends HTMLElementTagName>(
  tagName: K,
  props?: {
    className?: string;
    textContent?: string;
    attributes?: { [key: string]: any };
    eventHandler?: EventAttribute;
    children?: Node[];
    style?: {
      [key in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[keyof CSSStyleDeclaration];
    };
  }
): HTMLElementTagNameMap[K] {
  const { className, textContent, attributes, eventHandler, children, style } =
    props || {};

  const el = document.createElement(tagName);
  if (className) {
    el.className = className;
  }
  if (textContent) {
    el.textContent = textContent;
  }
  if (attributes) {
    for (let key in attributes) {
      const value = attributes[key];
      if (value !== undefined) {
        el.setAttribute(key, value);
      }
    }
  }

  if (eventHandler) {
    for (let key in eventHandler) {
      const value = eventHandler[key as keyof HTMLElementEventMap];
      el.addEventListener(key, value as EventListenerOrEventListenerObject);
    }
  }
  if (children) {
    children.forEach((child) => {
      el.appendChild(child);
    });
  }
  if (style) {
    Object.assign(el.style, style);
  }

  return el;
}

export function getDefaultRange(raise: boolean = true): Range {
  const sel = document.getSelection();
  if (sel && sel.rangeCount > 0) {
    return sel.getRangeAt(0);
  }
  if (raise) {
    throw new Error("Besure to have range when call this method");
  }
  return null;
}
