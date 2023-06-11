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
  ChildrenData,
  createElement,
  getDefaultRange,
} from "@ohno-editor/core/helper/document";
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

export interface ListData extends BlockData {
  indent?: number[];
  children?: ChildrenData[];
}

export class ABCList<T extends ListData = ListData> extends Block<T> {
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
  isMultiEditable: boolean = true;
  constructor(data?: ListData) {
    data = data || {};
    const root = createElement("ul", {
      attributes: {},
    });

    const { children } = data;

    (children || [""]).forEach((item) => {
      const child = createElement("li", {
        children: item,
      });
      root.appendChild(child);
    });

    super("list", root);
  }
}

export class ListSerializer extends BaseBlockSerializer<List> {
  toMarkdown(block: List): string {
    return (
      block
        .getEditables()
        .map((item) => {
          return " - " + item.textContent;
        })
        .join("/n") + "\n"
    );
  }
  toHTML(block: List): string {
    return this.outerHTML(block.root);
  }
  toJson(block: List): BlockSerializedData<ListData> {
    return {
      type: block.type,
      data: {
        children: block.getEditables().map((item) => {
          return item.innerHTML;
        }),
      },
    };
  }

  deserialize(data: BlockSerializedData<ListData>): List {
    return new List(data.data);
  }
}
