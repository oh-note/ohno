import { OH_INLINEBLOCK, OH_MDHINT } from "./consts";
import { ElementTagName, createElement } from "./document";

export type ValidNode = Text | HTMLElement | DocumentFragment;

export interface Condition {
  emptyText?: boolean;
  whiteText?: boolean;
  br?: boolean;
  nullable?: boolean;
}
export function getTagName(el: Node): ElementTagName {
  if (!el) {
    throw EvalError("el is none");
  }
  return el.nodeName.toLowerCase() as ElementTagName;
}

export function isTag(el: Node, name: ElementTagName) {
  return getTagName(el) === name;
}
export function isHTMLElement(el: Node) {
  return el && el.nodeType === Node.ELEMENT_NODE;
}

export function isTokenHTMLElement(el: ValidNode) {
  return (
    isHTMLElement(el) && (el as HTMLElement).classList.contains(OH_INLINEBLOCK)
  );
}

export function isHintHTMLElement(el: Node) {
  return isHTMLElement(el) && (el as HTMLElement).classList.contains(OH_MDHINT);
}

export function isTextNode(el: Node) {
  return el && el instanceof Text;
}

export function isValidNode(el: Node, condition?: Condition): ValidNode | null {
  if (!el) {
    return null;
  }
  if (isTag(el, "#text")) {
    return el as Text;
  } else if (isHintHTMLElement(el)) {
    return null;
  } else if (isHTMLElement(el)) {
    return el as HTMLElement;
  }
  return null;
}
export function firstValidChild(
  el: HTMLElement,
  condition?: Condition
): ValidNode | null {
  let cur = el.firstChild as Node;
  while (cur) {
    if (isValidNode(cur, condition)) {
      return cur as ValidNode;
    }
    cur = cur.nextSibling as Node;
  }
  return cur;
}
export function lastValidChild(
  el: HTMLElement,
  condition?: Condition
): ValidNode | null {
  let cur = el.lastChild as Node;
  while (cur) {
    if (isValidNode(cur, condition)) {
      return cur as ValidNode;
    }
    cur = cur.previousSibling as Node;
  }
  return cur;
}

export function prevValidSibling(
  el: Node,
  condition?: Condition
): ValidNode | null {
  while (el) {
    el = el.previousSibling as Node;
    if (isValidNode(el, condition)) {
      return el as ValidNode;
    }
  }
  return el;
}

export function nextValidSibling(
  el: Node,
  condition?: Condition
): ValidNode | null {
  while (el) {
    el = el.nextSibling as Node;
    if (isValidNode(el, condition)) {
      return el as ValidNode;
    }
  }
  return el;
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

export function validChildNodes(
  el: HTMLElement | DocumentFragment
): ValidNode[] {
  const res: ValidNode[] = [];
  el.childNodes.forEach((item) => {
    if (isValidNode(item)) {
      res.push(item as ValidNode);
    }
  });
  return res;
}

export function innerHTML(...node: Node[]): string {
  const wrap = createElement("p");
  node.forEach((item) => {
    wrap.appendChild(item.cloneNode(true));
  });
  return wrap.innerHTML;
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
  }
}
export function tryConcatRight(el: ValidNode) {}
