/**
 * There are four types of token in ohno:
 * 1. plain text token, one char count to 1
 * 2. rich bound token, like <a> or </a>, it is unvisible but can be counted depend on the situation
 * 3. shadow token, like ** in markdown, it is visible but count to zero.
 * 4. label token, all inside content will be ignored, only two rich bound token will be counted up.
 */
import {
  ElementFilter,
  ValidNode,
  createElement,
  createTextNode,
  findCharAfterPosition,
  findCharBeforePosition,
  firstValidChild,
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
  parentElementWithFilter,
  prevValidSibling,
} from "../helper";

export type RefLocation = [Node, number];
export interface Interval {
  start: number;
  end: number;
}
export type WHERE = "afterbegin" | "afterend" | "beforebegin" | "beforeend";
export interface PositionMethods {
  locationToBias(root: Node, loc: RefLocation): number;
  biasToLocation(root: Node, bias: number): RefLocation | null;
  rangeToInterval(root: Node, range: Range): Interval;
  intervalToRange(root: Node, offset: Interval): Range | null;
  intervalOfElement(root: HTMLElement, ...node: Node[]): Interval;

  getTokenSize(root: Node | Node[] | DocumentFragment): number;
  getTokenSize(
    root: Node | Node[] | DocumentFragment,
    with_root: boolean
  ): number;

  tokenBetweenRange(range: Range): number;
  offsetAfter(container: Node, offset: number, bias: number): RefLocation;
}

export interface RangeMethods {
  locationInFirstLine(loc: RefLocation, root: HTMLElement): boolean;
  locationInLastLine(loc: RefLocation, root: HTMLElement): boolean;

  setLocation(loc: RefLocation): void;
  getValidAdjacent(container: Node, where: WHERE, norm?: boolean): RefLocation;
  getPrevLocation(loc: RefLocation, root: HTMLElement): RefLocation | null;
  getNextLocation(loc: RefLocation, root: HTMLElement): RefLocation | null;
  getPrevWordLocation(loc: RefLocation, root: HTMLElement): RefLocation | null;
  getNextWordLocation(loc: RefLocation, root: HTMLElement): RefLocation | null;
  getSoftLineHeadLocation(loc: RefLocation, root: HTMLElement): RefLocation;
  getSoftLineTailLocation(loc: RefLocation, root: HTMLElement): RefLocation;
  compareLocation(loca: RefLocation, locb: RefLocation): number;
  compareLocationV2(
    loca: RefLocation,
    locb: RefLocation,
    want: "left" | "right"
  ): boolean;
  makeRangeInNode(node: Node, range?: Range): Range;

  createRange(
    startContainer?: Node,
    startOffset?: number,
    endContainer?: Node,
    endOffset?: number
  ): Range;
  setRange(range: Range): void;
  clipRange(node: Node, range: Range): Range | null;
  getRects(range: Range): [DOMRect[], DOMRect];
  inSameLine(a: DOMRect, b: DOMRect): boolean;
}

export interface SelectionMethods extends RangeMethods, PositionMethods {
  C_RICH: number;
  C_RICHPAIR: number;
  token_filter?: ElementFilter;
  hint_filter?: ElementFilter;
}

export class RichSelection implements SelectionMethods {
  C_RICH: number = 1;
  C_RICHPAIR: number = 2;
  token_filter: ElementFilter = isTokenHTMLElement;
  hint_filter: ElementFilter = isHintHTMLElement;
  createRange(
    startContainer?: Node | undefined,
    startOffset?: number | undefined,
    endContainer?: Node | undefined,
    endOffset?: number | undefined
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
  locationInFirstLine(loc: RefLocation, root: HTMLElement): boolean {
    if (root.childNodes.length === 0) {
      return true;
    }
    const [container, offset] = loc;
    const range = this.createRange(container, offset);
    const [second, _] = this.getRects(range);
    const test = createElement("span", {
      textContent: "|",
    });
    root.insertBefore(test, root.firstChild);
    const first = test.getClientRects();
    test.remove();
    return this.inSameLine(first[0], second[0]);
  }
  locationInLastLine(loc: RefLocation, root: HTMLElement): boolean {
    if (root.childNodes.length === 0) {
      return true;
    }
    const [container, offset] = loc;
    const range = this.createRange(container, offset);
    const test = createElement("span", {
      textContent: "|",
    });
    root.appendChild(test);
    const first = test.getClientRects();

    const [second, _] = this.getRects(range);
    test.remove();
    return this.inSameLine(first[0], second[0]);
  }

  getValidAdjacent(
    container: Node,
    where: WHERE,
    norm: boolean = true
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
      if (
        where === "afterend" &&
        container instanceof Element &&
        !container.nextElementSibling
      ) {
        return this.getValidAdjacent(container.parentElement!, "afterend");
      }
      if (
        where === "beforebegin" &&
        container instanceof Element &&
        !container.previousElementSibling
      ) {
        return this.getValidAdjacent(container.parentElement!, "beforebegin");
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
      if (this.token_filter(container)) {
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
      if (this.token_filter(container)) {
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
  protected _getPrevLocation(
    container: Node,
    offset: number
  ): RefLocation | null {
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
        return this.getValidAdjacent(neighbor, "beforeend");
      } else {
        const parent = container.parentElement!;
        if (parent) {
          // ?<b>|text</b>
          return this.getValidAdjacent(parent, "beforebegin");
        } else {
          // "text|"
          return null;
        }
      }
    }

    if (isTokenHTMLElement(container)) {
      // <label>|</label>
      return this.getValidAdjacent(container as HTMLElement, "beforebegin");
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
          return this.getValidAdjacent(containerChild, "beforeend");
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
            return this.getValidAdjacent(neighborChild, "beforeend");
          }
        }
        // <i>"|"<b></b></i>
        return this.getValidAdjacent(container as HTMLElement, "beforebegin");
      }
    } else {
      // ?<b>|</b>
      return this.getValidAdjacent(container as HTMLElement, "beforebegin");
    }
  }
  getPrevLocation(loc: RefLocation, root?: HTMLElement): RefLocation | null {
    const [container, offset] = loc;
    const result = this._getPrevLocation(container, offset);
    if (!result) {
      return result;
    }
    const [tgt, _] = result;
    if (root && !isParent(tgt, root)) {
      return null;
    }
    return result;
  }

  protected _getNextLocation(
    container: Node,
    offset: number
  ): RefLocation | null {
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
        return this.getValidAdjacent(neighbor, "afterbegin");
      } else {
        const parent = container.parentElement!;
        if (parent) {
          // <b>text|</b>?
          return this.getValidAdjacent(parent, "afterend");
        } else {
          // "text|"
          return null;
        }
      }
    }

    if (isTokenHTMLElement(container)) {
      // <label>|</label>
      return this.getValidAdjacent(container as HTMLElement, "afterend");
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
          return this.getValidAdjacent(
            containerChild as HTMLElement,
            "afterbegin"
          );
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
            return this.getValidAdjacent(neighborChild, "afterbegin");
          }
        }
        // <i><b></b>"|"</i>
        return this.getValidAdjacent(container as HTMLElement, "afterend");
      }
    } else {
      // <b>|</b>?
      return this.getValidAdjacent(container as HTMLElement, "afterend");
    }
  }

  getNextLocation(loc: RefLocation, root?: HTMLElement): RefLocation | null {
    const [container, offset] = loc;
    const result = this._getNextLocation(container, offset);
    if (!result) {
      return result;
    }
    const [tgt, _] = result;
    if (root && !isParent(tgt, root)) {
      return null;
    }
    return result;
  }

  protected _checkLocation(
    res: RefLocation | null,
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
  getPrevWordLocation(loc: RefLocation, root: HTMLElement): RefLocation | null {
    // let cur = container;
    let [cur, curOffset] = loc;
    while (isTextNode(cur) && curOffset > 0) {
      const res = findCharBeforePosition(cur.textContent!, " ", curOffset);
      if (res >= 0) {
        return this._checkLocation([cur, res], root);
      }
      // container = cur;
      const prev = prevValidSibling(cur, isEntityNode) as Node;
      if (isTextNode(prev)) {
        curOffset = prev.textContent!.length;
        cur = prev;
      } else {
        // 前一个 container 不存在或者不是字符串，但当前仍然是字符串，
        // 且 offset > 0，所以，直接置到最左
        return this._checkLocation([cur, 0], root);
      }
    }
    return this._checkLocation(this._getPrevLocation(cur, curOffset), root)!;
  }
  getNextWordLocation(loc: RefLocation, root: HTMLElement): RefLocation | null {
    let [cur, curOffset] = loc;
    while (isTextNode(cur)) {
      const res = findCharAfterPosition(cur.textContent!, " ", curOffset);
      if (res >= 0) {
        return this._checkLocation([cur, res + curOffset + 1], root);
      }

      const next = nextValidSibling(cur, isEntityNode) as Node;
      if (isTextNode(next)) {
        curOffset = 0;
        cur = next;
      } else if (curOffset != cur.textContent?.length) {
        /**
         * 因为 while 循环的条件没有 offset，
         * 所以需要额外判断当前的 offset 是否已经到了当前 textContent 的最右侧
         * 如果没有，则置最右，否则按 nextRange 的逻辑走
         */
        return this._checkLocation([cur, cur.textContent!.length], root);
      } else {
        break;
      }
    }
    return this._checkLocation(this._getNextLocation(cur, curOffset), root)!;
  }
  setLocation(loc: RefLocation): void {
    const range = this.createRange(...loc);
    this.setRange(range);
  }
  setRange(range: Range): void {
    if (!range) {
      throw new NoRangeError();
    }
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
  }
  getSoftLineHeadLocation(loc: RefLocation, root: HTMLElement): RefLocation {
    let [container, offset] = loc;
    let pointRange = this.createRange(container, offset);
    const [rects, rect] = this.getRects(pointRange);
    // 在初始的时候就判断一下
    // const diffLines = diffLineRects(rects);
    if (rects.length > 1 && this.inSameLine(rects[0], rect)) {
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
        const res = this.getPrevLocation([container, offset], root);
        if (!res) {
          return [container, offset];
        }
        const [prevContainer, prevOffset] = res;
        if (!isParent(prevContainer, root)) {
          return [container, offset];
        }
        const prevRange = this.createRange(prevContainer, prevOffset);
        const [prevRects, prevRect] = this.getRects(prevRange);
        if (!this.inSameLine(prevRect, rect)) {
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
        if (this.inSameLine(rects[0], rect)) {
          // 123|
          // 456
          // 遍历到行首
          const res = this.getPrevLocation([container, offset], root);
          if (res) {
            [container, offset] = res;
          } else {
            return [container, offset];
          }
          pointRange = this.createRange(container, offset);
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
  getSoftLineTailLocation(loc: RefLocation, root: HTMLElement): RefLocation {
    let [container, offset] = loc;
    let pointRange = this.createRange(container, offset);
    const [rects, rect] = this.getRects(pointRange);
    // 在初始的时候就判断一下
    let c = 0;
    for (; c < 500; c++) {
      // debugger;
      if (rects.length === 0) {
        throw new Error("sanity check");
      } else if (rects.length === 1) {
        // softline 一定是已经附在 document 上，所以不会出现 null 的结果
        const res = this.getNextLocation([container, offset], root);
        if (!res) {
          return [container, offset];
        }
        const [nextContainer, nextOffset] = res;
        if (!isParent(nextContainer, root)) {
          return [container, offset];
        }
        const nextRange = this.createRange(nextContainer, nextOffset);
        const [_, nextRect] = this.getRects(nextRange);
        if (!this.inSameLine(nextRect, rect)) {
          return [container, offset];
        }

        pointRange = nextRange;
        [container, offset] = [nextContainer, nextOffset];
        // rects = nextRects;
        // rect = nextRect;
      } else {
        if (this.inSameLine(rects[0], rect)) {
          // 123|
          // 456
          // 遍历到行首
          const res = this.getNextLocation([container, offset], root);
          if (res) {
            [container, offset] = res;
          } else {
            return [container, offset];
          }
          pointRange = this.createRange(container, offset);
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
  clipRange(node: Node, range: Range): Range | null {
    if (isParent(range.commonAncestorContainer, node)) {
      return range;
    }
    if (isParent(node, range.commonAncestorContainer)) {
      const newRange = range.cloneRange();
      if (!isParent(range.startContainer, node)) {
        newRange.setStart(...this.getValidAdjacent(node, "afterbegin")!);
      }
      if (!isParent(range.endContainer, node)) {
        newRange.setEnd(...this.getValidAdjacent(node, "beforeend")!);
      }
      return newRange;
    }
    // 互相独立无重叠
    return null;
  }
  compareLocation(a: RefLocation, b: RefLocation): number {
    if (a[0] === b[0] && a[1] === b[1]) {
      return 0;
    }
    const range = this.createRange(...a, ...b);
    if (range.collapsed) {
      // a > b
      return -1;
    } else {
      // a < b
      return 1;
    }
  }
  compareLocationV2(
    loca: RefLocation,
    locb: RefLocation,
    cmp: "left" | "right"
  ): boolean {
    if (cmp === "left") {
      return this.compareLocation(loca, locb) === 1;
    }
    return this.compareLocation(loca, locb) === -1;
  }
  makeRangeInNode(node: Element, range?: Range | undefined): Range {
    if (!range) {
      range = this.createRange();
    }

    if (!isParent(range.commonAncestorContainer, node)) {
      range.setStart(...this.getValidAdjacent(node, "afterbegin"));
      range.setEnd(...this.getValidAdjacent(node, "afterbegin"));
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
      range.setStart(...this.getValidAdjacent(node, where));
      range.setEnd(...this.getValidAdjacent(node, where));
    }

    return range;
  }

  locationToBias(root: Node, loc: RefLocation): number {
    const [container, offset] = loc;
    let size = 0;
    let cur: Node | null = container;
    let curSize: number;

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
          curSize = this.getTokenSize(cur);
        } else if (this.token_filter(cur)) {
          // <b><label>...</label>|</b>
          curSize = this.C_RICHPAIR;
        } else {
          // <b><i>...</i>|</b>
          curSize = this.getTokenSize(cur, false) + this.C_RICHPAIR;
        }
      } else {
        // <b>|</b> -> 相当于跳出去，从 |<b></b> 开始遍历
        cur = container;
        curSize = this.C_RICH;
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
          size += this.C_RICH;
          prev = prevValidSibling(parent);
        } else {
          break;
        }
      }

      cur = prev;
      if (cur) {
        if (isTextNode(cur)) {
          curSize = this.getTokenSize(cur);
        } else if (this.token_filter(cur)) {
          curSize = this.C_RICHPAIR;
        } else {
          curSize = this.getTokenSize(cur, false) + this.C_RICHPAIR;
        }
      }
    }
    return size;
  }
  biasToLocation(root: Node, bias: number): RefLocation | null {
    if (bias === -1) {
      return this.getValidAdjacent(root, "beforeend");
    }

    if (bias < 0) {
      bias += this.getTokenSize(root) + 1;
      if (bias < 0) {
        return null;
      }
    }

    if (bias === 0) {
      return this.getValidAdjacent(root, "afterbegin");
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
      const tokenN = this.getTokenSize(cur);
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
        (isHTMLElement(cur) && tokenN + delta + this.C_RICHPAIR === bias) ||
        (isTextNode(cur) && tokenN + delta === bias)
      ) {
        //   a b c <b> d </b>|
        //   a b c  abc|
        return this.getValidAdjacent(cur, "afterend");
      } else if (isHTMLElement(cur) && tokenN + delta + this.C_RICH < bias) {
        //   a b c <b> d </b>
        //  0 1 2 3   4 5    6
        //              ↑
        // 5: -3-  -1--1-
        cur = nextValidSibling(cur)!;
        delta += this.C_RICHPAIR + tokenN;
      } else {
        if (isTextNode(cur)) {
          return [cur, bias - delta];
        } else if (this.token_filter(cur as HTMLElement)) {
          return [cur, 0];
        } else {
          return this.biasToLocation(
            cur as HTMLElement,
            bias - delta - this.C_RICH
          );
        }
      }
    }
    return null;
  }
  rangeToInterval(root: Node, range: Range): Interval {
    const start = this.locationToBias(root, [
      range.startContainer,
      range.startOffset,
    ]);
    let end;
    if (
      range.startContainer != range.endContainer ||
      range.startOffset != range.endOffset
    ) {
      end = this.locationToBias(root, [range.endContainer, range.endOffset]);
    } else {
      end = start;
    }
    return { start, end };
  }
  intervalToRange(root: Node, offset: Interval): Range | null {
    const range = document.createRange();

    const rootSize = this.getTokenSize(root);
    if (offset.start > rootSize) {
      return null;
    }

    let [startContainer, startOffset] = this.biasToLocation(
      root,
      offset.start
    )!;
    let [endContainer, endOffset] = [startContainer, startOffset];
    if (offset.end && offset.end != offset.start) {
      [endContainer, endOffset] = this.biasToLocation(
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
  intervalOfElement(root: HTMLElement, ...node: Node[]): Interval {
    const range = document.createRange();
    const left = node[0];
    const right = node[node.length - 1];
    const [startContainer, startOffset] = this.getValidAdjacent(
      left,
      "beforebegin"
    );
    const [endContainer, endOffset] = this.getValidAdjacent(right, "afterend");
    range.setStart(startContainer, startOffset);
    range.setEnd(endContainer, endOffset);
    return this.rangeToInterval(root, range);
  }
  getTokenSize(root: Node | Node[] | DocumentFragment): number;
  getTokenSize(
    root: Node | Node[] | DocumentFragment,
    with_root?: boolean
  ): number;
  getTokenSize(
    root: Node | Node[] | DocumentFragment,
    with_root?: boolean
  ): number {
    let res = 0;
    if (Array.isArray(root)) {
      root.forEach((item) => {
        res += this.getTokenSize(item, true);
      });
      return res;
    }
    if (isTextNode(root)) {
      return root.textContent!.length;
    }
    if (with_root) {
      res += this.C_RICHPAIR;
    }
    if (this.token_filter(root)) {
      return res;
    }
    for (let i = 0; i < root.childNodes.length; i++) {
      if (isValidNode(root.childNodes[i])) {
        const cur = root.childNodes[i];
        if (isHintHTMLElement(cur)) {
          // <span>**</span>
          continue;
        } else if (this.token_filter(cur)) {
          // <label>...</label>
          // <label></label>
          // ↑      ↑       ↑
          res += this.C_RICHPAIR;
        } else if (isHTMLElement(cur)) {
          // <b>...</b>
          // <b>....</b>
          // ↑  ↑--↑    ↑
          //   recursive
          res += this.getTokenSize(cur) + this.C_RICHPAIR;
        } else if (isTextNode(cur)) {
          // text
          res += cur.textContent!.length;
        }
      }
    }
    return res;
  }

  tokenBetweenRange(range: Range): number {
    const root = range.commonAncestorContainer;
    // rangeToOffset(root, range);
    const left = this.locationToBias(root, [
      range.startContainer,
      range.startOffset,
    ]);
    const right = this.locationToBias(root, [
      range.endContainer,
      range.endOffset,
    ]);

    return right - left;
  }

  validateLocation(loc: RefLocation): RefLocation {
    const [container, offset] = loc;
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

  offsetAfter(container: Node, offset: number, bias: number): RefLocation {
    if (bias === 0) {
      return this.validateLocation([container, offset]);
    }

    if (container instanceof Text) {
      if (container.textContent!.length - bias - offset > 0) {
        return [container, offset + bias];
      }
      bias -= container.textContent!.length - offset;
      const next = nextValidSibling(container);
      if (next) {
        return this.offsetAfter(next.parentElement!, indexOfNode(next), bias);
      } else {
        const parent = container.parentElement!;
        return this.offsetAfter(
          ...this.getValidAdjacent(parent, "afterend"),
          bias - 1
        );
      }
    } else {
      for (let i = offset; i < container.childNodes.length; i++) {
        const child = container.childNodes[i];
        if (isValidNode(child)) {
          const tokenN = this.getTokenSize(child, true);
          if (bias - tokenN > 0) {
            bias -= tokenN;
          } else if (bias - tokenN === 0) {
            return [container, i + 1];
          } else {
            // bias-tokenN < 0
            if (child instanceof Text) {
              return this.offsetAfter(child, 0, bias);
            }

            return this.offsetAfter(child, 0, bias - 1);
          }
        }
      }
      const parent = container.parentElement!;
      return this.offsetAfter(
        ...this.getValidAdjacent(parent, "afterend"),
        bias - 1
      );
    }
  }

  protected _diffLineRects(rect: DOMRectList): DOMRect[] {
    const res: DOMRect[] = [];
    for (let i = 0; i < rect.length; i++) {
      let flag = true;
      for (let j = 0; j < res.length; j++) {
        if (this.inSameLine(res[j], rect[i])) {
          flag = false;
        }
      }
      if (flag) {
        res.push(rect[i]);
      }
    }

    return res;
  }
  getRects(range: Range): [DOMRect[], DOMRect] {
    let rects = range.getClientRects();
    let rect = range.getBoundingClientRect();

    const nextLoc = this._getNextLocation(
      range.startContainer,
      range.startOffset
    );
    if (nextLoc) {
      range.setEnd(...nextLoc);
      rects = range.getClientRects();
      rect = range.getBoundingClientRect();
      range.collapse(true);
    }

    if (
      rects.length === 0 ||
      (range.startContainer instanceof Text &&
        range.startContainer.textContent?.length === 0)
    ) {
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
    return [this._diffLineRects(rects), rect];
  }
  inSameLine(a: DOMRect, b: DOMRect): boolean {
    // 判断 a 和 b 的顶部、底部是否在同一条竖直线上
    return (
      (a.top <= b.top && a.bottom >= b.top) ||
      (b.top <= a.top && b.bottom >= a.top)
    );
  }
}

/** Assume area in PlainSelection do not have label token, all prev/next function will ignore rich bound token */
export class PlainSelection extends RichSelection {
  C_RICH: number = 0;
  C_RICHPAIR: number = 0;

  protected _getPlainPrevLocation(
    container: Node,
    offset: number,
    root: Node
  ): RefLocation | null {
    if (!isParent(container, root)) {
      return null;
    }
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
        return this._getPrevLocation(
          ...this.getValidAdjacent(neighbor, "beforeend")
        );
      } else {
        const parent = container.parentElement!;
        if (parent) {
          // ?<b>|text</b>
          return this._getPrevLocation(
            ...this.getValidAdjacent(parent, "beforebegin")
          );
        } else {
          // "text|"
          return null;
        }
      }
    }

    if (isTokenHTMLElement(container)) {
      // <label>|</label>
      throw new Error("Plain editable can not have Label Token");
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
          throw new Error("Plain editable can not have Label Token");
        } else {
          // <b></b><i></i>\
          return this._getPrevLocation(
            ...this.getValidAdjacent(containerChild, "beforeend")
          );
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
            return this._getPrevLocation(
              ...this.getValidAdjacent(neighborChild, "beforeend")
            );
          }
        }
        // <i>"|"<b></b></i>
        return this._getPrevLocation(
          ...this.getValidAdjacent(container as HTMLElement, "beforebegin")
        );
      }
    } else {
      // ?<b>|</b>
      return this._getPrevLocation(
        ...this.getValidAdjacent(container as HTMLElement, "beforebegin")
      );
    }
  }
  protected _getPlainNextLocation(
    container: Node,
    offset: number,
    root: Node
  ): RefLocation | null {
    if (!isParent(container, root)) {
      return null;
    }
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
        return this._getNextLocation(
          ...this.getValidAdjacent(neighbor, "afterbegin")
        );
      } else {
        const parent = container.parentElement!;
        if (parent) {
          // <b>text|</b>?
          return this._getNextLocation(
            ...this.getValidAdjacent(parent, "afterend")
          );
        } else {
          // "text|"
          return null;
        }
      }
    }

    if (isTokenHTMLElement(container)) {
      // <label>|</label>
      throw new Error("Plain editable can not have Label Token");
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
          return this._getNextLocation(
            ...this.getValidAdjacent(containerChild, "afterbegin")
          );
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
            return this._getNextLocation(
              ...this.getValidAdjacent(neighborChild, "afterbegin")
            );
          }
        }
        // <i><b></b>"|"</i>
        return this._getNextLocation(
          ...this.getValidAdjacent(container, "afterend")
        );
      }
    } else {
      // <b>|</b>?
      return this._getNextLocation(
        ...this.getValidAdjacent(container as HTMLElement, "afterend")
      );
    }
  }

  getPrevLocation(loc: RefLocation, root: HTMLElement): RefLocation | null {
    const [container, offset] = loc;
    const result = this._getPlainPrevLocation(container, offset, root);
    if (!result) {
      return result;
    }
    const [tgt, _] = result;
    if (root && !isParent(tgt, root)) {
      return null;
    }
    return result;
  }
  getNextLocation(loc: RefLocation, root: HTMLElement): RefLocation | null {
    const [container, offset] = loc;
    const result = this._getPlainNextLocation(container, offset, root);
    if (!result) {
      return result;
    }
    const [tgt, _] = result;
    if (root && !isParent(tgt, root)) {
      return null;
    }
    return result;
  }
}

export const defaultSelection = new RichSelection();
