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
import { createElement } from "@/helper/document";
import { BlockInit } from "@/system/block";
import { ABCList } from "../list";

export interface OrderedListInit extends BlockInit {
  innerHTMLs?: string[];

  children?: HTMLLIElement[];
}

export class OrderedList extends ABCList<OrderedListInit> {
  isMultiEditable: boolean = true;
  constructor(init?: OrderedListInit) {
    init = init || {};
    if (!init.el) {
      init.el = createElement("ol", {
        attributes: {},
      });
    }
    const { innerHTMLs, children } = init;

    if (children && innerHTMLs) {
      throw new Error(
        "innerHTMLs or children should assign only one at the same time."
      );
    }

    if (children) {
      children.forEach((item) => {
        if (!(item instanceof HTMLLIElement)) {
          throw new Error(
            `children must be a  <li></li> element list, 
            use firstLiChildren to assign children for first <li> element`
          );
        }
        init!.el!.appendChild(item.cloneNode(true));
      });
    } else {
      innerHTMLs!.forEach((item) => {
        init!.el!.appendChild(createElement("li", { innerHTML: item }));
      });
    }
    super("ordered_list", init);
  }
}
