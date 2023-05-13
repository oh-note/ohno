/**
 * 手动更新 hover、active 和 selection 状态，
 * 用于模拟 input 和 textarea 的 placeholder 和其他效果的更新
 */
import {
  EventContext,
  Handler,
  FineHandlerMethods,
  RangedEventContext,
  dispatchKeyEvent,
} from "@/system/handler";
import { defaultHandleArrowDown } from "./arrowDown";
import {
  getSoftLineHead,
  getSoftLineTail,
  normalizeRange,
  setLocation,
  getValidAdjacent,
  clipRange,
} from "@/system/range";
import { defaultHandleBeforeInput } from "./beforeInput";
import { getTokenSize } from "@/system/position";
import { isParent, parentElementWithTag } from "@/helper/element";
import { Paragraph } from "@/contrib/blocks";
import { BlockCreate, BlocksCreate } from "@/contrib/commands/block";
import { OhNoClipboardData } from "@/system/base";
import { ListCommandBuilder } from "@/contrib/commands/concat";
import { defaultHandlePaste } from "./paste";

export class DefaultBlockHandler extends Handler implements FineHandlerMethods {
  handleClick(e: MouseEvent, context: EventContext): boolean | void {}

  handleMouseEnter(e: MouseEvent, context: EventContext): boolean | void {}

  handleMouseDown(
    e: MouseEvent,
    { block, page }: EventContext
  ): boolean | void {
    page.setActivate(block);
  }

  handleMouseUp(e: MouseEvent, context: EventContext): boolean | void {
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

  handleHomeDown(e: KeyboardEvent, context: EventContext): boolean | void {
    this.moveToSoftlineBound(context, "left");
    return true;
  }

  handleEndDown(e: KeyboardEvent, context: EventContext): boolean | void {
    this.moveToSoftlineBound(context, "right");
    return true;
  }

  moveToSoftlineBound(
    { page, block, range }: EventContext,
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

  handleContextMenu(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseLeave(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseMove(e: MouseEvent, context: EventContext): boolean | void {}

  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    // const { range, block } = context;

    if (dispatchKeyEvent(this, e, context)) {
      return true;
    } else if (e.metaKey) {
      if (e.key === "z") {
        if (e.shiftKey) {
          context.page.history.redo();
        } else {
          context.page.history.undo();
        }
        e.preventDefault();
        e.stopPropagation();
      }
    } else if (e.ctrlKey) {
      if (e.key === "a" || e.key === "e") {
        this.moveToSoftlineBound(context, e.key === "a" ? "left" : "right");
        return true;
      }
    }
  }
  handleArrowKeyDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    return defaultHandleArrowDown(this, e, context);
  }
  handleArrowKeyUp(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleKeyUp(e: KeyboardEvent, context: RangedEventContext): boolean | void {}

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedEventContext
  ): boolean | void {
    return defaultHandleBeforeInput(this, e, context);
  }

  handleCopy(e: ClipboardEvent, context: RangedEventContext): boolean | void {
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
  handlePaste(e: ClipboardEvent, context: RangedEventContext): boolean | void {
    // debugger;
    return defaultHandlePaste(this, e, context);
  }
}
