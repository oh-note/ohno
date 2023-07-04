import { OH_INLINEBLOCK } from "./consts";
import { removeMarkdownHint } from "./markdown";

export type HTMLElementTagName = keyof HTMLElementTagNameMap;
export type ElementTagName = keyof HTMLElementTagNameMap | "#text";
export type HTMLElementType = HTMLElementTagNameMap[HTMLElementTagName];
export type EventAttribute = {
  [key in keyof HTMLElementEventMap]?: (e: HTMLElementEventMap[key]) => void;
};

export type ChildrenData = string | Node | (string | Node)[];

export function createTextNode(text?: string): Text {
  text = text || "";
  return document.createTextNode(text);
}

export const UNIQUE_SPACE = createTextNode(" ");

export function splitUniqueSpace() {
  UNIQUE_SPACE.splitText(1);
  UNIQUE_SPACE.remove();
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

export function innerHTMLToNodeList(
  innerHTML: string,
  plain?: boolean
): Node[] {
  const wrap = createElement("span");
  wrap.innerHTML = innerHTML;
  // removeMarkdownHint(wrap);
  if (plain) {
    wrap.textContent = wrap.textContent || "";
  }
  return Array.from(wrap.childNodes);
}

export function createInline(
  name: string,
  children?: (Node | string)[],
  dataset?: {
    [key: string]: any;
    name?: never;
  }
): HTMLLabelElement {
  if (dataset && dataset["name"]) {
    throw new Error("dataset can not assign value of key `name` ");
  }
  const res = createElement("label", {
    children,
    className: `${OH_INLINEBLOCK} ${name}`,
    style: { display: "inline-block" },
    dataset: { name },
  });
  dataset = dataset || {};
  for (const key in dataset) {
    res.dataset[key] = dataset[key];
  }

  return res;
}

export function dechildren(children: ChildrenData): (Node | string)[] {
  if (Array.isArray(children)) {
    return children;
  } else {
    return [children];
  }
}

export function createElement<K extends HTMLElementTagName>(
  tagName: K,
  props?: {
    id?: string;
    className?: string;
    textContent?: string;
    innerHTML?: string;
    attributes?: { [key: string]: string };
    dataset?: { [key: string]: any };
    eventHandler?: EventAttribute;
    children?: ChildrenData;
    style?: Style;
  }
): HTMLElementTagNameMap[K];
export function createElement(
  tagName: string,
  props?: {
    id?: string;
    className?: string;
    textContent?: string;
    innerHTML?: string;
    attributes?: { [key: string]: string };
    dataset?: { [key: string]: any };
    eventHandler?: EventAttribute;
    children?: ChildrenData;
    style?: Style;
  }
): HTMLElement {
  const {
    id,
    className,
    textContent,
    attributes,
    eventHandler,
    children,
    style,
    innerHTML,
    dataset,
  } = props || {};

  const el = document.createElement(tagName);
  if (id) {
    el.id = id;
  }
  if (className) {
    el.className = className;
  }
  if (textContent) {
    el.textContent = textContent;
  }
  if (innerHTML) {
    el.innerHTML = innerHTML;
  }
  if (attributes) {
    for (const key in attributes) {
      const value = attributes[key];
      if (value !== undefined) {
        el.setAttribute(key, value);
      }
    }
  }

  if (dataset) {
    for (const key in dataset) {
      el.dataset[key] = dataset[key];
    }
  }
  if (eventHandler) {
    for (const key in eventHandler) {
      const value = eventHandler[key as keyof HTMLElementEventMap];
      el.addEventListener(key, value as EventListenerOrEventListenerObject);
    }
  }
  if (children) {
    dechildren(children).forEach((child) => {
      if (child instanceof Node) {
        el.appendChild(child);
      } else {
        el.append(...innerHTMLToNodeList(child));
      }
    });
  }
  if (style) {
    Object.assign(el.style, style);
  }

  return el;
}

// export function createComponents<K extends HTMLElementTagName>(
//   payload: ComponentPayload<K>
// ) {}

export function getDefaultRange(): Range {
  const sel = document.getSelection();
  if (sel && sel.rangeCount > 0) {
    return sel.getRangeAt(0);
  }

  throw new NoRangeError();
}

export function tryGetDefaultRange(): Range | undefined {
  const sel = document.getSelection();
  if (sel && sel.rangeCount > 0) {
    return sel.getRangeAt(0);
  }

  return undefined;
}

// Check if the element is already visible
export function isElementInViewport(node: Node) {
  const element = node instanceof HTMLElement ? node : node.parentElement!;
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export function scrollIntoViewIfNeeded(
  node: Node,
  arg?: boolean | ScrollIntoViewOptions
) {
  const el = node instanceof HTMLElement ? node : node.parentElement!;
  if (!isElementInViewport(el)) {
    el.scrollIntoView(arg);
  }
}
