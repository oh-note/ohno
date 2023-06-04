// 添加和删除格式的基本行为逻辑
import {
  ElementTagName,
  HTMLElementTagName,
  createElement,
} from "@ohno-editor/core/helper/document";
import { intervalOfElement, intervalToRange } from "./position";
import {
  ValidNode,
  getTagName,
  outerHTML,
  parentElementWithTag,
  validChildNodes,
} from "@ohno-editor/core/helper/element";
import { nodesOfRange, normalizeRange } from "./range";
import { addMarkdownHint } from "@ohno-editor/core/helper/markdown";
import { Interval } from "./base";

export const formatTags: { [key in InputType]?: HTMLElementTagName } = {
  formatBold: "b",
  formatItalic: "i",
  formatUnderline: "u",
};

export type FormatOp = "addFormat" | "removeFormat";

export interface FormatMeta {
  op: FormatOp;
  root?: HTMLElement;
  range: Range;
  fathers: ValidNode[];
  formatedChildren?: ValidNode[];
}

/**
 * 根据选中范围和待应用格式，返回相关状态，用于后续处理
 * @param container
 * @param offset
 * @param format
 * @returns
 */
export function getFormatStatus(
  container: HTMLElement,
  offset: Interval,
  format: ElementTagName
): FormatMeta {
  const range = intervalToRange(container, offset)!;
  normalizeRange(range.commonAncestorContainer as HTMLElement, range);
  // 1. 判断选中内容是否是待应用格式的子节点（1. 是遍历子节点，判断不出来）
  const fmt = parentElementWithTag(
    range.commonAncestorContainer,
    format,
    container
  );
  if (fmt) {
    return { op: "removeFormat", root: fmt, range, fathers: [fmt] };
  }

  // 2. 判断选中的子节点中是否有待应用格式
  const fathers: ValidNode[] = [];
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

  if (
    related.length > 0 ||
    fathers.filter((item) => getTagName(item) === format).length > 0
  ) {
    return { op: "removeFormat", fathers, formatedChildren: related, range };
  }

  return { op: "addFormat", fathers, range };
}

export function addFormat(
  container: HTMLElement,
  format: HTMLElementTagName,
  { fathers, range }: FormatMeta
): { fathers: ValidNode[]; offsets: Interval[] } {
  const wrap = createElement(format, {
    children: fathers,
    textContent: outerHTML(...fathers) === "" ? "" : undefined,
  });
  addMarkdownHint(wrap);
  range.insertNode(wrap);
  const offsets = [intervalOfElement(container, wrap)];
  return { fathers: [wrap], offsets };
}
export function removeFormat(
  container: HTMLElement,
  format: HTMLElementTagName,
  { formatedChildren, fathers }: FormatMeta
): { offsets: Interval[]; flatFathers: ValidNode[]; boundingOffset: Interval } {
  const offsets: Interval[] = [];
  let reduce = 0;
  let left: number, right: number;
  function update(offset: Interval) {
    left = left === undefined || left > offset.start ? offset.start : left;
    right =
      right === undefined || (offset.end && right < offset.end)
        ? offset.end!
        : right;

    reduce += 2;
  }
  if (formatedChildren) {
    formatedChildren.forEach((item) => {
      const itemOffset = intervalOfElement(container, item);
      offsets.push(itemOffset);
      update(itemOffset);
      const childs = validChildNodes(item);
      item.replaceWith(...childs);
    });
  }

  const flatFathers = fathers.flatMap((item) => {
    if (getTagName(item) === format) {
      const itemOffset = intervalOfElement(container, item);
      offsets.push(itemOffset);
      update(itemOffset);

      const childs = validChildNodes(item);
      item.replaceWith(...childs);
      return childs;
    }
    return item;
  });
  const boundingOffset = { start: left!, end: right! - reduce };
  return { offsets, flatFathers, boundingOffset };
}
