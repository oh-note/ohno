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
import {
  ChildrenPayload,
  createElement,
} from "@ohno-editor/core/helper/document";
import { BlockInit } from "@ohno-editor/core/system/block";
import { ABCList } from "../list";

export interface OrderedListInit extends BlockInit {
  children?: ChildrenPayload[];
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

    const { children } = init;

    (children || [""]).forEach((item) => {
      const child = createElement("li", {
        children: item,
      });
      init!.el!.appendChild(child);
    });

    super("ordered_list", init);
  }
}
