/**
 * 对 List 的各种功能键的操作包括：
 *
 * Enter：
 *  - 在当前 li 内有文本时新建 -> TextDelete -> TextInsert
 *  - 在当前 li 没有文本时候降级，再退回 p -> TextDelete -> TextInsert/BlockCreate
 *
 * Tab:
 *  - 永远都是升级，最大三级 -> SetAttribute
 *
 * Delete：
 *  - 从下一个 Container 或下一个 Block 合并值 -> BlockRemove -> TextDelete
 *
 * BackSpace：
 *  - 先降级，再退回 p，可能有分隔 li -> For
 *
 */
import { createElement, getDefaultRange } from "@/helper/document";
import { Block, BlockInit } from "@/system/block";
import { List, ListInit } from "../list";

export class OrderedList extends List {
  type: string = "ordered_list";
  isMultiEditable: boolean = true;
  constructor(init?: ListInit) {
    init = init || {};
    if (!init.el) {
      init.el = createElement("ol", {
        attributes: {},
      });
    }
    let { children } = init;
    if (!children) {
      children = [createElement("li")];
    }

    // Sanity check
    children.forEach((item) => {
      if (!(item instanceof HTMLLIElement)) {
        throw new Error(
          `children must be a  <li></li> element list, 
          use firstLiChildren to assign children for first <li> element`
        );
      }
      init!.el!.appendChild(item.cloneNode(true));
    });

    const firstChild = init.el!.firstElementChild as HTMLElement;
    if (init.firstLiInnerHTML) {
      firstChild.innerHTML = init.firstLiInnerHTML;
    }
    if (init.firstLiChildren) {
      init.firstLiChildren.forEach((item) => {
        if (item) {
          firstChild.appendChild(item.cloneNode(true));
        }
      });
    }

    super(init);
  }
}
