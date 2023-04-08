import { createElement, createTextNode } from "../helper/document";
import {
  ValidNode,
  firstValidChild,
  getTagName,
  indexOfNode,
  isEntityNode,
  isParent,
  isTextNode,
  isTokenHTMLElement,
  isValidNode,
  lastValidChild,
  nextValidSibling,
  parentElementWithFilter,
  parentElementWithTag,
  prevValidSibling,
} from "../helper/element";
import {
  findCharAfterPosition,
  findCharBeforePosition,
} from "../helper/string";

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
  startContainer: Node,
  startOffset: number,
  endContainer?: Node,
  endOffset?: number
): Range {
  if (!endContainer) {
    endContainer = startContainer;
    endOffset = endOffset;
  }
  const range = document.createRange();
  range.setStart(startContainer, startOffset);
  range.setEnd(endContainer, endOffset!);
  return range;
}

export function isLeft(root: HTMLElement, range: Range): boolean {
  if (getPrevRange(range, root)) {
    return true;
  }
  return false;
}

export function isRight(root: HTMLElement, range: Range): boolean {
  if (getNextRange(range, root)) {
    return false;
  }
  return true;
}

export function isFirstLine(root: HTMLElement, range: Range) {
  if (root.childNodes.length === 0) {
    return true;
  }
  range = range.cloneRange();
  const test = createElement("span", {
    textContent: "|",
  });
  root.insertBefore(test, root.firstChild);
  const first = test.getClientRects();
  range.insertNode(test);
  const second = test.getClientRects();
  test.remove();
  return first[0].y === second[0].y;
}

export function isLastLine(root: HTMLElement, range: Range) {
  if (root.childNodes.length === 0) {
    return true;
  }
  range = range.cloneRange();
  const test = createElement("span", {
    textContent: " ",
  });
  root.appendChild(test);
  const first = test.getClientRects();
  range.insertNode(test);
  const second = test.getClientRects();
  test.remove();
  return first[0].y === second[0].y;
}

export function getValidAdjacent(
  container: ValidNode,
  where: "afterbegin" | "afterend" | "beforebegin" | "beforeend",
  norm: boolean = true
): [Node, number] {
  if (container instanceof Text) {
    if (where === "afterbegin" || where === "beforebegin") {
      return [container, 0];
    } else {
      return [container, container.textContent?.length!];
    }
  }

  const parent = container.parentElement;
  if (parent) {
    if (where === "beforebegin") {
      // |<b></b>
      if (norm) {
        const neighbor = prevValidSibling(container);
        if (neighbor instanceof Text) {
          return [neighbor, neighbor.textContent?.length!];
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
    } else if (where === "afterbegin") {
      if (isTokenHTMLElement(container)) {
        return [container, 0];
      }
      const child = firstValidChild(container);
      if (child instanceof Text) {
        // <b>"|"</b>
        // <b>|text</b>
        return [child, 0];
      } else {
        // <b>|<i></i></b>
        return [container, indexOfNode(child)];
      }
    } else {
      // "beforeend"
      if (isTokenHTMLElement(container)) {
        return [container, 0];
      }
      const child = lastValidChild(container);
      if (child instanceof Text) {
        // <b>"|"</b>
        // <b>text|</b>
        return [child, child.textContent?.length!];
      } else {
        // <b><i></i>|</b>
        return [container, indexOfNode(child) + 1];
      }
    }
  }

  throw new Error("Not parent");
}

export function getNextOffset(
  container: Node,
  offset: number
): [Node, number] | null {
  if (container instanceof Text && offset < container.length) {
    // tex|t
    return [container, offset + 1];
  }
  console.log(container, offset);
  if (container instanceof Text && offset == container.length) {
    // text|?
    const neighbor = nextValidSibling(container, isEntityNode);
    if (neighbor) {
      // text|___

      if (neighbor instanceof Text) {
        // "text|""text"
        return [neighbor, 1];
      }

      // text|<i>?</i>
      return getValidAdjacent(neighbor, "afterbegin");
    } else {
      const parent = container.parentElement!;
      if (parent) {
        // <b>text|</b>?
        return getValidAdjacent(parent, "afterend");
      } else {
        // "text|"
        return null;
      }
    }
  }

  if (isTokenHTMLElement(container)) {
    // <label>|</label>
    return getValidAdjacent(container as HTMLElement, "afterend");
  }

  const containerChild = container.childNodes[offset];
  if (containerChild) {
    // <b></b>|?
    if (isEntityNode(containerChild)) {
      if (containerChild instanceof Text) {
        // <b></b>|text
        return [containerChild, 1];
      } else {
        // <b></b>|<i></i>
        return getValidAdjacent(containerChild as HTMLElement, "afterbegin");
      }
    } else {
      const neighborChild = nextValidSibling(containerChild);
      if (neighborChild) {
        if (neighborChild instanceof Text) {
          // <b></b>"|""text"
          return [neighborChild, 1];
        } else {
          // <b></b>"|"<i>?</i>
          return getValidAdjacent(neighborChild, "afterbegin");
        }
      }
      // <i><b></b>"|"</i>
      return getValidAdjacent(container as HTMLElement, "afterend");
    }
  } else {
    // <b>|</b>?
    return getValidAdjacent(container as HTMLElement, "afterend");
  }
}

export function getPrevOffset(
  container: Node,
  offset: number
): [Node, number] | null {
  // 三个位置：
  // 当前文本没结束 -> 下一个文本
  // 当前文本已结束 -> 和临界的夹缝（邻居是 HTMLElement）
  // 当前文本已结束 -> 下一段文本（邻居是 Text）
  if (container instanceof Text && offset > 0) {
    // tex|t
    return [container, offset - 1];
  }

  if (container instanceof Text && offset == 0) {
    // ?|text
    const neighbor = prevValidSibling(container, isEntityNode);
    if (neighbor) {
      // text|___

      if (neighbor instanceof Text) {
        // "text""|text"
        return [neighbor, neighbor.textContent?.length! - 1];
      }

      // <i>?</i>|text
      return getValidAdjacent(neighbor, "beforeend");
    } else {
      const parent = container.parentElement!;
      if (parent) {
        // ?<b>|text</b>
        return getValidAdjacent(parent, "beforebegin");
      } else {
        // "text|"
        return null;
      }
    }
  }

  if (isTokenHTMLElement(container)) {
    // <label>|</label>
    return getValidAdjacent(container as HTMLElement, "beforebegin");
  }

  let containerChild;
  if (!container.childNodes[offset]) {
    // <b>?|</b>
    containerChild = lastValidChild(container as HTMLElement);
  } else {
    // <b>?|?</b>
    containerChild = prevValidSibling(container.childNodes[offset]);
  }

  if (containerChild) {
    //
    if (isEntityNode(containerChild)) {
      if (containerChild instanceof Text) {
        // text|?
        return [containerChild, containerChild.textContent?.length! - 1];
      } else {
        // <b></b><i></i>\
        return getValidAdjacent(containerChild, "beforeend");
      }
    } else {
      const neighborChild = prevValidSibling(containerChild);
      if (neighborChild) {
        if (neighborChild instanceof Text) {
          // "text""|"<b></b>
          return [neighborChild, neighborChild.textContent?.length! - 1];
        } else {
          // <i>?</i>"|"<b></b>
          return getValidAdjacent(neighborChild, "beforeend");
        }
      }
      // <i>"|"<b></b></i>
      return getValidAdjacent(container as HTMLElement, "beforebegin");
    }
  } else {
    // ?<b>|</b>
    return getValidAdjacent(container as HTMLElement, "beforebegin");
  }
}

function _getNeighborRange(
  neighborFn: (container: Node, offset: number) => [Node, number] | null,
  range: Range,
  root?: HTMLElement
): Range | null {
  const newRange = range.cloneRange();
  const neighborStart = neighborFn(range.startContainer, range.startOffset);
  const neighborEnd = range.collapsed
    ? neighborStart
    : neighborFn(range.endContainer, range.endOffset);

  if (neighborStart) {
    const [startContainer, startOffset] = neighborStart;
    if (root && !isParent(startContainer, root)) {
      return null;
    }
    newRange.setStart(startContainer, startOffset);
  } else {
    return null;
  }
  if (neighborEnd) {
    const [endContainer, endOffset] = neighborEnd;
    if (root && !isParent(endContainer, root)) {
      return null;
    }
    newRange.setEnd(endContainer, endOffset);
  } else {
    return null;
  }
  return newRange;
}

export function getPrevRange(range: Range, root?: HTMLElement): Range | null {
  return _getNeighborRange(getPrevOffset, range, root);
}

export function getNextRange(range: Range, root: HTMLElement): Range | null {
  return _getNeighborRange(getNextOffset, range, root);
}

export function getPrevWordRange(
  range: Range,
  root: HTMLElement
): Range | null {
  // <b>list list |</b> -> <b>list |list|</b>
  // <b>|list</b> -> |<b>list</b>

  // 1. 获取当前 textContent 往前是否有空格
  // 2. 获取el 下相连 textContent 往前是否有空格

  function convert(container: Node, offset: number): [Node, number] {
    let cur = container;
    while (isTextNode(cur) && offset > 0) {
      let res = findCharBeforePosition(cur.textContent!, " ", offset);
      if (res >= 0) {
        return [cur, res];
      }
      container = cur;
      cur = prevValidSibling(cur) as Node;
      if (isTextNode(cur)) {
        offset = cur.textContent!.length;
      } else {
        // 前一个 container 不存在或者不是字符串，但当前仍然是字符串，
        // 且 offset > 0，所以，直接置到最左
        return [container, 0];
      }
    }
    return getPrevOffset(container, offset)!;
  }
  const [startContainer, startOffset] = convert(
    range.startContainer,
    range.startOffset
  );

  const [endContainer, endOffset] = convert(
    range.endContainer,
    range.endOffset
  );
  range.setStart(startContainer, startOffset);
  range.setEnd(endContainer, endOffset);

  return range;
}

export function getNextWordRange(
  range: Range,
  root: HTMLElement
): Range | null {
  function convert(container: Node, offset: number): [Node, number] {
    let cur = container;
    while (isTextNode(cur)) {
      let res = findCharAfterPosition(cur.textContent!, " ", offset);
      if (res >= 0) {
        return [cur, res + offset + 1];
      }
      container = cur;
      cur = nextValidSibling(cur) as Node;
      if (isTextNode(cur)) {
        offset = cur.textContent!.length;
      } else if (offset != container.textContent?.length) {
        /**
         * 因为 while 循环的条件没有 offset，
         * 所以需要额外判断当前的 offset 是否已经到了当前 textContent 的最右侧
         * 如果没有，则置最右，否则按 nextRange 的逻辑走
         */
        return [container, container.textContent!.length];
      } else {
        break;
      }
    }
    return getNextOffset(container, offset)!;
  }
  const [startContainer, startOffset] = convert(
    range.startContainer,
    range.startOffset
  );

  const [endContainer, endOffset] = convert(
    range.endContainer,
    range.endOffset
  );
  range.setStart(startContainer, startOffset);
  range.setEnd(endContainer, endOffset);

  return range;
}

export function setRange(range: Range, add?: boolean) {
  if (!add) {
    const sel = document.getSelection();
    if (sel && sel.rangeCount > 0) {
      const old = document.getSelection()?.getRangeAt(0);
      if (old && old != range) {
        old.setStart(range.startContainer, range.startOffset);
        old.setEnd(range.endContainer, range.endOffset);
      }
    } else {
      sel?.addRange(range);
    }
  } else {
    document.getSelection()?.addRange(range);
  }
}

export function normalizeRange(root: Node, range: Range) {
  function normContainer(
    container: Node,
    offset: number,
    direction: "left" | "right"
  ): [Node, number] {
    let tgt = parentElementWithFilter(container, root, (el: Node) => {
      const tagName = getTagName(el);
      if (tagName === "label" || tagName === "span") {
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
  const [startContainer, startOffset] = normContainer(
    range.startContainer,
    range.startOffset,
    "left"
  );
  const [endContainer, endOffset] = normContainer(
    range.endContainer,
    range.endOffset,
    "left"
  );
  range.setStart(startContainer, startOffset);
  range.setEnd(endContainer, endOffset);
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
    while (container.parentElement !== root) {
      container = container.parentElement as Node;
    }

    return container;
  }

  let left = father(range.startContainer, range.startOffset);
  let right = father(range.endContainer, range.endOffset);
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
