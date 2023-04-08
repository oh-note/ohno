/**
 * 管理光标位置
 * 1. 考虑block内，光标如何移动：上下左右，以及在有富文本标记的边界情况下的移动
 * 2. 需要对 inline-block 一视同仁，将 inline-block 视为一个元素，返回选中和跳过
 * 3. 只处理 range 和 offset 之间的转换，不改变任何元素
 */

import { createTextNode } from "../helper/document";
import {
  ValidNode,
  firstValidChild,
  indexOfNode,
  isHTMLElement,
  isHintHTMLElement,
  isTextNode,
  isTokenHTMLElement,
  isValidNode,
  lastValidChild,
  nextValidSibling,
  prevValidSibling,
} from "../helper/element";
import { getValidAdjacent, setRange } from "./range";

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
    if (cur) {
      if (isTextNode(cur)) {
        curSize = getTokenSize(cur);
      } else if (isTokenHTMLElement(cur)) {
        curSize = 2;
      } else {
        curSize = getTokenSize(cur) + 2;
      }
    } else {
      return 0;
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

function _convertBiasToRef(root: ValidNode, bias: number): [Node, number] {
  if (bias < 0) {
    bias += getTokenSize(root) + 1;
    if (bias < 0) {
      bias = 0;
    }
  }

  if (isTextNode(root)) {
    return [root, bias];
  }

  var cur = firstValidChild(root as HTMLElement);
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
  return [root, indexOfNode(lastValidChild(root as HTMLElement)) + 1];
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

/**
 * 需要确保 root 节点不出现在 Range 中，而是 root 节点的子元素
 * 当位置必须通过 root 节点 + offset 表示时，在相应位置创建一个空 Text Node 来返回
 * 这一操作用于减少应用富文本格式时的条件判断
 * @param root
 * @param offset
 * @returns
 */
export function offsetToRange(
  root: ValidNode | ValidNode[],
  offset: Offset
): Range | null {
  const range = document.createRange();

  if (root instanceof Array) {
    const temp = document.createDocumentFragment();
    temp.append(...root);
    root = temp;
  }

  const rootSize = getTokenSize(root);
  if (offset.start > rootSize) {
    return null;
  }

  let [startContainer, startOffset] = _convertBiasToRef(root, offset.start);
  let [endContainer, endOffset] = [startContainer, startOffset];
  if (offset.end && offset.end != offset.start) {
    [endContainer, endOffset] = _convertBiasToRef(
      root,
      offset.end || offset.start
    );
  }
  if (root instanceof HTMLElement) {
    if (endContainer === root) {
      const text = createTextNode("");
      root.insertBefore(text, endContainer.childNodes[endOffset]);
      endContainer = text;
      endOffset = 0;
    }

    if (startContainer === root) {
      const text = createTextNode("");
      root.insertBefore(text, startContainer.childNodes[startOffset]);
      startContainer = text;
      startOffset = 0;
    }
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

export function elementOffset(root: HTMLElement, el: ValidNode): Offset {
  const range = document.createRange();
  const [startContainer, startOffset] = getValidAdjacent(el, "beforebegin");
  const [endContainer, endOffset] = getValidAdjacent(el, "afterend");
  range.setStart(startContainer, startOffset);
  range.setEnd(endContainer, endOffset);
  return rangeToOffset(root, range);
}

export function getInlinePosition(root: HTMLElement) {}

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

export function setPosition(root: HTMLElement, offset: Offset) {
  const range = offsetToRange(root, offset);
  if (range) {
    setRange(range);
  }
}
