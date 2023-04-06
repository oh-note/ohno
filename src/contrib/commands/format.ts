import { HTMLElementTagName, createTextNode } from "../../helper/document";
import { createElement } from "../../helper/document";
import {
  ValidNode,
  firstValidChild,
  innerHTML,
  lastValidChild,
  tryConcatLeft,
} from "../../helper/element";
import { parentElementWithTag, validChildNodes } from "../../helper/element";
import { addMarkdownHint } from "../../helper/markdown";
import {
  FIRST_POSITION,
  FULL_BLOCK as FULL_SELECTED,
  LAST_POSITION,
  Offset,
  getNextRange,
  offsetToRange,
  rangeToOffset,
  setRange,
} from "../../helper/position";
import { AnyBlock, Block } from "../../system/block";
import { Command } from "../../system/history";
import { Page } from "../../system/page";
import { deserialize, serialize } from "../../system/serializer";

export interface FormatPayload {
  page: Page;
  block: AnyBlock;
  offset: Offset;
  format: HTMLElementTagName;
  // remove?: boolean;
  undo_hint?: {
    offset: Offset;
    formatIndex: number[];
  };
  intime?: {
    range: Range;
  };
}

export class FormatText extends Command<FormatPayload> {
  execute(): void {
    const { page, block, format, offset } = this.payload;
    const range = offsetToRange(block.getContainer(offset.index!), offset)!;

    const fmt = parentElementWithTag(
      range.commonAncestorContainer,
      format,
      block.currentContainer()
    );
    if (fmt) {
      // <b>te|xt</b>
      // <b>te[x<i>te]xt</i>t</b>
      console.log("deformat");
      const childs = validChildNodes(fmt);
      fmt.replaceWith(...childs);
      // 左右边界存在问题，应该再各自扩大一格
      // TODO 优化 getPrevRange/getNextRange 后修改这里
      range.setStartBefore(childs[0]);
      range.setEndAfter(childs[childs.length - 1]);
      setRange(range);
      return;
    }

    const frag = range.cloneContents();
    const segs = serialize(...Array.from(frag.childNodes));

    if (segs.length === 1) {
      const fmtindex = segs[0].format.indexOf(format);
      if (fmtindex >= 0) {
        // [<b>text</b>]
        segs[0].format.splice(fmtindex);
        const childs = deserialize(segs[0]);
        range.deleteContents();
        const text = createTextNode("");
        range.insertNode(text);
        text.replaceWith(...childs);
        return;
      }
    }

    /**
     * 上下文包括：选中区域，区域左侧，区域右侧
     * execute
     * 对选中区域检查，
     *
     *  - 删除属性：当父节点为该属性或者seg 数量为1 且为该属性时候
     *  - 添加属性：其他所有的情况
     *
     * undo 时还原依赖于区域左侧和区域右侧
     * 对选中区域，检查
     */
    {
      const left = range.startContainer;
      const right = range.endContainer;

      // const leftFmt = parentElementWithTag(left, format, block.el);

      segs.map((item) => {
        item.format.unshift(format);
        item.index.unshift(0);
      });

      range.deleteContents();
      const wrap = createElement(format, {
        children: Array.from(frag.childNodes),
        textContent: frag.textContent === "" ? " " : undefined,
      });
      addMarkdownHint(wrap);
      addMarkdownHint(left.parentElement as ValidNode);
      addMarkdownHint(right.parentElement as ValidNode);
      range.insertNode(wrap);
      setRange(offsetToRange(wrap, FULL_SELECTED)!);
      // offsetToRange(wrap, FULL_SELECTED);

      // if (range.startContainer === range.endContainer) {
      //   // add format
      //   console.log("add format");
      //   const wrap = createElement(format);

      //   //  [text] -> <b>[text]</b> ->undo-> [text]
      //   range.extractContents().childNodes.forEach((item) => {
      //     wrap.appendChild(item);
      //   });
      //   addMarkdownHint(wrap);
      //   range.insertNode(wrap);
      //   range.selectNodeContents(wrap);
      //   setRange(range);
      // } else {
      //   //  [te<i>x]t</i> -> <b>[te<i>x<i>]</b><i>t</i> ->undo-> [te<i>x]t</i>
      //   //  [te<b>x]t</b> -> <b>text</b> ->undo-> [te<b>x]t</b>
      //   //  [te<i><b>x</b>]t</i> -> <b>[te</b><i><b>x]</b>t</i>
      // }
    }

    // range.extra
  }
  undo(): void {
    throw new Error("Method not implemented.");
  }
}
