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
  indexOfNode,
  parentElementWithTag,
} from "@ohno-editor/core/helper/element";
import {
  BaseBlockSerializer,
  BlockSerializedData,
  Editable,
  EditableFlag,
} from "@ohno-editor/core/system";
import { Block, BlockData } from "@ohno-editor/core/system/block";
import { InlineData } from "@ohno-editor/core/system/inline";

export interface ListData extends BlockData {
  indent?: number[];
  children?: InlineData[];
}

export class ABCList<T extends ListData = ListData> extends Block<T> {
  isMultiEditable: boolean = true;

  render(data: ListData): HTMLElement {
    const root = createElement(this.listType, {
      attributes: {},
    });

    const { children, indent } = data;
    (children || [""]).forEach((item, index) => {
      const child = createElement("li", {
        children: this.deserializeInline(item),
      });
      root.appendChild(child);
      if (indent && indent[index]) {
        this.setIndentLevel(child, indent[index]);
      }
    });
    return root;
  }

  getEditable(flag: EditableFlag): HTMLElement {
    if (typeof flag === "number") {
      if (flag < 0) {
        return this.root.querySelector(
          `li:nth-last-child(${-flag})`
        ) as HTMLElement;
      }
      // selector 从 1 开始，index 从 0 开始
      return this.root.querySelector(
        `li:nth-child(${flag + 1})`
      ) as HTMLElement;
    }

    return flag;
  }
  findEditable(node: Node): HTMLElement | null;
  findEditable(node: Node, raise?: boolean | undefined): HTMLElement;
  findEditable(node: Node, raise?: boolean | undefined): HTMLElement | null {
    let tgt;
    if ((tgt = parentElementWithTag(node, "li", this.root))) {
      return tgt;
    }
    if (raise) {
      throw new Error("editable not found");
    }
    return null;
  }

  getLeftEditable(el?: HTMLElement): Editable | null {
    return el!.previousElementSibling! as HTMLElement;
  }
  getRightEditable(el?: HTMLElement): Editable | null {
    return el!.nextElementSibling as HTMLElement;
  }
  getAboveEditable(el?: HTMLElement): Editable | null {
    return this.getLeftEditable(el);
  }
  getBelowEditable(el?: HTMLElement): Editable | null {
    return this.getRightEditable(el);
  }
  getPrevEditable(el?: HTMLElement | undefined): Editable | null {
    return this.getAboveEditable(el);
  }
  getNextEditable(el?: HTMLElement | undefined): Editable | null {
    return this.getBelowEditable(el);
  }

  getFirstEditable() {
    return this.root.firstElementChild as HTMLElement;
  }
  getLastEditable() {
    return this.root.lastElementChild as HTMLElement;
  }

  getEditables(): HTMLElement[] {
    return Array.from(this.root.querySelectorAll("li"));
  }

  getEditableIndex(container: HTMLElement, reverse?: boolean): number {
    let index = indexOfNode(container, "li");
    if (reverse) {
      index = index - this.root.childNodes.length - 1;
    }
    return index;
  }

  getIndentLevel(el: HTMLElement): number {
    return parseInt(el.dataset["level"] || "0");
  }

  setIndentLevel(el: HTMLLIElement, level: number): HTMLLIElement {
    el.dataset["level"] = level + "";
    const types = this.listStyleTypes;
    Object.assign(el.style, {
      marginLeft: `${level * 20}px`,
      listStyleType: types[level % types.length],
    });
    return el;
  }

  public get listType(): "ul" | "ol" {
    return "ul";
  }

  public get listStyleTypes(): string[] {
    return ["disc", "circle", "square"];
  }

  updateValue() {
    const containers = this.getEditables();
    const lvstack: number[] = [];
    containers.forEach((container) => {
      const level = parseFloat(container.dataset["level"] || "0");
      while (lvstack[level] === undefined) {
        lvstack.push(0);
      }
      while (level < lvstack.length - 1) {
        lvstack.pop();
      }
      lvstack[level]++;
      container.dataset["value"] = lvstack[level] + "";
    });
  }
}

export class List extends ABCList {
  constructor(data?: ListData) {
    data = data || {};
    super("list", data);
  }
}

export class ListSerializer extends BaseBlockSerializer<List> {
  partToMarkdown(block: List, range: Range): string {
    const res = this.rangedEditable(block, range);
    const { startEditable, endEditable } = res;
    // if(res.start){}

    const lines = [];
    if (res.start) {
      const level = block.getIndentLevel(startEditable);
      lines.push(
        "    ".repeat(level) +
          " - " +
          this.serializeInline(res.start, "markdown")
      );
    }
    if (res.full) {
      res.full.forEach((item) => {
        const level = block.getIndentLevel(item);
        const childNodes = Array.from(item.childNodes);
        const line =
          "    ".repeat(level) +
          " - " +
          this.serializeInline(childNodes, "markdown");
        lines.push(line);
      });
    }
    if (res.end) {
      const level = block.getIndentLevel(endEditable);
      lines.push(
        "    ".repeat(level) + " - " + this.serializeInline(res.end, "markdown")
      );
    }

    return lines.join("\n");
  }

  partToJson(block: List, range: Range): BlockSerializedData<ListData> {
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

  toMarkdown(block: List): string {
    return (
      block
        .getEditables()
        .map((item) => {
          const childNodes = Array.from(item.childNodes);
          const level = block.getIndentLevel(item);
          return (
            "    ".repeat(level) +
            " - " +
            this.serializeInline(childNodes, "markdown")
          );
        })
        .join("\n") + "\n"
    );
  }

  toJson(block: List): BlockSerializedData<ListData> {
    return {
      type: block.type,
      data: {
        children: block.getEditables().map((item) => {
          const childNodes = Array.from(item.childNodes);
          return this.serializeInline(childNodes, "json");
        }),
        indent: block.getEditables().map((item) => {
          return block.getIndentLevel(item);
        }),
      },
    };
  }

  deserialize(data: BlockSerializedData<ListData>): List {
    return new List(data.data);
  }
}
