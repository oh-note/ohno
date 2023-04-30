import { HTMLElementTagName } from "@/helper/document";
import { createElement } from "@/helper/document";
import { ValidNode, getTagName, outerHTML } from "@/helper/element";
import { parentElementWithTag, validChildNodes } from "@/helper/element";
import { addMarkdownHint } from "@/helper/markdown";
import {
  FULL_BLOCK as FULL_SELECTED,
  Offset,
  elementOffset,
  offsetToRange,
} from "@/system/position";
import { AnyBlock } from "@/system/block";
import { Command } from "@/system/history";
import { Page } from "@/system/page";
import {
  getValidAdjacent,
  nodesOfRange,
  normalizeRange,
  setRange,
} from "@/system/range";
import {
  addFormat,
  FormatOp,
  getFormatStatus,
  removeFormat,
} from "@/system/format";

export interface FormatPayload {
  page: Page;
  block: AnyBlock;
  offset: Offset;
  format: HTMLElementTagName;
  // remove?: boolean;
  execute?: {
    elements: ValidNode[];
  };
  undo_hint?: {
    offsets: Offset[];
    op?: FormatOp;
  };
  intime?: {
    range: Range;
  };
}

export interface FormatRemovePayload {
  page: Page;
  block: AnyBlock;
  offset: Offset;
  format: HTMLElementTagName;
  // remove?: boolean;
  undo_hint?: {
    offsets: Offset[];
  };
}

export class FormatRemove extends Command<FormatRemovePayload> {
  execute(): void {
    const { block, format, offset } = this.payload;
    const container = block.getContainer(offset.index!);
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
      container
    );

    this.payload.undo_hint = { offsets: [] };

    if (
      // 1. 导致的 deformat
      related.length > 0 ||
      fathers.filter((item) => getTagName(item) === format).length > 0
    ) {
      // deformat
      related.forEach((item) => {
        const itemOffset = elementOffset(container, item);
        this.payload.undo_hint?.offsets.push(itemOffset);
        const childs = validChildNodes(item);
        item.replaceWith(...childs);
      });

      fathers = fathers.flatMap((item) => {
        if (getTagName(item) === format) {
          const itemOffset = elementOffset(container, item);
          this.payload.undo_hint?.offsets.push(itemOffset);
          const childs = validChildNodes(item);
          item.replaceWith(...childs);
          return childs;
        }
        return item;
      });

      if (!this.onExecuteFn) {
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
      return;
    } else if (fmt) {
      // 2. 导致的 deformat
      // deformat 2
      // <b>te|xt</b>
      // <b>te[x<i>te]xt</i>t</b>
      const childs = validChildNodes(fmt);

      const itemOffset = elementOffset(container, fmt);
      this.payload.undo_hint?.offsets.push(itemOffset);

      fmt.replaceWith(...childs);
      if (!this.onExecuteFn) {
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
      }
      return;
    }
  }
  undo(): void {
    const { offsets } = this.payload.undo_hint!;
    const { block, format, offset } = this.payload;
    // 逆序排列
    offsets
      .sort((a, b) => {
        return a.start < b.start ? 1 : -1;
      })
      .forEach((item) => {
        item.end! -= 2;
        const range = offsetToRange(block.getContainer(offset.index!), item)!;
        const children = Array.from(range.extractContents().childNodes);
        const wrap = createElement(format, {
          children: children,
        });
        addMarkdownHint(wrap);
        range.insertNode(wrap);
      });
    if (!this.onUndoFn) {
      const range = offsetToRange(block.getContainer(offset.index!), offset)!;
      setRange(range);
    }
  }
}

export class FormatText extends Command<FormatPayload> {
  execute(): void {
    const { block, format, offset } = this.payload;
    const container = block.getContainer(offset.index!)!;

    const status = getFormatStatus(container, offset, format);
    const { range, op } = status;
    this.payload.undo_hint = {
      offsets: [],
      op,
    };
    if (op === "removeFormat") {
      // deformat
      // removeFormat()
      const { offsets, flatFathers, boundingOffset } = removeFormat(
        container,
        format,
        status
      );
      this.payload.undo_hint.offsets = offsets;

      this.payload.execute = {
        elements: flatFathers,
      };
      if (!this.onExecuteFn) {
        const range = offsetToRange(container, boundingOffset)!;
        // 2023.04.19 替换，虽然可能增加了一些开销，但简化了代码实现
        // const [startContainer, startOffset] = getValidAdjacent(
        //   flatFathers[0],
        //   "beforebegin"
        // );
        // const [endContainer, endOffset] = getValidAdjacent(
        //   flatFathers[flatFathers.length - 1],
        //   "afterend"
        // );
        // range.setStart(startContainer, startOffset);
        // range.setEnd(endContainer, endOffset);

        setRange(range);
      }
    } else {
      const addResults = addFormat(container, format, status);
      this.payload.undo_hint.offsets = addResults.offsets;

      if (!this.onExecuteFn) {
        setRange(offsetToRange(addResults.fathers[0], FULL_SELECTED)!);
      }
    }
  }
  undo(): void {
    const { offsets, op } = this.payload.undo_hint!;
    const { block, format, offset } = this.payload;
    // 逆序排列，从右到左取消，这样不需要考虑其他 area 带来的影响
    const container = block.getContainer(offset.index);
    offsets
      .sort((a, b) => {
        return a.start < b.start ? 1 : -1;
      })
      .forEach((item) => {
        if (op === "removeFormat") {
          item.end! -= 2;
          const range = offsetToRange(container, item)!;
          const children = Array.from(range.extractContents().childNodes);
          const wrap = createElement(format, {
            children: children,
          });
          addMarkdownHint(wrap);
          range.insertNode(wrap);
        } else {
          const range = offsetToRange(container, item)!;
          nodesOfRange(range).flatMap((item) => {
            if (getTagName(item) === format) {
              const childs = validChildNodes(item);
              item.replaceWith(...childs);
              return childs;
            }
            return item;
          });
        }
      });

    if (!this.onUndoFn) {
      const range = offsetToRange(container, offset)!;
      setRange(range);
    }
  }
}

export interface FormatAreasPayload {
  page: Page;
  areas: { block: AnyBlock; offset: Offset }[];
  format: HTMLElementTagName;
  // remove?: boolean;
  execute?: {
    elements: ValidNode[];
  };
  undo_hint?: {
    areas: { block: AnyBlock; offsets: Offset[] }[];
    op?: FormatOp;
  };
  intime?: {
    range: Range;
  };
}

export class FormatMultipleText extends Command<FormatAreasPayload> {
  execute(): void {
    // 获取全部区域的 status
    // 所有全部区域有一个是 deformat 就 deformat
    // 全部为 enformat 才 enformat
    const { format, page, areas: areas } = this.payload;
    const allStatus = areas.map(({ block, offset }) => {
      const container = block.getContainer(offset.index);
      return {
        block,
        container,
        offset,
        status: getFormatStatus(container, offset, format),
      };
    });
    const deformatStatue = allStatus.filter(({ status }) => {
      return status.op === "removeFormat";
    });

    // 假设传入的 block+offset 对应的 Container 无重复
    this.payload.undo_hint = {
      areas: [],
      op: "addFormat",
    };
    if (deformatStatue.length > 0) {
      // deformat
      this.payload.undo_hint.op = "removeFormat";
      deformatStatue.forEach(({ block, container, status, offset }) => {
        const { offsets } = removeFormat(container, format, status);
        this.payload.undo_hint?.areas.push({
          block,
          offsets: offsets.map((item) => {
            item.index = offset.index;
            return item;
          }),
        });
      });
    } else {
      // enformat
      allStatus.forEach(({ block, container, status, offset }) => {
        const { offsets } = addFormat(container, format, status);
        this.payload.undo_hint?.areas.push({
          block,
          offsets: offsets.map((item) => {
            item.index = offset.index;
            return item;
          }),
        });
      });
    }
  }
  undo(): void {
    const { format } = this.payload;
    const { areas, op } = this.payload.undo_hint!;
    areas.forEach(({ block, offsets }) => {
      offsets
        .sort((a, b) => {
          return a.start < b.start ? 1 : -1;
        })
        .forEach((item) => {
          const container = block.getContainer(item.index);
          console.log(item);
          if (op === "removeFormat") {
            item.end! -= 2;
            const range = offsetToRange(container, item)!;
            const children = Array.from(range.extractContents().childNodes);
            const wrap = createElement(format, {
              children: children,
            });
            addMarkdownHint(wrap);
            range.insertNode(wrap);
          } else {
            const range = offsetToRange(container, item)!;
            nodesOfRange(range).flatMap((item) => {
              if (getTagName(item) === format) {
                const childs = validChildNodes(item);
                item.replaceWith(...childs);
                return childs;
              }
              return item;
            });
          }
        });
    });
  }
}
