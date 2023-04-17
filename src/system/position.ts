/**
 * 管理光标位置
 * 1. 考虑block内，光标如何移动：上下左右，以及在有富文本标记的边界情况下的移动
 * 2. 需要对 inline-block 一视同仁，将 inline-block 视为一个元素，返回选中和跳过
 * 3. 只处理 range 和 offset 之间的转换，不改变任何元素
 */

import { createTextNode, getDefaultRange } from "@helper/document";
import {
  ValidNode,
  firstValidChild,
  indexOfNode,
  isHTMLElement,
  isHintHTMLElement,
  isParent,
  isTextNode,
  isTokenHTMLElement,
  isValidNode,
  lastValidChild,
  nextValidSibling,
  outerHTML,
  prevValidSibling,
} from "@helper/element";
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

/**
 * 基于 Root，计算 container 和 container 的 offset 相对 root 的 token 数量
 *
 * 思路：首先计算该 container 内的偏差值，随后不断的迭代左相邻节点和父节点
 *  - 左相邻节点时添加全部 token 数
 *  - 跨过父节点时 token 数 + 1
 * 直到和父节点相邻
 * @param root
 * @param container
 * @param offset
 * @returns
 */
function _convertRefToBias(
  root: HTMLElement,
  container: ValidNode,
  offset: number
): number {
  let size = 0;
  let cur: ValidNode | null = container;
  let curSize: number;

  if (!isParent(container, root)) {
    throw new Error(
      "Cannot calculate offset when selection range are not in root"
    );
  }

  if (isTextNode(cur)) {
    curSize = offset;
  } else if (container.childNodes.length === offset) {
    // <b>...<i>...</i>|</b>
    cur = lastValidChild(container as HTMLElement) as ValidNode;
    if (cur) {
      // <b>?</b>
      if (isTextNode(cur)) {
        // <b>text|</b>
        curSize = getTokenSize(cur);
      } else if (isTokenHTMLElement(cur)) {
        // <b><label>...</label>|</b>
        curSize = 2;
      } else {
        // <b><i>...</i>|</b>
        curSize = getTokenSize(cur) + 2;
      }
    } else {
      curSize = 0;
    }
  } else if (container.childNodes.length < offset) {
    throw EvalError("sanity check");
  } else {
    // <b><i>...</i>|<i>...</i></b>
    cur = container.childNodes[offset] as ValidNode;
    curSize = 0;
  }

  // 从相邻节点直接开始计算，初始 cur 的 token 已经在上面的逻辑中计算完了
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

export function makeBiasPos(
  root: ValidNode,
  bias?: number
): number | undefined {
  if (bias) {
    if (bias < 0) {
      bias += getTokenSize(root) + 1;
      if (bias < 0) {
        bias = 0;
      }
    }
  }
  return bias;
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
export function offsetToRange(root: ValidNode, offset: Offset): Range | null {
  const range = document.createRange();

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
      if (endContainer.childNodes[endOffset] instanceof Text) {
        endContainer = endContainer.childNodes[endOffset];
      } else {
        const text = createTextNode("");
        root.insertBefore(text, endContainer.childNodes[endOffset]);
        endContainer = text;
      }
      endOffset = 0;
    }

    if (startContainer === root) {
      if (startContainer.childNodes[startOffset] instanceof Text) {
        startContainer = startContainer.childNodes[startOffset];
      } else {
        const text = createTextNode("");
        root.insertBefore(text, startContainer.childNodes[startOffset]);
        startContainer = text;
      }
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

export function elementOffset(
  root: HTMLElement,
  ...node: ValidNode[]
): // left: ValidNode,
// right?: ValidNode
Offset {
  const range = document.createRange();
  const left = node[0];
  const right = node[node.length - 1];
  const [startContainer, startOffset] = getValidAdjacent(left, "beforebegin");
  const [endContainer, endOffset] = getValidAdjacent(right, "afterend");
  range.setStart(startContainer, startOffset);
  range.setEnd(endContainer, endOffset);
  return rangeToOffset(root, range);
}

export function getInlinePosition(root: HTMLElement) {}

/**
 * 计算节点或节点组的 token 数
 * 如果是节点数组，默认包含每一个节点两侧的 token
 * 如果不是节点数组，默认忽略根节点两侧的 token
 */
export function getTokenSize(
  root: ValidNode | ValidNode[] | DocumentFragment,
  with_root: boolean = false
): number {
  let res = 0;
  if (Array.isArray(root)) {
    root.forEach((item) => {
      res += getTokenSize(item, true);
    });
    return res;
  }
  if (isTextNode(root)) {
    return root.textContent!.length;
  }
  if (with_root) {
    res += 2;
  }
  if (isTokenHTMLElement(root)) {
    return res;
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

export function setOffset(root: HTMLElement, offset: Offset) {
  const range = offsetToRange(root, offset);
  if (range) {
    setRange(range);
    return;
  }
  throw new Error("set offset error");
}
