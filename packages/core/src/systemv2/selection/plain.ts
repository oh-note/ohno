/**
 * There are four types of token in ohno:
 * 1. plain text token, one char count to 1
 * 2. rich bound token, like <a> or </a>, it is unvisible but can be counted depend on the situation
 * 3. shadow token, like ** in markdown, it is visible but count to zero.
 * 4. label token, all inside content will be ignored, only two rich bound token will be counted up.
 */
import {
  findCharAfter,
  isEntityNode,
  isParent,
  isTextNode,
  isTokenHTMLElement,
  lastValidChild,
  nextValidSibling,
  prevValidSibling,
} from "@ohno-editor/core/helper";
import { RefLocation } from "../types";
import { RichSelection } from "./rich";

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
  getNextWordLocation(loc: RefLocation, root: HTMLElement): RefLocation | null {
    let [cur, curOffset] = loc;
    while (isTextNode(cur)) {
      const res = findCharAfter(cur.textContent!, " ", curOffset);
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
}
