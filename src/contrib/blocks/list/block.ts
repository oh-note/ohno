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
import { createElement, getDefaultRange } from "@helper/document";
import { indexOfNode, parentElementWithTag } from "@helper/element";
import { Block, BlockInit } from "@system/block";

export interface ListInit extends BlockInit {
  firstLiInnerHTML?: string;
  firstLiChildren?: HTMLElement[];
  children?: HTMLLIElement[];
}

export class List extends Block<ListInit> {
  type: string = "list";
  multiContainer: boolean = true;
  constructor(init?: ListInit) {
    init = init || {};
    if (!init.el) {
      init.el = createElement("ul", {
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
    console.log(init);
    if (init.firstLiChildren) {
      init.firstLiChildren.forEach((item) => {
        if (item) {
          firstChild.appendChild(item.cloneNode(true));
        }
      });
    }

    super(init);
  }

  indent() {}

  dedent() {}

  // 所有多 Container 下的 currentContainer 只考虑 range.startContainer 位置
  currentContainer() {
    // document.getSelection().focusNode
    const range = getDefaultRange();

    const li = parentElementWithTag(range.startContainer, "li", this.el);
    if (!li) {
      throw new Error(
        "Error when get currentContainer: focus are not in li element"
      );
    }
    return li;
  }

  getContainer(index?: number) {
    if (!index) {
      return this.el.firstChild! as HTMLElement;
    }
    if (index < 0) {
      return this.el.querySelector(
        `li:nth-last-child(${-index})`
      ) as HTMLElement;
    }
    // selector 从 1 开始，index 从 0 开始
    return this.el.querySelector(`li:nth-child(${index + 1})`) as HTMLElement;
  }

  leftContainer(el?: HTMLElement) {
    return el!.previousElementSibling! as HTMLElement;
  }
  rightContainer(el?: HTMLElement) {
    return el!.nextElementSibling as HTMLElement;
  }
  aboveContainer(el?: HTMLElement) {
    return this.leftContainer(el);
  }
  belowContainer(el?: HTMLElement) {
    return this.rightContainer(el);
  }

  firstContainer() {
    return this.el.firstChild as HTMLElement;
  }
  lastContainer() {
    return this.el.lastChild as HTMLElement;
  }
  containers(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll("li"));
  }

  getIndexOfContainer(container: HTMLElement, reverse?: boolean): number {
    let index = indexOfNode(container, "li");
    if (reverse) {
      index = index - this.el.childNodes.length - 1;
    }
    return index;
  }
}
