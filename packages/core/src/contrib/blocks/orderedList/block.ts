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
import { ListData } from "../list/block";

export class OrderedList extends ABCList {
  constructor(data?: ListData) {
    data = data || {};
    super("ordered_list", data);
  }
  public get listType(): "ul" | "ol" {
    return "ol";
  }
  public get listStyleTypes(): string[] {
    return ["decimal", "lower-alpha", "lower-roman"];
  }
}

export class OrderedListSerializer extends BaseBlockSerializer<OrderedList> {
  partToMarkdown(block: OrderedList, range: Range): string {
    const res = this.rangedEditable(block, range);
    const { startEditable, endEditable } = res;
    // if(res.start){}
    let counter = 1;
    const lines = [];
    if (res.start) {
      const level = block.getIndentLevel(startEditable);
      lines.push(
        "    ".repeat(level) +
          ` ${counter++}. ` +
          this.serializeInline(res.start, "markdown")
      );
    }
    if (res.full) {
      res.full.forEach((item) => {
        const level = block.getIndentLevel(item);
        const childNodes = Array.from(item.childNodes);
        const line =
          "    ".repeat(level) +
          ` ${counter++}. ` +
          this.serializeInline(childNodes, "markdown");
        lines.push(line);
      });
    }

    if (res.end) {
      const level = block.getIndentLevel(endEditable);
      lines.push(
        "    ".repeat(level) +
          ` ${counter++}. ` +
          this.serializeInline(res.end, "markdown")
      );
    }

    return lines.join("\n");
  }

  partToJson(block: OrderedList, range: Range): BlockSerializedData<ListData> {
    const res = this.rangedEditable(block, range);
    const custom = [];
    if (res.start) {
      custom.push(res.startEditable);
    }
    if (res.full) {
      custom.push(...res.full);
    }
    if (res.end) {
      custom.push(res.endEditable);
    }
    const listItems = custom.map((item) => {
      let children;
      if (item === res.startEditable && res.start) {
        children = this.serializeInline(res.start, "json");
      } else if (item === res.endEditable && res.end) {
        children = this.serializeInline(res.end, "json");
      } else {
        const childNodes = Array.from(item.childNodes);
        children = this.serializeInline(childNodes, "json");
      }
      const indent = block.getIndentLevel(item);
      return { children, indent };
    });

    return {
      type: block.type,
      data: {
        children: listItems.map((item) => item.children),
        indent: listItems.map((item) => item.indent),
      },
    };
  }

  toMarkdown(block: OrderedList): string {
    return (
      block
        .getEditables()
        .map((item, index) => {
          const childNodes = Array.from(item.childNodes);
          const level = block.getIndentLevel(item);
          return (
            "    ".repeat(level) +
            ` ${index + 1}. ` +
            this.serializeInline(childNodes, "markdown")
          );
        })
        .join("\n") + "\n"
    );
  }

  toJson(block: OrderedList): BlockSerializedData<ListData> {
    return {
      type: block.type,
      data: {
        children: block.getEditables().map((item) => {
          return item.innerHTML;
        }),
        indent: block.getEditables().map((item) => {
          return block.getIndentLevel(item);
        }),
      },
    };
  }

  deserialize(data: BlockSerializedData<ListData>): OrderedList {
    return new OrderedList(data.data);
  }
}
