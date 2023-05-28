/**
 * 手动更新 hover、active 和 selection 状态，
 * 用于模拟 input 和 textarea 的 placeholder 和其他效果的更新
 */
import {
  BlockEventContext,
  RangedBlockEventContext,
  dispatchKeyEvent,
  PagesHandleMethods,
} from "@ohno-editor/core/system/handler";
import { isPlain } from "@ohno-editor/core/helper";
import { defaultHandleArrowDown } from "./functions/arrowDown";
import {
  getSoftLineHead,
  getSoftLineTail,
  normalizeRange,
  setLocation,
  getValidAdjacent,
} from "@ohno-editor/core/system/range";
import {
  defaultHandleBeforeInput,
  defaultHandleBeforeInputOfPlainText,
} from "./functions/beforeInput";
import { getTokenSize } from "@ohno-editor/core/system/position";
import {
  parentElementWithFilter,
  parentElementWithTag,
} from "@ohno-editor/core/helper/element";

import { OhNoClipboardData } from "@ohno-editor/core/system/base";
import { defaultHandlePaste } from "./functions/paste";
import {
  ST_MOVE_SOFT_END,
  ST_MOVE_SOFT_HEAD,
  ST_REDO,
  ST_UNDO,
} from "./consts";

export class DefaultBlockHandler implements PagesHandleMethods {
  handleClick(e: MouseEvent, context: BlockEventContext): boolean | void {}

  handleMouseEnter(e: MouseEvent, context: BlockEventContext): boolean | void {}

  handleMouseDown(
    e: MouseEvent,
    { block, page }: BlockEventContext
  ): boolean | void {
    page.setActivate(block);
  }

  handleMouseUp(e: MouseEvent, context: BlockEventContext): boolean | void {
    const { page, range, block } = context;
    if (range) {
      const collapsed = range.collapsed;
      normalizeRange(context.block.root, range);
      let label;
      if (
        (label = parentElementWithTag(
          range.startContainer,
          "label",
          block.root
        ))
      ) {
        // 在这里处理到的 inline 是假的
        // getValidAdjacent;
        const rect = label.getBoundingClientRect();
        const bound = rect.x + rect.width / 2;
        setLocation(
          getValidAdjacent(
            label,
            e.clientX < bound ? "beforebegin" : "afterend"
          )
        );
      } else if (collapsed) {
        const rect = range.getBoundingClientRect();
        const bound = rect.x + rect.width / 2;
        // 鼠标在右边的时候
        console.log(bound, e.clientX);
        range.collapse(e.clientX < bound);
        page.setLocation([range.startContainer, range.startOffset]);
      }
      return true;
    }
  }

  handleHomeDown(e: KeyboardEvent, context: BlockEventContext): boolean | void {
    this.moveToSoftlineBound(context, "left");
    return true;
  }

  handleEndDown(e: KeyboardEvent, context: BlockEventContext): boolean | void {
    this.moveToSoftlineBound(context, "right");
    return true;
  }

  moveToSoftlineBound(
    { page, block, range }: BlockEventContext,
    direction: "left" | "right"
  ) {
    if (!range) {
      throw new NoRangeError();
    }

    const container = block.findEditable(range.startContainer)!;
    const res =
      direction === "left"
        ? getSoftLineHead(range.startContainer, range.startOffset, container)
        : getSoftLineTail(range.startContainer, range.startOffset, container);
    if (res) {
      const [boundContainer, boundOffset] = res;
      if (
        range.startContainer === boundContainer &&
        range.startOffset === boundOffset
      ) {
        const start =
          direction === "left" ? 0 : getTokenSize(container as HTMLElement);
        const loc = block.getLocation(start, container)!;
        page.setLocation(loc, block);
      } else {
        page.setLocation([boundContainer, boundOffset], block);
      }
    }
  }

  handleContextMenu(
    e: MouseEvent,
    context: BlockEventContext
  ): boolean | void {}
  handleMouseLeave(e: MouseEvent, context: BlockEventContext): boolean | void {}
  handleMouseMove(e: MouseEvent, context: BlockEventContext): boolean | void {}

  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    // const { range, block } = context;
    const { page } = context;
    page.shortcut.match;
    if (dispatchKeyEvent(this, e, context)) {
      return true;
    }
    const st = page.shortcut;
    // debugger;
    const res = st.find(e);
    let hit;
    if ((hit = res.has(ST_UNDO))) {
      page.history.undo();
    } else if ((hit = res.has(ST_REDO))) {
      page.history.redo();
    } else if ((hit = res.has(ST_MOVE_SOFT_HEAD))) {
      this.moveToSoftlineBound(context, "left");
    } else if ((hit = res.has(ST_MOVE_SOFT_END))) {
      this.moveToSoftlineBound(context, "right");
    }
    if (hit) {
      return true;
    }
    // else if (e.metaKey) {
    //   if (e.key === "z") {
    //     if (e.shiftKey) {
    //       context.page.history.redo();
    //     } else {
    //       context.page.history.undo();
    //     }
    //     e.preventDefault();
    //     e.stopPropagation();
    //   }
    // } else if (e.ctrlKey) {
    //   if (e.key === "a" || e.key === "e") {
    //     this.moveToSoftlineBound(context, e.key === "a" ? "left" : "right");
    //     return true;
    //   }
    // }
  }
  handleArrowKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return defaultHandleArrowDown(this, e, context);
  }
  handleArrowKeyUp(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleKeyUp(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { block, range } = context;
    const editable = block.findEditable(range.commonAncestorContainer);
    if (!editable) {
      // handled by multiblock handler or block handler
      return;
    }
    // editable

    if (
      isPlain(editable) ||
      parentElementWithFilter(range.startContainer, editable, (el) => {
        return el instanceof HTMLElement && isPlain(el);
      })
    ) {
      return defaultHandleBeforeInputOfPlainText(this, e, context);
    }
    return defaultHandleBeforeInput(this, e, context);
  }

  handleCopy(
    e: ClipboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page, block, range } = context;

    // 处理不垮 Editable 的选中，可以是 collapsed 选中，也可以是 Editable 内部份选中
    // 多 Editable 在 block 内部处理
    // 多 block 由 multiblock 处理
    const editable = block.findEditable(range.commonAncestorContainer);
    if (!editable) {
      throw new Error(`Should be handled in block ${block.type}`);
    }

    const text = block.toMarkdown(range);
    const html = block.toHTML(range);
    e.clipboardData!.setData("text/plain", text);
    e.clipboardData!.setData("text/html", html);
    if (range.collapsed) {
      // 非选中（collapsed）状态下，复制整个 block
      const ohnoData: OhNoClipboardData = {
        data: block.serialize(),
        inline: false,
      };
      const json = JSON.stringify(ohnoData);
      e.clipboardData!.setData("text/ohno", json);
    } else {
      const ohnoData: OhNoClipboardData = {
        data: page.inlineSerializer.serialize(range),
        inline: true,
      };
      const json = JSON.stringify(ohnoData);
      e.clipboardData!.setData("text/ohno", json);
      // 选中部分文本情况下，有 inline serializer 进行序列化
    }

    return true;
  }
  handlePaste(
    e: ClipboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    // debugger;
    return defaultHandlePaste(this, e, context);
  }
}
