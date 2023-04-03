/**
 * 管理光标位置
 * 1. 考虑block内，光标如何移动：上下左右，以及在有富文本标记的边界情况下的移动
 * 2. 需要对 inline-block 一视同仁，将 inline-block 视为一个元素，返回选中和跳过
 * 3. 只处理 range 和 offset 之间的转换，不改变任何元素
 */

import { createElement } from "./document";
import {
  ValidNode,
  firstValidChild,
  indexOfNode,
  isHTMLElement,
  isHintHTMLElement,
  isTag,
  isTextNode,
  isTokenHTMLElement,
  isValidNode,
  lastValidChild,
  nextValidSibling,
  prevValidSibling,
} from "./element";
import { findCharAfterPosition, findCharBeforePosition } from "./string";

export interface Offset {
  index?: number;
  endIndex?: number;
  start: number;
  end?: number;
}

export const FIRST_POSITION: Offset = {
  index: 0,
  start: 0,
};
export const LAST_POSITION: Offset = {
  index: -1,
  start: -1,
};
export const FULL_BLOCK: Offset = {
  index: 0,
  endIndex: -1,
  start: 0,
  end: -1,
};

export interface LineInfo {
  lineNumber: number;
  lineHeight: number;
  elHeight: number;
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

function _convertRefToBias(
  root: HTMLElement,
  container: ValidNode,
  offset: number
): number {
  let size = 0;
  let cur: ValidNode | null = container;
  let curSize: number;
  if (isTextNode(cur)) {
    curSize = offset;
  } else if (container.childNodes.length === offset) {
    cur = lastValidChild(container as HTMLElement) as ValidNode;
    if (isTextNode(cur)) {
      curSize = getTokenSize(cur);
    } else if (isTokenHTMLElement(cur)) {
      curSize = 2;
    } else {
      curSize = getTokenSize(cur) + 2;
    }
  } else if (container.childNodes.length < offset) {
    throw EvalError("?");
  } else {
    cur = container.childNodes[offset] as ValidNode;
    curSize = 0;
  }

  // 补全该函数
  while (cur && cur !== root) {
    size += curSize;

    let prev = prevValidSibling(cur);
    let parent = cur;
    while (!prev) {
      parent = parent.parentElement as HTMLElement;
      if (parent !== root) {
        //  text|<b>|</b>
        //        ↑
        size++;
        prev = prevValidSibling(parent);
      } else {
        break;
      }
    }

    cur = prev;
    if (cur) {
      if (isTextNode(cur)) {
        curSize = getTokenSize(cur);
      } else if (isTokenHTMLElement(cur)) {
        curSize = 2;
      } else {
        curSize = getTokenSize(cur) + 2;
      }
    }
  }
  return size;
}

/**
 * <p><b>|</b></p> -> 1
 * <p><b>te|xt</b></p> -> 3
 * <p><b>text</b>|</p> -> 6
 * @param root
 * @param range
 * @returns
 */
export function rangeToOffset(root: HTMLElement, range: Range): Offset {
  const res: Offset = { start: 0 };
  res["start"] = _convertRefToBias(
    root,
    range.startContainer as ValidNode,
    range.startOffset
  );
  if (
    range.startContainer != range.endContainer ||
    range.startOffset != range.endOffset
  ) {
    res["end"] = _convertRefToBias(
      root,
      range.endContainer as ValidNode,
      range.endOffset
    );
  }
  return res;
}

function _convertBiasToRef(root: HTMLElement, bias: number): [Node, number] {
  if (bias < 0) {
    bias += getTokenSize(root) + 1;
    if (bias < 0) {
      bias = 0;
    }
  }
  var cur = firstValidChild(root);
  var delta = 0;

  if (!cur) {
    // <b>|</b>
    return [root, 0];
  }

  if (bias === 0) {
    if (isTextNode(cur)) {
      return [cur, 0];
    } else {
      return [root, indexOfNode(cur)];
    }
  }
  while (cur) {
    if (!isValidNode(cur)) {
      continue;
    }
    const curOffset = getTokenSize(cur);
    if (isTextNode(cur) && curOffset + delta < bias) {
      cur = nextValidSibling(cur)!;
      delta += curOffset;
    } else if (delta === bias) {
      //  <b> <i> </i> <i> </i> </b>
      // 0   1   2    3   4    5    6
      return [cur.parentElement as HTMLElement, indexOfNode(cur)];
    } else if (isHTMLElement(cur) && curOffset + delta + 1 < bias) {
      //   a b c <b> d </b>
      //  0 1 2 3   4 5    6
      //              ↑
      // 5: -3-  -1--1-
      cur = nextValidSibling(cur)!;
      delta += 2 + curOffset;
    } else {
      if (isTextNode(cur)) {
        return [cur, bias - delta];
      } else if (isTokenHTMLElement(cur as HTMLElement)) {
        return [cur, 0];
      } else {
        return _convertBiasToRef(cur as HTMLElement, bias - delta - 1);
      }
    }
  }
  return [root, indexOfNode(lastValidChild(root)) + 1];
}

export function offsetToRange(root: HTMLElement, offset: Offset): Range | null {
  const range = document.createRange();

  const rootSize = getTokenSize(root);
  if (offset.start > rootSize) {
    return null;
  }

  const [startContainer, startOffset] = _convertBiasToRef(root, offset.start);
  let [endContainer, endOffset] = [startContainer, startOffset];
  if (offset.end && offset.end != offset.start) {
    [endContainer, endOffset] = _convertBiasToRef(
      root,
      offset.end || offset.start
    );
  }
  range.setStart(startContainer, startOffset);
  range.setEnd(endContainer, endOffset);
  return range;
}

export function reverseOffset(root: HTMLElement, offset: Offset): Offset {
  const res = Object.assign({}, offset);
  const size = getTokenSize(root);
  if (offset.start) {
    res["start"] = offset.start - size - 1;
  }
  if (offset.end) {
    res["end"] = offset.end - size - 1;
  }
  return res;
}

export function setRange(range: Range, add?: boolean) {
  if (!add) {
    document.getSelection()?.removeAllRanges();
  }
  document.getSelection()?.addRange(range);
}

export function setPosition(root: HTMLElement, offset: Offset) {
  const range = offsetToRange(root, offset);
  if (range) {
    setRange(range);
  }
}

export function getInlinePosition(root: HTMLElement) {}

/**
 *
 * 定义一个 token 是 text 节点的一个字符，或者是 HTML 节点的一个 tag，如 <b>,</b>
 * 或者是一个 style display 为 inline-block 的 HTMLElement
 * 或者是一个 class 包含 markdown-hint 的 HTMLElement
 * 希望补全以下代码，对输入的 root 和 range，得到基于当前 range startContainer 和 startOffset  的上一个token的位置
 * 返回 range，如果位置不再 root 内，则返回 null
 * <p>t|ext</p>
 * <p>|text</p>
 * <p><b>text</b></p>
 * @param root
 * @param range
 * @returns Range | null
 */
export function getPrevRange(root: HTMLElement, range: Range): Range | null {
  const offset = rangeToOffset(root, range);
  offset.start--;
  if (offset.end) {
    offset.end--;
  }
  if (offset.start == -1) {
    return null;
  }
  return offsetToRange(root, offset);
}

export function getPrevWordRange(
  root: HTMLElement,
  range: Range
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
    const curOffset = _convertRefToBias(root, container as HTMLElement, offset);
    if (curOffset === 0) {
      throw EvalError(
        `offset in root container should be larger than 0 in this function, 
        it should be detected in advance when get prev range`
      );
    }

    return _convertBiasToRef(root, curOffset - 1);
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
  root: HTMLElement,
  range: Range
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
    const curOffset = _convertRefToBias(root, container as HTMLElement, offset);

    return _convertBiasToRef(root, curOffset + 1);
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

export function getNextRange(root: HTMLElement, range: Range): Range | null {
  const offset = rangeToOffset(root, range);
  offset.start++;
  if (offset.end) {
    offset.end++;
  }
  return offsetToRange(root, offset);
}

export function getTokenSize(root: ValidNode): number {
  let res = 0;
  if (isTextNode(root)) {
    return root.textContent?.length!;
  }
  if (isTokenHTMLElement(root)) {
    return 0;
  }
  for (let i = 0; i < root.childNodes.length; i++) {
    if (isValidNode(root.childNodes[i])) {
      const cur = root.childNodes[i] as ValidNode;
      if (isHintHTMLElement(cur)) {
        // <span>**</span>
        continue;
      } else if (isTokenHTMLElement(cur)) {
        // <label>...</label>
        // <label></label>
        // ↑      ↑       ↑
        res += 2;
      } else if (isHTMLElement(cur)) {
        // <b>...</b>
        // <b>....</b>
        // ↑  ↑--↑    ↑
        //   recursive
        res += getTokenSize(cur) + 2;
      } else if (isTextNode(cur)) {
        // text
        res += cur.textContent!.length;
      }
    }
  }
  return res;
}

export function isLeft(root: HTMLElement, range: Range): boolean {
  if (rangeToOffset(root, range).start !== 0) {
    return false;
  }
  return true;
}
export function isRight(root: HTMLElement, range: Range): boolean {
  if (getNextRange(root, range)) {
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
