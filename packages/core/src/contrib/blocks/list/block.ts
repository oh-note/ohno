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
  createElement,
  getDefaultRange,
} from "@ohno-editor/core/helper/document";
import {
  indexOfNode,
  parentElementWithTag,
} from "@ohno-editor/core/helper/element";
import {
  BlockSerializedData,
  EditableFlag,
} from "@ohno-editor/core/system/base";
import { Block, BlockInit } from "@ohno-editor/core/system/block";

export interface ListInit extends BlockInit {
  innerHTMLs?: string[];
  // firstLiChildren?: HTMLElement[];
  children?: HTMLLIElement[];
}

export class ABCList<T extends ListInit = ListInit> extends Block<T> {
  getCurrentEditable(): HTMLElement {
    // document.getSelection().focusNode
    const range = getDefaultRange();

    const li = parentElementWithTag(
      range.commonAncestorContainer,
      "li",
      this.root
    );
    if (!li) {
      throw new Error(
        "Error when get currentContainer: focus are not in li element"
      );
    }
    return li;
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

  getLeftEditable(el?: HTMLElement) {
    return el!.previousElementSibling! as HTMLElement;
  }
  getRightEditable(el?: HTMLElement) {
    return el!.nextElementSibling as HTMLElement;
  }
  getAboveEditable(el?: HTMLElement) {
    return this.getLeftEditable(el);
  }
  getBelowEditable(el?: HTMLElement) {
    return this.getRightEditable(el);
  }
  getPrevEditable(el?: HTMLElement | undefined): HTMLElement | null {
    return this.getAboveEditable(el);
  }
  getNextEditable(el?: HTMLElement | undefined): HTMLElement | null {
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

  serialize(option?: any): BlockSerializedData<T> {
    const init = {
      innerHTMLs: Array.from(this.root.querySelectorAll("li")).map(
        (item) => item.innerHTML
      ),
    } as T;
    return [{ type: this.type, init }];
  }
}

export class List extends ABCList {
  isMultiEditable: boolean = true;
  constructor(init?: ListInit) {
    init = init || {};
    if (!init.el) {
      init.el = createElement("ul", {
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
        init!.el!.appendChild(createElement("li", { children: [item] }));
      });
    }
    super("list", init);
  }
}
