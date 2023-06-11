import {
  ValidNode,
  firstValidChild,
  getTagName,
  indexOfNode,
  isEntityNode,
  isHTMLElement,
  isHintHTMLElement,
  isHintRight,
  isParent,
  isTextNode,
  isTokenHTMLElement,
  isValidNode,
  lastValidChild,
  nextValidSibling,
  outerHTML,
  parentElementWithFilter,
  parentElementWithTag,
  prevValidSibling,
} from "@ohno-editor/core/helper/element";
import { findCharAfter, findCharBefore } from "@ohno-editor/core/helper/string";
import { addMarkdownHint } from "@ohno-editor/core/helper/markdown";
import {
  createElement,
  createTextNode,
} from "@ohno-editor/core/helper/document";
import { biasToLocation } from "./position";

export type RefLocation = [Node, number];

export interface LineInfo {
  lineNumber: number;
  lineHeight: number;
  elHeight: number;
}

export function getLineInfo(root: HTMLElement): LineInfo {
  if (root.childNodes.length === 0) {
    return {
      lineHeight: root.offsetHeight,
      lineNumber: 1,
      elHeight: root.offsetHeight,
    };
  }

  const test = createElement("span", {
    textContent: " ",
  });
  const newLine = createElement("br");

  root.appendChild(test);
  const lineA = test.getClientRects()[0];
  root.insertBefore(newLine, root.firstChild);
  const lineB = test.getClientRects()[0];

  const first = newLine.getClientRects()[0];

  const lineHeight = lineB.y - lineA.y;
  const lastPadding = lineHeight - lineA.height;
  const offsetHeight = lineB.bottom - first.top + lastPadding;

  test.remove();
  newLine.remove();

  const lineNumber = Math.round(offsetHeight / lineHeight) - 1;
  return {
    lineNumber: lineNumber,
    lineHeight,
    elHeight: offsetHeight,
  };
}

export function createRange(
  startContainer?: Node,
  startOffset?: number,
  endContainer?: Node,
  endOffset?: number
): Range {
  if (!endContainer) {
    endContainer = startContainer;
    endOffset = startOffset;
  }
  const range = document.createRange();
  if (startContainer && startOffset !== undefined) {
    range.setStart(startContainer, startOffset);
    range.setEnd(endContainer!, endOffset!);
  }
  return range;
}

/**
 * 获取一个元素边界的 location
 * 注意，一个父元素的内边界（afterbegin/beforeend）可能不是该父元素的子元素
 * 也可能是该父元素 + 偏移值
 */
export function getValidAdjacent(
  container: ValidNode,
  where: "afterbegin" | "afterend" | "beforebegin" | "beforeend",
  norm: boolean = true,
  token_filter = isTokenHTMLElement
): RefLocation {
  if (container instanceof Text) {
    if (where === "afterbegin" || where === "beforebegin") {
      return [container, 0];
    } else {
      return [container, container.textContent!.length!];
    }
  }
  if (isHintHTMLElement(container)) {
    // 禁止在 hint 内获取光标
    if (where === "afterbegin" || where === "beforeend") {
      throw new Error(
        "Sanity check: can not get position inside a hint span element"
      );
    }
    if (where === "afterend" && !container.nextElementSibling) {
      return getValidAdjacent(container.parentElement!, "afterend");
    }
    if (where === "beforebegin" && !container.previousElementSibling) {
      return getValidAdjacent(container.parentElement!, "beforebegin");
    }
  }

  const parent = container.parentElement;
  if (parent) {
    if (where === "beforebegin") {
      // |<b></b>
      if (norm) {
        const neighbor = prevValidSibling(container);
        if (neighbor instanceof Text) {
          return [neighbor, neighbor.textContent!.length];
        }
      }
      return [parent, indexOfNode(container)];
    } else if (where === "afterend") {
      // <b></b>|
      if (norm) {
        const neighbor = nextValidSibling(container);
        if (neighbor instanceof Text) {
          return [neighbor, 0];
        }
      }
      return [parent, indexOfNode(container) + 1];
    }
  }
  if (where === "afterbegin") {
    if (token_filter(container)) {
      return [container, 0];
    }
    const child = firstValidChild(container);
    if (!child) {
      // 空文本，且包含 markdown hint 的特殊情况
      if (container.firstChild && isHintHTMLElement(container.firstChild)) {
        return [container, 1];
      }
    }
    if (child instanceof Text) {
      // <b>"|"</b>
      // <b>|text</b>
      return [child, 0];
    } else {
      // <b>|<i></i></b>
      return [container, indexOfNode(child)];
    }
  } else if (where === "beforeend") {
    // "beforeend"
    if (token_filter(container)) {
      return [container, 0];
    }
    const child = lastValidChild(container);
    if (!child) {
      if (isHintHTMLElement(container.firstChild)) {
        return [container, 1];
      }
      return [container, 0];
    }
    if (child instanceof Text) {
      // <b>"|"</b>
      // <b>text|</b>
      return [child, child.textContent!.length];
    } else {
      // <b><i></i>|</b>
      return [container, indexOfNode(child) + 1];
    }
  }

  throw new Error("Not parent");
}

export function tryGetBoundsRichNode(
  container: Node,
  offset: number,
  direction: "left" | "right"
): HTMLElement | null {
  const filter = (el: Node): boolean => {
    return isEntityNode(el) || isHintHTMLElement(el);
  };
  if (container instanceof HTMLLabelElement) {
    return container;
  }

  // TODO 这里 [label, 0] 无论 left 还是 right 都定位到 label 本身
  if (container instanceof HTMLElement) {
    let neighbor;
    if (container.childNodes[offset]) {
      if (direction === "left") {
        neighbor = prevValidSibling(container.childNodes[offset], filter);
      } else {
        if (filter(container.childNodes[offset])) {
          neighbor = container;
        } else {
          neighbor = nextValidSibling(container.childNodes[offset], filter);
        }
      }
    } else if (container.childNodes[offset - 1] && direction === "left") {
      if (container.childNodes[offset - 1] instanceof HTMLElement) {
        return container.childNodes[offset - 1] as HTMLElement;
      }
    } else {
      throw new Error("Saniti check");
    }
    if (neighbor) {
      if (isHintHTMLElement(neighbor)) {
        return neighbor.parentElement;
      } else if (isHTMLElement(neighbor)) {
        return neighbor as HTMLElement;
      }
    }
  }

  if (container instanceof Text) {
    if (direction === "left" && offset === 0) {
      let prev;
      if ((prev = prevValidSibling(container, filter))) {
        if (prev) {
          if (isHintHTMLElement(prev)) {
            return prev.parentElement;
          } else if (isHTMLElement(prev)) {
            return prev as HTMLElement;
          }
        }
        return null;
      }
      return null;
    }
    if (direction === "right" && offset === container.textContent!.length) {
      let next;
      if ((next = nextValidSibling(container, filter))) {
        if (next) {
          if (isHintHTMLElement(next)) {
            return next.parentElement;
          } else if (isHTMLElement(next)) {
            return next as HTMLElement;
          }
        }
        return null;
      }
      return null;
    }
  }
  return null;
}

export function setLocation(loc: RefLocation) {
  const range = createRange(...loc);
  setRange(range);
}

export function setRange(range: Range, add?: boolean) {
  if (!range) {
    throw new NoRangeError();
  }
  if (!add) {
    const sel = document.getSelection();
    if (sel && sel.rangeCount > 0) {
      const old = sel.getRangeAt(0);
      if (old && old != range) {
        old.setStart(range.startContainer, range.startOffset);
        old.setEnd(range.endContainer, range.endOffset);
      }
    } else {
      sel!.addRange(range);
    }
  } else {
    document.getSelection()!.addRange(range);
  }
}

export function normalizeContainer(
  root: HTMLElement,
  container: Node,
  offset: number,
  direction: "left" | "right"
): RefLocation {
  const tgt = parentElementWithFilter(container, root, (el: Node) => {
    const tagName = getTagName(el);
    if (tagName === "label" || isHintHTMLElement(el)) {
      return true;
    }
    return false;
  });

  if (tgt) {
    return getValidAdjacent(
      tgt,
      direction === "left" ? "beforebegin" : "afterend"
    );
  }
  if (container instanceof HTMLElement) {
    if (!container.childNodes[offset]) {
      const flag = createTextNode("");
      container.appendChild(flag);
      return [flag, 0];
    }
    if (container.childNodes[offset] instanceof Text) {
      return [container.childNodes[offset], 0];
    }
    if (getTagName(container.childNodes[offset]) === "span") {
      const flag = createTextNode("");
      container.insertBefore(flag, container.childNodes[offset]);
      return [flag, 0];
    }
  }

  return [container, offset];
}
/**
 * 跳出 label 和 span 的范围，同时如果是 span 的边界（<b><span></span>|</b>），还要跳出富文本范围
 * @param root
 * @param range
 */
export function normalizeRange(root: HTMLElement, range: Range) {
  const [startContainer, startOffset] = normalizeContainer(
    root,
    range.startContainer,
    range.startOffset,
    "left"
  );
  const [endContainer, endOffset] = normalizeContainer(
    root,
    range.endContainer,
    range.endOffset,
    "right"
  );
  range.setStart(startContainer, startOffset);
  range.setEnd(endContainer, endOffset);
}

/**
 * 保证 location 定位到具体的 text 结点，如果不存在，会创建一个空 text 插入
 * @param container
 * @param offset
 */
export function validateLocation(container: Node, offset: number): RefLocation {
  if (container instanceof Text || container instanceof HTMLLabelElement) {
    return [container, offset];
  }

  if (container.childNodes[offset - 1] instanceof Text) {
    return [
      container.childNodes[offset - 1] as Text,
      container.childNodes[offset - 1].textContent!.length,
    ];
  }
  if (!container.childNodes[offset]) {
    const text = createTextNode("");
    container.appendChild(text);
    return [text, 0];
  }

  if (container.childNodes[offset] instanceof Text) {
    return [container.childNodes[offset] as Text, 0];
  }

  if (container.childNodes[offset] instanceof Element) {
    const text = createTextNode("");
    container.insertBefore(text, container.childNodes[offset]);
    return [text, 0];
  }

  throw new Error("situation not handled");
}

export function validateRange(range: Range) {
  range.setStart(...validateLocation(range.startContainer, range.startOffset));
  if (!range.collapsed) {
    range.setEnd(...validateLocation(range.endContainer, range.endOffset));
  }
}

export function nodesOfRange(
  range: Range,
  splitText: boolean = true
): ValidNode[] {
  if (range.startContainer === range.endContainer) {
    if (splitText) {
      let left = range.startContainer;

      if (left instanceof Text) {
        left.splitText(range.endOffset);
      }

      if (left instanceof Text) {
        left = left.splitText(range.startOffset);
      }
      return [left as ValidNode];
    }

    return [range.startContainer as ValidNode];
  }

  const res: ValidNode[] = [];
  const root = range.commonAncestorContainer;

  function father(container: Node, offset: number): Node {
    // 空元素，如 <b>|</b> 的情况，不可能发生 container === root
    // <p>te[xt<i>...</i>]</p>，此时 endContainer 的落点会在 p 上，offset = 2
    if (container === root) {
      container = container.childNodes[offset - 1];
    }
    while (container.parentElement !== root) {
      container = container.parentElement as Node;
    }

    return container;
  }
  let left, right;
  left = father(range.startContainer, range.startOffset);
  right = father(range.endContainer, range.endOffset);

  if (splitText) {
    if (left instanceof Text) {
      left = left.splitText(range.startOffset);
    }

    if (right instanceof Text) {
      right.splitText(range.endOffset);
    }
  }
  res.push(left as ValidNode);
  while (left !== right) {
    left = nextValidSibling(left)!;
    res.push(left as ValidNode);
    // if (left !== right) {
    // }
  }

  return res;
}

export function inSameLine(a: DOMRect, b: DOMRect): boolean {
  // 判断 a 和 b 的顶部、底部是否在同一条竖直线上
  return (
    (a.top <= b.top && a.bottom >= b.top) ||
    (b.top <= a.top && b.bottom >= a.top)
  );
}

export function clipRange(node: ValidNode, range: Range): Range | null {
  if (isParent(range.commonAncestorContainer, node)) {
    return range;
  }
  if (isParent(node, range.commonAncestorContainer)) {
    const newRange = range.cloneRange();
    if (!isParent(range.startContainer, node)) {
      newRange.setStart(...biasToLocation(node, 0)!);
    }
    if (!isParent(range.endContainer, node)) {
      newRange.setEnd(...biasToLocation(node, 0)!);
    }
    return newRange;
  }
  // 互相独立无重叠
  return null;
}

export function compareLocation(a: RefLocation, b: RefLocation): number {
  if (a[0] === b[0] && a[1] === b[1]) {
    return 0;
  }
  const range = createRange(...a, ...b);
  if (range.collapsed) {
    // a > b
    return -1;
  } else {
    // a < b
    return 1;
  }
}

export function makeRangeInNode(node: ValidNode, range?: Range): Range {
  if (!range) {
    range = createRange();
  }

  if (!isParent(range.commonAncestorContainer, node)) {
    range.setStart(...getValidAdjacent(node, "afterbegin"));
    range.setEnd(...getValidAdjacent(node, "afterbegin"));
  }

  const span = parentElementWithFilter(
    range.commonAncestorContainer,
    node,
    (el) => {
      return isHintHTMLElement(el);
    }
  );
  if (span) {
    const where = isHintRight(span) ? "beforeend" : "afterbegin";
    range.setStart(...getValidAdjacent(node, where));
    range.setEnd(...getValidAdjacent(node, where));
  }

  return range;
}
