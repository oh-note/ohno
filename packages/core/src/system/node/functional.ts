import { isHintHTMLElement } from "../status";
import {
  ChildrenData,
  ElementFilter,
  ElementTagName,
  EventAttribute,
  HTMLElementTagName,
  ValidNode,
} from "../types";

/** Create Methods */
export function createTextNode(text?: string): Text {
  text = text || "";
  return document.createTextNode(text);
}

export function createFlagNode(): HTMLElement {
  return createElement("span");
}

function dechildren(children: ChildrenData): (Node | string)[] {
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

const UNIQUE_SPACE = createTextNode(" ");

export function getUniqueSpace() {
  return UNIQUE_SPACE;
}

export function splitUniqueSpace() {
  UNIQUE_SPACE.splitText(1);
  UNIQUE_SPACE.remove();
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

export function scrollIntoViewIfNeeded(
  node: Node,
  arg?: boolean | ScrollIntoViewOptions
) {
  const el = node instanceof HTMLElement ? node : node.parentElement!;
  if (!isElementInViewport(el)) {
    el.scrollIntoView(arg);
  }
}

export function getTagName(el: Node): ElementTagName {
  if (!el) {
    throw EvalError("el is none");
  }
  return el.nodeName.toLowerCase() as ElementTagName;
}

/**
 * Token 数大于 1 的结点，包括：
 *  - 任意有效 HTMLElement 结点（即使内容为空，但空 HTML Token=2）
 *  - 任意长度大于 0 的文本结点
 *  -
 * @param el
 * @returns
 */
export function isEntityNode(el: Node) {
  if (!isValidNode(el)) {
    return false;
  }
  if (el instanceof Text) {
    return el.textContent!.length > 0;
  }
  return true;
}

export function firstValidChild(
  el: Node,
  filter: ElementFilter = isValidNode
): ValidNode | null {
  let cur = el.firstChild as Node;
  while (cur) {
    if (filter(cur)) {
      return cur as ValidNode;
    }
    cur = cur.nextSibling as Node;
  }
  return cur;
}

export function isParent(child: Node, parent: Node) {
  while (child) {
    if (child === parent) {
      return true;
    }
    child = child.parentElement!;
  }
  return false;
}

export function calcDepths(child: Node, parent: Node) {
  let res = 0;
  while (child) {
    if (child === parent) {
      return res;
    }
    res++;
    child = child.parentElement!;
  }
  throw new Error("child is not real child of parent");
}

export function lastValidChild(
  el: Node,
  filter: ElementFilter = isValidNode
): ValidNode | null {
  let cur = el.lastChild as Node;
  while (cur) {
    if (filter(cur)) {
      return cur as ValidNode;
    }
    cur = cur.previousSibling as Node;
  }
  return cur;
}

export function prevValidSibling(
  el: Node,
  filter: ElementFilter = isValidNode
): ValidNode | null {
  while (el) {
    el = el.previousSibling as Node;
    if (filter(el)) {
      return el as ValidNode;
    }
  }
  return el;
}

export function nextValidSibling(
  el: Node,
  filter: ElementFilter = isValidNode
): ValidNode | null {
  while (el) {
    el = el.nextSibling as Node;
    if (filter(el)) {
      return el as ValidNode;
    }
  }
  return el;
}

export function parentElementWithFilter(
  el: Node,
  root: Node,
  filter: ElementFilter
): HTMLElement | null {
  let cur = el as HTMLElement;
  while (cur && cur !== root) {
    if (filter(cur)) {
      return cur;
    }
    if (cur.parentElement) {
      cur = cur.parentElement;
    } else {
      break;
    }
  }
  return null;
}

export function parentElementWithTag(
  el: Node,
  name: ElementTagName,
  root: Node
): HTMLElement | null {
  var cur = el as HTMLElement;
  // el.parentElement
  while (cur && cur !== root) {
    if (isTag(cur, name)) {
      return cur;
    }
    if (cur.parentElement) {
      cur = cur.parentElement;
    } else {
      break;
    }
  }
  if (cur && isTag(cur, name)) {
    return cur;
  }
  return null;
}

// var el: HTMLElement;

// el.nextElementSibling
// el.previousElementSibling
// el.firstChild
// el.firstElementChild
// el.lastChild
// el.lastElementChild
// el.markdown

export function indexOfNode(el?: Node | null, name?: ElementTagName) {
  let i = 0;
  while (el && (el = el.previousSibling as Node)) {
    if (name) {
      if (isTag(el, name)) {
        i++;
      }
    } else {
      i++;
    }
  }
  return i;
}

export function validChildNodes(el: ValidNode | DocumentFragment): ValidNode[] {
  const res: ValidNode[] = [];
  el.childNodes.forEach((item) => {
    if (isValidNode(item)) {
      res.push(item as ValidNode);
    }
  });
  return res;
}

export function containHTMLElement(root: HTMLElement): boolean {
  for (let index = 0; index < root.childNodes.length; index++) {
    const element = root.childNodes[index];
    if (element instanceof HTMLElement) {
      return true;
    }
  }
  return false;
}

// export function outerHTML(...node:Node[])

export function innerHTML(...els: Node[]): string {
  return els
    .map((el) => {
      if (el instanceof Text) {
        return el.textContent || "";
      }
      if (el instanceof HTMLElement) {
        return el.innerHTML;
      }
      return "";
    })
    .join("");
}
// 用于边界合并
export function outerHTML(...node: Node[]): string {
  const wrap = createElement("p");
  node.forEach((item) => {
    wrap.appendChild(item.cloneNode(true));
  });
  return wrap.innerHTML;
}

export function mergeAroundLeft(el: Node) {
  while (el instanceof Text && el.previousSibling instanceof Text) {
    el.textContent = el.previousSibling.textContent! + el.textContent;
    el.previousSibling.remove();
  }
}

export function mergeAroundRight(el: Node) {
  while (el instanceof Text && el.nextSibling instanceof Text) {
    el.textContent = el.textContent + el.nextSibling.textContent!;
    el.nextSibling.remove();
  }
}

export function tryConcatLeft(el: ValidNode): ValidNode {
  if (el instanceof Text) {
    let prev = prevValidSibling(el);
    while (prev && prev instanceof Text) {
      el.textContent = prev.textContent || "" + el.textContent;
      prev.remove();
      prev = prevValidSibling(el);
    }
    return el;
  } else {
    let prev = prevValidSibling(el);
    while (prev && getTagName(prev) === getTagName(el)) {
      const first = firstValidChild(el);
      prev.childNodes.forEach((item) => {
        el.insertBefore(item, first);
      });
      prev.remove();
      prev = prevValidSibling(el);
    }
    return el;
  }
}

export function isEmpty(node: Node): boolean {
  return (node.textContent || "") === "";
}

export function isTag(el: Node, name: ElementTagName) {
  return getTagName(el) === name;
}

export function isHTMLElement(el?: Node | null): boolean {
  if (el && el.nodeType === Node.ELEMENT_NODE) {
    return true;
  }
  return false;
}

export function isValidNode(el: Node): boolean {
  if (!el) {
    return false;
  }
  if (isTag(el, "#text")) {
    return true;
  } else if (isHintHTMLElement(el)) {
    return false;
  } else if (isHTMLElement(el)) {
    return true;
  }
  return false;
}

export function isTokenHTMLElement(
  el: Node,
  filter: ElementFilter<HTMLElement> = (el: HTMLElement) =>
    el instanceof HTMLLabelElement
) {
  return isHTMLElement(el) && filter(el as HTMLElement);
}

export function isTextNode(el: Node) {
  return el && el instanceof Text;
}

// export function createComponents<K extends HTMLElementTagName>(
//   payload: ComponentPayload<K>
// ) {}

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
