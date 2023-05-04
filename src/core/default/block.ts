/**
 * 手动更新 hover、active 和 selection 状态，
 * 用于模拟 input 和 textarea 的 placeholder 和其他效果的更新
 */
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  RangedEventContext,
  dispatchKeyDown,
} from "@/system/handler";
import { defaultHandleArrowDown } from "./arrowDown";
import { getDefaultRange } from "@/helper/document";
import {
  createRange,
  getSoftLineHead,
  getSoftLineTail,
  normalizeRange,
  setLocation,
  setRange,
} from "@/system/range";
import { defaultHandleBeforeInput } from "./beforeInput";
import { getTokenSize } from "@/system/position";

export class DefaultBlockHandler
  extends Handler
  implements KeyDispatchedHandler
{
  handleClick(e: MouseEvent, context: EventContext): boolean | void {}

  handleMouseEnter(e: MouseEvent, context: EventContext): boolean | void {}

  handleMouseDown(
    e: MouseEvent,
    { block, page }: EventContext
  ): boolean | void {
    page.setActivate(block);
  }

  handleMouseUp(e: MouseEvent, context: EventContext): boolean | void {
    const range = getDefaultRange();
    const collapsed = range.collapsed;
    normalizeRange(context.block.root, range);
    if (collapsed) {
      const rect = range.getBoundingClientRect();
      const bound = rect.x + rect.width / 2;
      // 鼠标在右边的时候
      console.log(bound, e.clientX);
      range.collapse(e.clientX < bound);
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
    { block, range }: EventContext,
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
        setLocation(loc);
      } else {
        setLocation([boundContainer, boundOffset]);
      }
    }
  }

  handleContextMenu(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseLeave(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseMove(e: MouseEvent, context: EventContext): boolean | void {}

  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    // const { range, block } = context;

    if (dispatchKeyDown(this, e, context)) {
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
}
