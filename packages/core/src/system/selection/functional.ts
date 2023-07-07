import {
  firstValidChild,
  getTagName,
  indexOfNode,
  isEntityNode,
  isParent,
  lastValidChild,
  nextValidSibling,
  parentElementWithFilter,
  prevValidSibling,
  createElement,
  createTextNode,
} from "../functional";

import { ValidNode, ElementFilter, Interval, RefLocation } from "../types";
import {
  isHintHTMLElement,
  isHintRight,
  isValidNode,
  isHTMLElement,
  isTextNode,
  isTokenHTMLElement,
} from "../status";
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

export function getBiasFromLocation(
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
        return getBiasFromLocation(
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
export function getRangeFromInterval(
  root: HTMLElement,
  range: Range
): Interval {
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
export function getIntervalFromRange(
  root: ValidNode,
  offset: Interval
): Range | null {
  const range = document.createRange();

  const rootSize = getTokenSize(root);
  if (offset.start > rootSize) {
    return null;
  }

  let [startContainer, startOffset] = getBiasFromLocation(root, offset.start)!;
  let [endContainer, endOffset] = [startContainer, startOffset];
  if (offset.end && offset.end != offset.start) {
    [endContainer, endOffset] = getBiasFromLocation(
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

export function getIntervalOfNodes(
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
  return getRangeFromInterval(root, range);
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

/**
 * 根据 range 范围，计算范围内 token 数量（可以用于 softline）
 * @param range
 */
export function getTokenNumberInRange(range: Range): number {
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
export function locationAfterOffset(
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
      return locationAfterOffset(next.parentElement!, indexOfNode(next), bias);
    } else {
      const parent = container.parentElement!;
      return locationAfterOffset(
        ...getValidAdjacent(parent, "afterend"),
        bias - 1
      );
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
            return locationAfterOffset(child, 0, bias);
          }

          return locationAfterOffset(child, 0, bias - 1);
        }
      }
    }
    const parent = container.parentElement!;
    return locationAfterOffset(
      ...getValidAdjacent(parent, "afterend"),
      bias - 1
    );
  }
}

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

// export function normalizeContainer(
//   root: HTMLElement,
//   container: Node,
//   offset: number,
//   direction: "left" | "right"
// ): RefLocation {
//   const tgt = parentElementWithFilter(container, root, (el: Node) => {
//     const tagName = getTagName(el);
//     if (tagName === "label" || isHintHTMLElement(el)) {
//       return true;
//     }
//     return false;
//   });

//   if (tgt) {
//     return getValidAdjacent(
//       tgt,
//       direction === "left" ? "beforebegin" : "afterend"
//     );
//   }
//   if (container instanceof HTMLElement) {
//     if (!container.childNodes[offset]) {
//       const flag = createTextNode("");
//       container.appendChild(flag);
//       return [flag, 0];
//     }
//     if (container.childNodes[offset] instanceof Text) {
//       return [container.childNodes[offset], 0];
//     }
//     if (getTagName(container.childNodes[offset]) === "span") {
//       const flag = createTextNode("");
//       container.insertBefore(flag, container.childNodes[offset]);
//       return [flag, 0];
//     }
//   }

//   return [container, offset];
// }

// /**
//  * 跳出 label 和 span 的范围，同时如果是 span 的边界（<b><span></span>|</b>），还要跳出富文本范围
//  * @param root
//  * @param range
//  */
// export function normalizeRange(root: HTMLElement, range: Range) {
//   const [startContainer, startOffset] = normalizeContainer(
//     root,
//     range.startContainer,
//     range.startOffset,
//     "left"
//   );
//   const [endContainer, endOffset] = normalizeContainer(
//     root,
//     range.endContainer,
//     range.endOffset,
//     "right"
//   );
//   range.setStart(startContainer, startOffset);
//   range.setEnd(endContainer, endOffset);
// }

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
  let left;
  left = father(range.startContainer, range.startOffset);
  const right = father(range.endContainer, range.endOffset);

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
      newRange.setStart(...getBiasFromLocation(node, 0)!);
    }
    if (!isParent(range.endContainer, node)) {
      newRange.setEnd(...getBiasFromLocation(node, 0)!);
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

export function getDefaultRange(): Range {
  const sel = document.getSelection();
  if (sel && sel.rangeCount > 0) {
    return sel.getRangeAt(0);
  }

  throw new NoRangeError();
}

export function tryGetDefaultRange(): Range | undefined {
  const sel = document.getSelection();
  if (sel && sel.rangeCount > 0) {
    return sel.getRangeAt(0);
  }

  return undefined;
}
