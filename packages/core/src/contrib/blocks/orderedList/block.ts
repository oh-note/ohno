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
import { ChildrenData, createElement } from "@ohno-editor/core/helper/document";
import {
  BaseBlockSerializer,
  BlockData,
  BlockSerializedData,
} from "@ohno-editor/core/system/block";
import { ABCList } from "../list";

export interface OrderedListData extends BlockData {
  children?: ChildrenData[];
}

export class OrderedList extends ABCList<OrderedListData> {
  isMultiEditable: boolean = true;
  constructor(init?: OrderedListData) {
    init = init || {};
    const root = createElement("ol", {
      attributes: {},
    });

    const { children } = init;

    (children || [""]).forEach((item) => {
      const child = createElement("li", {
        children: item,
      });
      root.appendChild(child);
    });

    super("ordered_list", root);
  }

  public get listStyleTypes(): string[] {
    return ["decimal", "lower-alpha", "lower-roman"];
  }
}

export class OrderedListSerializer extends BaseBlockSerializer<OrderedList> {
  toMarkdown(block: OrderedList): string {
    return (
      block
        .getEditables()
        .map((item) => {
          return " - " + item.textContent;
        })
        .join("/n") + "\n"
    );
  }

  toHTML(block: OrderedList): string {
    return this.outerHTML(block.root);
  }

  toJson(block: OrderedList): BlockSerializedData<OrderedListData> {
    return {
      type: block.type,
      data: {
        children: block.getEditables().map((item) => {
          return item.innerHTML;
        }),
      },
    };
  }

  deserialize(data: BlockSerializedData<OrderedListData>): OrderedList {
    return new OrderedList(data.data);
  }
}
