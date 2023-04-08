import { OH_INLINEBLOCK, OH_MDHINT } from "./consts";
import { ElementTagName, createElement } from "./document";

export type ValidNode = Text | HTMLElement;

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

export function isTokenHTMLElement(el: Node) {
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

export function isEntityNode(el: Node) {
  if (!isValidNode(el)) {
    return false;
  }
  if (el instanceof Text) {
    return el.textContent?.length! > 0;
  }
  return true;
}

export function firstValidChild(
  el: ValidNode,
  filter: (el: Node) => boolean = isValidNode
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
export function lastValidChild(
  el: ValidNode,
  filter: (el: Node) => boolean = isValidNode
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
  filter: (el: Node) => boolean = isValidNode
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
  filter: (el: Node) => boolean = isValidNode
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
  filter: (el: Node) => boolean
) {
  var cur = el as HTMLElement;
  // el.parentElement
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
  el: ValidNode | DocumentFragment
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
    return el;
  }
}

export function tryConcatRight(el: ValidNode) {}
