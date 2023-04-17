import { HTMLElementTagName } from "@helper/document";
import { createElement } from "@helper/document";
import { ValidNode, getTagName, outerHTML } from "@helper/element";
import { parentElementWithTag, validChildNodes } from "@helper/element";
import { addMarkdownHint } from "@helper/markdown";
import {
  FULL_BLOCK as FULL_SELECTED,
  Offset,
  elementOffset,
  offsetToRange,
} from "@system/position";
import { AnyBlock } from "@system/block";
import { Command } from "@system/history";
import { Page } from "@system/page";
import {
  getValidAdjacent,
  nodesOfRange,
  normalizeRange,
  setRange,
} from "@system/range";

export interface FormatPayload {
  page: Page;
  block: AnyBlock;
  offset: Offset;
  format: HTMLElementTagName;
  // remove?: boolean;
  undo_hint?: {
    offsets: Offset[];
    op?: "enformat" | "deformat";
  };
  intime?: {
    range: Range;
  };
}

export class FormatText extends Command<FormatPayload> {
  execute(): void {
    const { page, block, format, offset } = this.payload;
    const range = offsetToRange(block.getContainer(offset.index!), offset)!;
    normalizeRange(range.commonAncestorContainer as Node, range);

    // 1. 判断选中的子节点中是否有待应用格式
    let fathers: ValidNode[] = [];
    const related: HTMLElement[] = [];
    for (const child of nodesOfRange(range)) {
      fathers.push(child as ValidNode);
      const iterator = document.createNodeIterator(
        child,
        NodeFilter.SHOW_ELEMENT,
        (el: Node) => {
          if (getTagName(el) === format && el !== child) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      );

      let node;
      while ((node = iterator.nextNode())) {
        related.push(node as HTMLElement);
      }
    }
    // 2. 判断选中内容是否是待应用格式的子节点（1. 是遍历子节点，判断不出来）
    const fmt = parentElementWithTag(
      range.commonAncestorContainer,
      format,
      block.currentContainer()
    );

    this.payload.undo_hint = { offsets: [] };

    if (
      // 1. 导致的 deformat
      related.length > 0 ||
      fathers.filter((item) => getTagName(item) === format).length > 0
    ) {
      // deformat
      this.payload.undo_hint.op = "deformat";
      related.forEach((item) => {
        const itemOffset = elementOffset(block.currentContainer(), item);
        this.payload.undo_hint?.offsets.push(itemOffset);
        const childs = validChildNodes(item);
        item.replaceWith(...childs);
      });

      fathers = fathers.flatMap((item) => {
        if (getTagName(item) === format) {
          const itemOffset = elementOffset(block.currentContainer(), item);
          this.payload.undo_hint?.offsets.push(itemOffset);
          const childs = validChildNodes(item);
          item.replaceWith(...childs);
          return childs;
        }
        return item;
      });
      const [startContainer, startOffset] = getValidAdjacent(
        fathers[0],
        "beforebegin"
      );
      const [endContainer, endOffset] = getValidAdjacent(
        fathers[fathers.length - 1],
        "afterend"
      );

      range.setStart(startContainer, startOffset);
      range.setEnd(endContainer, endOffset);
      setRange(range);
      return;
    } else if (fmt) {
      // 2. 导致的 deformat
      // deformat 2
      // <b>te|xt</b>
      // <b>te[x<i>te]xt</i>t</b>
      const childs = validChildNodes(fmt);
      this.payload.undo_hint.op = "deformat";

      const itemOffset = elementOffset(block.currentContainer(), fmt);
      this.payload.undo_hint?.offsets.push(itemOffset);

      fmt.replaceWith(...childs);
      const [startContainer, startOffset] = getValidAdjacent(
        childs[0],
        "beforebegin"
      );
      const [endContainer, endOffset] = getValidAdjacent(
        childs[childs.length - 1],
        "afterend"
      );

      range.setStart(startContainer, startOffset);
      range.setEnd(endContainer, endOffset);
      setRange(range);
      return;
    } else {
      // 排除 deformat 的情况， enformat 就是选中区域套一层
      this.payload.undo_hint.op = "enformat";
      const wrap = createElement(format, {
        children: fathers,
        textContent: outerHTML(...fathers) === "" ? "" : undefined,
      });
      addMarkdownHint(wrap);

      range.insertNode(wrap);
      this.payload.undo_hint.offsets.push(
        elementOffset(block.currentContainer(), wrap)
      );
      setRange(offsetToRange(wrap, FULL_SELECTED)!);
      return;
    }
  }
  undo(): void {
    const { offsets, op } = this.payload.undo_hint!;
    const { page, block, format, offset } = this.payload;
    // 逆序排列
    offsets
      .sort((a, b) => {
        return a.start < b.start ? 1 : -1;
      })
      .forEach((item) => {
        if (op === "deformat") {
          item.end! -= 2;
          const range = offsetToRange(block.getContainer(offset.index!), item)!;
          const children = Array.from(range.extractContents().childNodes);
          const wrap = createElement(format, {
            children: children,
          });
          addMarkdownHint(wrap);
          range.insertNode(wrap);
        } else {
          const range = offsetToRange(block.getContainer(offset.index!), item)!;
          const fathers = nodesOfRange(range).flatMap((item) => {
            if (getTagName(item) === format) {
              const childs = validChildNodes(item);
              item.replaceWith(...childs);
              return childs;
            }
            return item;
          });
          const [startContainer, startOffset] = getValidAdjacent(
            fathers[0],
            "beforebegin"
          );
          const [endContainer, endOffset] = getValidAdjacent(
            fathers[fathers.length - 1],
            "afterend"
          );

          range.setStart(startContainer, startOffset);
          range.setEnd(endContainer, endOffset);
          setRange(range);
        }
      });

    const range = offsetToRange(block.getContainer(offset.index!), offset)!;
    setRange(range);
  }
}
