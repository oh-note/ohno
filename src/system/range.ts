import {
  ValidNode,
  firstValidChild,
  getTagName,
  indexOfNode,
  isEntityNode,
  isHTMLElement,
  isHintHTMLElement,
  isHintLeft,
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
} from "@/helper/element";
import { findCharAfterPosition, findCharBeforePosition } from "@/helper/string";
import { addMarkdownHint } from "@/helper/markdown";
import { createElement, createTextNode } from "@/helper/document";

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
  const [second, _] = getRects(range);
  test.remove();
  return first[0].y === second[0].y;
}

export function locationInLeft(
  root: HTMLElement,
  container: Node,
  offset: number
): boolean {
  if (root.childNodes.length === 0) {
    return true;
  }
  const range = createRange(container, offset);
  const test = createElement("span", {
    textContent: "|",
  });
  root.insertBefore(test, root.firstChild);
  const first = test.getClientRects();
  const [second, _] = getRects(range);
  test.remove();
  return first[0].y === second[0].y;
}

export function locationInFirstLine(
  root: HTMLElement,
  container: Node,
  offset: number
): boolean {
  if (root.childNodes.length === 0) {
    return true;
  }
  const range = createRange(container, offset);
  const test = createElement("span", {
    textContent: "|",
  });
  root.insertBefore(test, root.firstChild);
  const first = test.getClientRects();
  const [second, _] = getRects(range);
  test.remove();
  return first[0].y === second[0].y;
}

export function locationInLastLine(
  root: HTMLElement,
  container: Node,
  offset: number
): boolean {
  if (root.childNodes.length === 0) {
    return true;
  }
  const range = createRange(container, offset);
  const test = createElement("span", {
    textContent: "|",
  });
  root.appendChild(test);
  const first = test.getClientRects();

  const [second, _] = getRects(range);
  test.remove();
  return inSameLine(first[0], second[0]);
}

export function isLastLine(root: HTMLElement, range: Range) {
  if (root.childNodes.length === 0) {
    return true;
  }
  range = range.cloneRange();
  const test = createElement("span", {
    textContent: "|",
  });
  root.appendChild(test);
  const first = test.getClientRects();

  const [second, _] = getRects(range);
  test.remove();
  return inSameLine(first[0], second[0]);
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
    } else if (where === "afterbegin") {
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
    } else {
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
  }

  throw new Error("Not parent");
}

/**
 * 以固定的逻辑获取下一个光标可以移动的位置
 */
function _getNextLocation(container: Node, offset: number): RefLocation | null {
  if (container instanceof Text && offset < container.length) {
    // tex|t
    return [container, offset + 1];
  }

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
      const neighborChild = nextValidSibling(containerChild, (el) => {
        return isEntityNode(el);
      });
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

export function getPrevLocation(
  container: Node,
  offset: number,
  root?: HTMLElement
): RefLocation | null {
  const result = _getPrevLocation(container, offset);
  if (!result) {
    return result;
  }
  const [tgt, _] = result;
  if (root && !isParent(tgt, root)) {
    return null;
  }
  return result;
}

export function getNextLocation(
  container: Node,
  offset: number,
  root: HTMLElement
): RefLocation | null {
  const result = _getNextLocation(container, offset);
  if (!result) {
    return result;
  }
  const [tgt, _] = result;
  if (!isParent(tgt, root)) {
    return null;
  }
  return result;
}
/**
 * 以固定的逻辑获取上一个光标可以移动的位置
 */
function _getPrevLocation(container: Node, offset: number): RefLocation | null {
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
        return [neighbor, neighbor.textContent!.length - 1];
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
        return [containerChild, containerChild.textContent!.length - 1];
      } else if (isTokenHTMLElement(containerChild)) {
        return [containerChild, 0];
      } else {
        // <b></b><i></i>\
        return getValidAdjacent(containerChild, "beforeend");
      }
    } else {
      const neighborChild = prevValidSibling(containerChild, (el) => {
        return isEntityNode(el);
      });

      if (neighborChild) {
        if (neighborChild instanceof Text) {
          // "text""|"<b></b>
          return [neighborChild, neighborChild.textContent!.length - 1];
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

/**
 * 带有根节点判断的相邻位置获取，如果已经到边界，则返回空
 * 如果不提供 root 节点，则不进行边界判定
 * range 是一个范围，因此左右两侧有一个到了边界就进行判定
 */
function _getNeighborRange(
  neighborFn: (container: Node, offset: number) => RefLocation | null,
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
  return _getNeighborRange(_getPrevLocation, range, root);
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

function checkLocation(
  res: [cur: Node, curOffset: number] | null,
  root: HTMLElement
): RefLocation | null {
  if (!res) {
    return null;
  }
  const [cur, curOffset] = res;
  if (isParent(cur, root)) {
    return [cur, curOffset];
  }
  return null;
}

export function getPrevWordLocation(
  cur: Node,
  curOffset: number,
  root: HTMLElement
): RefLocation | null {
  // let cur = container;
  while (isTextNode(cur) && curOffset > 0) {
    const res = findCharBeforePosition(cur.textContent!, " ", curOffset);
    if (res >= 0) {
      return checkLocation([cur, res], root);
    }
    // container = cur;
    const prev = prevValidSibling(cur) as Node;
    if (isTextNode(prev)) {
      curOffset = prev.textContent!.length;
      cur = prev;
    } else {
      // 前一个 container 不存在或者不是字符串，但当前仍然是字符串，
      // 且 offset > 0，所以，直接置到最左
      return checkLocation([cur, 0], root);
    }
  }
  return checkLocation(_getPrevLocation(cur, curOffset), root)!;
}

export function getNextWordLocation(
  cur: Node,
  curOffset: number,
  root: HTMLElement
): RefLocation | null {
  while (isTextNode(cur)) {
    const res = findCharAfterPosition(cur.textContent!, " ", curOffset);
    if (res >= 0) {
      return checkLocation([cur, res + curOffset + 1], root);
    }

    const next = nextValidSibling(cur) as Node;
    if (isTextNode(next)) {
      curOffset = 0;
      cur = next;
    } else if (curOffset != cur.textContent?.length) {
      /**
       * 因为 while 循环的条件没有 offset，
       * 所以需要额外判断当前的 offset 是否已经到了当前 textContent 的最右侧
       * 如果没有，则置最右，否则按 nextRange 的逻辑走
       */
      return checkLocation([cur, cur.textContent!.length], root);
    } else {
      break;
    }
  }
  return checkLocation(_getNextLocation(cur, curOffset), root)!;
}

/**
 * 获取基于
 */
export function getNextRange(range: Range, root: HTMLElement): Range | null {
  return _getNeighborRange(_getNextLocation, range, root);
}

export function getPrevWordRange(
  range: Range,
  root: HTMLElement
): Range | null {
  // <b>list list |</b> -> <b>list |list|</b>
  // <b>|list</b> -> |<b>list</b>

  // 1. 获取当前 textContent 往前是否有空格
  // 2. 获取el 下相连 textContent 往前是否有空格

  function convert(container: Node, offset: number): RefLocation {
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
    return _getPrevLocation(container, offset)!;
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
  function convert(container: Node, offset: number): RefLocation {
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
    return _getNextLocation(container, offset)!;
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
    if (isTokenHTMLElement(tgt)) {
      return getValidAdjacent(
        tgt,
        direction === "left" ? "beforebegin" : "afterend"
      );
    }
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

  if (container.childNodes[offset] instanceof HTMLElement) {
    const text = createTextNode("");
    container.insertBefore(text, container.childNodes[offset]);
    return [text, 0];
  }
  if (container.childNodes[offset] instanceof Text) {
    return [container.childNodes[offset] as Text, 0];
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

export function getRects(range: Range, force?: boolean): [DOMRect[], DOMRect] {
  let rects = range.getClientRects();
  let rect = range.getBoundingClientRect();

  const nextLoc = _getNextLocation(range.startContainer, range.startOffset);
  if (nextLoc) {
    range.setEnd(...nextLoc);
    rects = range.getClientRects();
    rect = range.getBoundingClientRect();
    range.collapse(true);
  }

  if (rects.length === 0) {
    const flag = createTextNode("|");
    range.collapse(true);
    range.insertNode(flag);
    rects = range.getClientRects();
    rect = range.getBoundingClientRect();
    flag.remove();
  }
  if (rects.length === 0) {
    throw new Error("Can not get rects of this range");
  }
  // 尝试同时选择相邻一个字符然后计算，而不是插入
  return [diffLineRects(rects), rect];
}

export function inSameLine(a: DOMRect, b: DOMRect): boolean {
  // 判断 a 和 b 的顶部、底部是否在同一条竖直线上
  return (
    (a.top <= b.top && a.bottom >= b.top) ||
    (b.top <= a.top && b.bottom >= a.top)
  );
}

function diffLineRects(rect: DOMRectList): DOMRect[] {
  const res: DOMRect[] = [];
  for (let i = 0; i < rect.length; i++) {
    let flag = true;
    for (let j = 0; j < res.length; j++) {
      if (inSameLine(res[j], rect[i])) {
        flag = false;
      }
    }
    if (flag) {
      res.push(rect[i]);
    }
  }

  return res;
}

export function getSoftLineHead(
  container: Node,
  offset: number,
  root: HTMLElement
): RefLocation {
  let pointRange = createRange(container, offset);
  let [rects, rect] = getRects(pointRange);
  // 在初始的时候就判断一下
  // const diffLines = diffLineRects(rects);
  if (rects.length > 1 && inSameLine(rects[0], rect)) {
    // 直接在首行
    return [container, offset];
  }
  let c = 0;
  for (; c < 500; c++) {
    // debugger;
    if (rects.length === 0) {
      throw new Error("sanity check");
    } else if (rects.length === 1) {
      // softline 一定是已经附在 document 上，所以不会出现 null 的结果
      const res = _getPrevLocation(container, offset)!;
      const [prevContainer, prevOffset] = res;
      if (!isParent(prevContainer, root)) {
        return [container, offset];
      }
      const prevRange = createRange(prevContainer, prevOffset);
      const [prevRects, prevRect] = getRects(prevRange);
      if (!inSameLine(prevRect, rect)) {
        if (prevRects.length > 1) {
          return res;
        } else {
          return [container, offset];
        }
      }
      pointRange = prevRange;
      [container, offset] = [prevContainer, prevOffset];
      // rects = prevRects;
      // rect = prevRect;
    } else {
      if (inSameLine(rects[0], rect)) {
        // 123|
        // 456
        // 遍历到行首
        const res = _getPrevLocation(container, offset);
        if (res) {
          [container, offset] = res;
        } else {
          return [container, offset];
        }
        pointRange = createRange(container, offset);
        // rects = pointRange.getClientRects();
        // [rects, rect] = getRects(pointRange);
        // 判断 container 是否本身跨多行
      } else {
        // 123
        // |456
        return [container, offset];
      }
    }
  }
  throw new Error("Cannot find head");
}

export function getSoftLineTail(
  container: Node,
  offset: number,
  root: HTMLElement
): RefLocation {
  let pointRange = createRange(container, offset);
  const [rects, rect] = getRects(pointRange);
  // 在初始的时候就判断一下
  let c = 0;
  for (; c < 500; c++) {
    // debugger;
    if (rects.length === 0) {
      throw new Error("sanity check");
    } else if (rects.length === 1) {
      // softline 一定是已经附在 document 上，所以不会出现 null 的结果
      const res = _getNextLocation(container, offset)!;
      const [nextContainer, nextOffset] = res;
      if (!isParent(nextContainer, root)) {
        return [container, offset];
      }
      const nextRange = createRange(nextContainer, nextOffset);
      const [_, nextRect] = getRects(nextRange);
      if (!inSameLine(nextRect, rect)) {
        return [container, offset];
      }

      pointRange = nextRange;
      [container, offset] = [nextContainer, nextOffset];
      // rects = nextRects;
      // rect = nextRect;
    } else {
      if (inSameLine(rects[0], rect)) {
        // 123|
        // 456
        // 遍历到行首
        const res = _getNextLocation(container, offset);
        if (res) {
          [container, offset] = res;
        } else {
          return [container, offset];
        }
        pointRange = createRange(container, offset);
        // rects = pointRange.getClientRects();
        // 判断 container 是否本身跨多行
      } else {
        // 123
        // |456
        return [container, offset];
      }
    }
  }
  throw new Error("Cannot find tail");
}
