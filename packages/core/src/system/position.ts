/**
 * 管理光标位置
 * 1. 考虑block内，光标如何移动：上下左右，以及在有富文本标记的边界情况下的移动
 * 2. 需要对 inline-block 一视同仁，将 inline-block 视为一个元素，返回选中和跳过
 * 3. 只处理 range 和 offset 之间的转换，不改变任何元素
 */

import {
  createTextNode,
  getDefaultRange,
} from "@ohno-editor/core/helper/document";
import {
  ElementFilter,
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
} from "@ohno-editor/core/helper/element";
import {
  RefLocation,
  getValidAdjacent,
  setRange,
  validateLocation,
} from "./range";
import { Interval } from "./base";

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
export function locationToBias(
  root: Node,
  container: Node,
  offset: number,
  token_filter?: ElementFilter
): number {
  let size = 0;
  let cur: Node | null = container;
  let curSize: number;

  if (!token_filter) {
    token_filter = isTokenHTMLElement;
  }

  if (!isParent(container, root)) {
    throw new Error(
      "Cannot calculate offset when selection range are not in root"
    );
  }

  if (isTextNode(cur)) {
    if (root === cur) {
      return offset;
    }
    curSize = offset;
  } else if (container.childNodes.length === offset) {
    // <b>...<i>...</i>|</b>
    cur = lastValidChild(container as HTMLElement);
    if (cur) {
      // <b>?</b>
      if (isTextNode(cur)) {
        // <b>text|</b>
        curSize = getTokenSize(cur);
      } else if (token_filter(cur)) {
        // <b><label>...</label>|</b>
        curSize = 2;
      } else {
        // <b><i>...</i>|</b>
        curSize = getTokenSize(cur, false, token_filter) + 2;
      }
    } else {
      // <b>|</b> -> 相当于跳出去，从 |<b></b> 开始遍历
      cur = container;
      curSize = 1;
    }
  } else if (container.childNodes.length < offset) {
    throw EvalError("sanity check");
  } else {
    // <b><i>...</i>|<i>...</i></b>
    cur = container.childNodes[offset];
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
      } else if (token_filter(cur)) {
        curSize = 2;
      } else {
        curSize = getTokenSize(cur, false, token_filter) + 2;
      }
    }
  }
  return size;
}

export function biasToLocation(
  root: ValidNode,
  bias: number,
  token_filter: ElementFilter = isTokenHTMLElement
): [Node, number] | null {
  if (bias === -1) {
    return getValidAdjacent(root, "beforeend");
  }

  if (bias < 0) {
    bias += getTokenSize(root, undefined, token_filter) + 1;
    if (bias < 0) {
      return null;
    }
  }

  if (bias === 0) {
    return getValidAdjacent(root, "afterbegin");
  }

  if (isTextNode(root)) {
    if (root.textContent!.length < bias) {
      return null;
    }
    return [root, bias];
  }

  let cur = firstValidChild(root as HTMLElement);
  let delta = 0;

  if (!cur) {
    // <b>|</b>
    return null;
    // if (root.firstChild && isHintHTMLElement(root.firstChild)) {
    //   return [root, 1];
    // }
    // return [root, 0];
  }

  while (cur) {
    if (!isValidNode(cur)) {
      throw new Error("Cannot process invalid node.");
    }
    const tokenN = getTokenSize(cur, undefined, token_filter);
    if (isTextNode(cur) && tokenN + delta < bias) {
      // 因为是从外往内递归遍历
      // 所以不会出现 nextValid 为空而还没有找到元素的情况
      cur = nextValidSibling(cur)!;
      delta += tokenN;
    } else if (delta === bias) {
      //  <b> <i> </i> <i> </i> </b>
      // 0   1   2    3   4    5    6
      return [cur.parentElement as HTMLElement, indexOfNode(cur)];
    } else if (
      (isHTMLElement(cur) && tokenN + delta + 2 === bias) ||
      (isTextNode(cur) && tokenN + delta === bias)
    ) {
      //   a b c <b> d </b>|
      //   a b c  abc|
      return getValidAdjacent(cur, "afterend");
    } else if (isHTMLElement(cur) && tokenN + delta + 1 < bias) {
      //   a b c <b> d </b>
      //  0 1 2 3   4 5    6
      //              ↑
      // 5: -3-  -1--1-
      cur = nextValidSibling(cur)!;
      delta += 2 + tokenN;
    } else {
      if (isTextNode(cur)) {
        return [cur, bias - delta];
      } else if (token_filter(cur as HTMLElement)) {
        return [cur, 0];
      } else {
        return biasToLocation(
          cur as HTMLElement,
          bias - delta - 1,
          token_filter
        );
      }
    }
  }
  return null;
}

/**
 * <p><b>|</b></p> -> 1
 * <p><b>te|xt</b></p> -> 3
 * <p><b>text</b>|</p> -> 6
 * @param root
 * @param range
 * @returns
 */
export function rangeToInterval(root: HTMLElement, range: Range): Interval {
  const start = locationToBias(root, range.startContainer, range.startOffset);
  let end;
  if (
    range.startContainer != range.endContainer ||
    range.startOffset != range.endOffset
  ) {
    end = locationToBias(root, range.endContainer, range.endOffset);
  } else {
    end = start;
  }
  return { start, end };
}

/**
 * 需要确保 root 节点不出现在 Range 中，而是 root 节点的子元素
 * 当位置必须通过 root 节点 + offset 表示时，在相应位置创建一个空 Text Node 来返回
 * 这一操作用于减少应用富文本格式时的条件判断
 * @param root
 * @param offset
 * @returns
 */
export function intervalToRange(
  root: ValidNode,
  offset: Interval
): Range | null {
  const range = document.createRange();

  const rootSize = getTokenSize(root);
  if (offset.start > rootSize) {
    return null;
  }

  let [startContainer, startOffset] = biasToLocation(root, offset.start)!;
  let [endContainer, endOffset] = [startContainer, startOffset];
  if (offset.end && offset.end != offset.start) {
    [endContainer, endOffset] = biasToLocation(
      root,
      offset.end || offset.start
    )!;
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

export function intervalOfElement(
  root: HTMLElement,
  ...node: ValidNode[]
): Interval {
  const range = document.createRange();
  const left = node[0];
  const right = node[node.length - 1];
  const [startContainer, startOffset] = getValidAdjacent(left, "beforebegin");
  const [endContainer, endOffset] = getValidAdjacent(right, "afterend");
  range.setStart(startContainer, startOffset);
  range.setEnd(endContainer, endOffset);
  return rangeToInterval(root, range);
}

/**
 * 计算节点或节点组的 token 数
 * 如果是节点数组，默认包含每一个节点两侧的 token
 * 如果不是节点数组，默认忽略根节点两侧的 token
 */
export function getTokenSize(
  root: Node | Node[] | DocumentFragment,
  with_root: boolean = false,
  token_filter?: ElementFilter<Node>
): number {
  if (!token_filter) {
    token_filter = isTokenHTMLElement;
  }

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
  if (token_filter(root)) {
    return res;
  }
  for (let i = 0; i < root.childNodes.length; i++) {
    if (isValidNode(root.childNodes[i])) {
      const cur = root.childNodes[i];
      if (isHintHTMLElement(cur)) {
        // <span>**</span>
        continue;
      } else if (token_filter(cur)) {
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

export function setOffset(
  root: HTMLElement,
  offset: Interval,
  defaultOffset?: Interval
) {
  let range = intervalToRange(root, offset);
  if (!range && defaultOffset) {
    range = intervalToRange(root, defaultOffset);
  }
  if (range) {
    setRange(range);
    return;
  }
  throw new Error("set offset error");
}

/**
 * 根据 range 范围，计算范围内 token 数量（可以用于 softline）
 * @param range
 */
export function tokenBetweenRange(range: Range): number {
  const root = range.commonAncestorContainer;
  // rangeToOffset(root, range);
  const left = locationToBias(root, range.startContainer, range.startOffset);
  const right = locationToBias(root, range.endContainer, range.endOffset);

  return right - left;
}

/**
 * 根据当前的相对位置，计算 bias 个 token 之后的相对位置
 * 递归写法，一般层数不算太多（else 里有个 for 循环消耗一整层）
 *  - 可以用于节省 global 级别 block 操作的计算复杂度
 *  - 用于设置 softline
 *
 */
export function offsetAfter(
  container: Node,
  offset: number,
  bias: number
): RefLocation {
  // <p>|<b>|</b></p> [p,0], 1
  if (bias === 0) {
    return validateLocation(container, offset);
  }

  if (container instanceof Text) {
    if (container.textContent!.length - bias - offset > 0) {
      return [container, offset + bias];
    }
    bias -= container.textContent!.length - offset;
    const next = nextValidSibling(container);
    if (next) {
      return offsetAfter(next.parentElement!, indexOfNode(next), bias);
    } else {
      const parent = container.parentElement!;
      return offsetAfter(...getValidAdjacent(parent, "afterend"), bias - 1);
    }
  } else {
    for (let i = offset; i < container.childNodes.length; i++) {
      const child = container.childNodes[i];
      if (isValidNode(child)) {
        const tokenN = getTokenSize(child, true);
        if (bias - tokenN > 0) {
          bias -= tokenN;
        } else if (bias - tokenN === 0) {
          return [container, i + 1];
        } else {
          // bias-tokenN < 0
          if (child instanceof Text) {
            return offsetAfter(child, 0, bias);
          }

          return offsetAfter(child, 0, bias - 1);
        }
      }
    }
    const parent = container.parentElement!;
    return offsetAfter(...getValidAdjacent(parent, "afterend"), bias - 1);
  }
}
