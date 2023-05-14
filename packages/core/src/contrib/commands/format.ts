import { HTMLElementTagName } from "@ohno-editor/core/helper/document";
import { createElement } from "@ohno-editor/core/helper/document";
import {
  ValidNode,
  getTagName,
  outerHTML,
} from "@ohno-editor/core/helper/element";
import {
  parentElementWithTag,
  validChildNodes,
} from "@ohno-editor/core/helper/element";
import { addMarkdownHint } from "@ohno-editor/core/helper/markdown";
import {
  elementOffset,
  intervalToRange,
} from "@ohno-editor/core/system/position";
import { AnyBlock } from "@ohno-editor/core/system/block";
import { Command } from "@ohno-editor/core/system/history";
import { Page } from "@ohno-editor/core/system/page";
import {
  createRange,
  getValidAdjacent,
  nodesOfRange,
  normalizeRange,
  setRange,
} from "@ohno-editor/core/system/range";
import {
  addFormat,
  FormatOp,
  getFormatStatus,
  removeFormat,
} from "@ohno-editor/core/system/format";
import { EditableInterval, Interval } from "@ohno-editor/core/system/base";

export interface FormatPayload {
  page: Page;
  block: AnyBlock;
  // offset: Interval;
  interval: EditableInterval;
  format: HTMLElementTagName;
  // remove?: boolean;
  // execute?: {
  //   elements: ValidNode[];
  // };
  // undo_hint?: {
  //   offsets: Interval[];
  //   op?: FormatOp;
  // };
  intime?: {
    range: Range;
  };
}

export interface FormatRemovePayload {
  page: Page;
  block: AnyBlock;
  offset: Interval;
  interval: EditableInterval;
  format: HTMLElementTagName;
  // remove?: boolean;
  // undo_hint?: {
  //   offsets: Interval[];
  // };
}

export class FormatRemove extends Command<FormatRemovePayload> {
  declare buffer: {
    offsets: Interval[];
  };
  execute(): void {
    const { block, format, interval } = this.payload;
    const range = block.getEditableRange(interval)!;
    normalizeRange(range.commonAncestorContainer as HTMLElement, range);
    const editable = block.getEditable(interval.index)!;
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
      editable
    );

    this.buffer = { offsets: [] };

    if (
      // 1. 导致的 deformat
      related.length > 0 ||
      fathers.filter((item) => getTagName(item) === format).length > 0
    ) {
      // deformat
      related.forEach((item) => {
        const itemOffset = elementOffset(editable, item);
        this.buffer.offsets.push(itemOffset);
        const childs = validChildNodes(item);
        item.replaceWith(...childs);
      });

      fathers = fathers.flatMap((item) => {
        if (getTagName(item) === format) {
          const itemOffset = elementOffset(editable, item);
          this.buffer.offsets.push(itemOffset);
          const childs = validChildNodes(item);
          item.replaceWith(...childs);
          return childs;
        }
        return item;
      });

      if (!this.onExecuteFn) {
        const startLoc = getValidAdjacent(fathers[0], "beforebegin");
        const endLoc = getValidAdjacent(
          fathers[fathers.length - 1],
          "afterend"
        );

        const range = createRange(...startLoc, ...endLoc);
        setRange(range);
      }
      return;
    } else if (fmt) {
      // 2. 导致的 deformat
      // deformat 2
      // <b>te|xt</b>
      // <b>te[x<i>te]xt</i>t</b>
      const childs = validChildNodes(fmt);

      const itemOffset = elementOffset(editable, fmt);
      this.buffer.offsets.push(itemOffset);

      fmt.replaceWith(...childs);
      if (!this.onExecuteFn) {
        const startLoc = getValidAdjacent(childs[0], "beforebegin");
        const endLoc = getValidAdjacent(childs[childs.length - 1], "afterend");
        const range = createRange(...startLoc, ...endLoc);
        setRange(range);
      }
      return;
    }
  }
  undo(): void {
    const { offsets } = this.buffer;
    const { block, format, interval } = this.payload;
    // 逆序排列
    offsets
      .sort((a, b) => {
        return a.start < b.start ? 1 : -1;
      })
      .forEach((item) => {
        item.end! -= 2;
        const range = block.getRange(item, interval.index)!;
        // const range = intervalToRange(block.getEditable(interval.index), item)!;
        const children = Array.from(range.extractContents().childNodes);
        const wrap = createElement(format, {
          children: children,
        });
        addMarkdownHint(wrap);
        range.insertNode(wrap);
      });
    if (!this.onUndoFn) {
      const range = block.getEditableRange(interval)!;
      // const range = intervalToRange(
      //   block.getEditable(interval.index),
      //   interval
      // )!;
      setRange(range);
    }
  }
}

export class FormatText extends Command<FormatPayload> {
  declare buffer: {
    elements: HTMLElement[];
    offsets: Interval[];
    op?: FormatOp;
  };
  execute(): void {
    const { block, format, interval } = this.payload;
    const container = block.getEditable(interval.index!)!;

    const status = getFormatStatus(container, interval, format);
    const { range, op } = status;

    this.buffer = {
      elements: [],
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
      this.buffer.offsets = offsets;

      // this.payload.execute = {
      //   elements: flatFathers,
      // };
      if (!this.onExecuteFn) {
        const range = intervalToRange(container, boundingOffset)!;
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
      this.buffer.offsets = addResults.offsets;

      if (!this.onExecuteFn) {
        setRange(
          intervalToRange(addResults.fathers[0], { start: 0, end: -1 })!
        );
      }
    }
  }
  undo(): void {
    const { offsets, op } = this.buffer;
    const { block, format, interval } = this.payload;
    // 逆序排列，从右到左取消，这样不需要考虑其他 area 带来的影响
    const container = block.getEditable(interval.index);
    offsets
      .sort((a, b) => {
        return a.start < b.start ? 1 : -1;
      })
      .forEach((item) => {
        if (op === "removeFormat") {
          item.end! -= 2;

          const range = block.getRange(item, container)!;
          const children = Array.from(range.extractContents().childNodes);
          const wrap = createElement(format, {
            children: children,
          });
          addMarkdownHint(wrap);
          range.insertNode(wrap);
        } else {
          const range = block.getRange(item, container)!;
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
      const range = intervalToRange(container, interval)!;
      setRange(range);
    }
  }
}

export interface FormatAreasPayload {
  page: Page;
  areas: { block: AnyBlock; offset: EditableInterval }[];
  format: HTMLElementTagName;
}

export class FormatMultipleText extends Command<FormatAreasPayload> {
  declare buffer: {
    areas: { block: AnyBlock; offsets: EditableInterval[] }[];
    op: FormatOp;
  };
  execute(): void {
    // 获取全部区域的 status
    // 所有全部区域有一个是 deformat 就 deformat
    // 全部为 enformat 才 enformat
    const { format, page, areas: areas } = this.payload;
    const allStatus = areas.map(({ block, offset: interval }) => {
      const container = block.getEditable(interval.index);
      return {
        block,
        container,
        offset: interval,
        status: getFormatStatus(container, interval, format),
      };
    });
    const deformatStatue = allStatus.filter(({ status }) => {
      return status.op === "removeFormat";
    });

    // 假设传入的 block+offset 对应的 Container 无重复
    this.buffer = {
      areas: [],
      op: "addFormat",
    };
    if (deformatStatue.length > 0) {
      // deformat
      this.buffer.op = "removeFormat";
      deformatStatue.forEach(({ block, container, status, offset }) => {
        const { offsets } = removeFormat(container, format, status);
        this.buffer.areas.push({
          block,
          offsets: offsets.map((item) => {
            return { ...item, index: offset.index };
          }),
        });
      });
    } else {
      // enformat
      allStatus.forEach(({ block, container, status, offset }) => {
        const { offsets } = addFormat(container, format, status);
        this.buffer.areas.push({
          block,
          offsets: offsets.map((item) => {
            return { ...item, index: offset.index };
          }),
        });
      });
    }
  }
  undo(): void {
    const { format } = this.payload;
    const { areas, op } = this.buffer;
    areas.forEach(({ block, offsets }) => {
      offsets
        .sort((a, b) => {
          return a.start < b.start ? 1 : -1;
        })
        .forEach((item) => {
          const container = block.getEditable(item.index);
          console.log(item);
          if (op === "removeFormat") {
            item.end! -= 2;
            const range = intervalToRange(container, item)!;
            const children = Array.from(range.extractContents().childNodes);
            const wrap = createElement(format, {
              children: children,
            });
            addMarkdownHint(wrap);
            range.insertNode(wrap);
          } else {
            const range = intervalToRange(container, item)!;
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
