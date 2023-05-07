import {
  EventContext,
  Handler,
  FineHandlerMethods,
  RangedEventContext,
  dispatchKeyEvent,
} from "@/system/handler";
import { createRange, setLocation, setRange } from "@/system/range";

export class TableHandler extends Handler implements FineHandlerMethods {
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}

  handleMouseUp(e: MouseEvent, { range, block }: EventContext): boolean | void {
    if (range) {
      if (
        range?.collapsed &&
        !block.findEditable(range!.commonAncestorContainer)
      ) {
        const container = block.getFirstEditable();
        setLocation(block.getLocation(0, container)!);
      }
    }
  }

  handleContextMenu(e: MouseEvent, context: EventContext): boolean | void {
    return true;
  }

  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  // 在 CompositionStart 时处理选中内容
  handleCompositionStart(
    e: CompositionEvent,
    context: RangedEventContext
  ): boolean | void {
    return true;
  }

  handleDeleteDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    return true;
  }

  handleTabDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    const { block, range } = context;
    const container = block.findEditable(range.commonAncestorContainer);
    if (container) {
      const container = block.findEditable(range.startContainer);
      if (container) {
        const next = e.shiftKey
          ? block.getPrevEditable(container)
          : block.getNextEditable(container);
        if (next) {
          const start = block.getLocation(0, next)!;
          const end = block.getLocation(-1, next)!;
          setRange(createRange(...start, ...end));
        }
      }
    }

    return true;
  }

  handleBackspaceDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    // 向前合并
    // return true;
  }

  handleEnterDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    const { block, range } = context;
    const container = block.findEditable(range.commonAncestorContainer);
    if (container) {
      const next = e.shiftKey
        ? block.getPrevEditable(container)
        : block.getNextEditable(container);
      if (next) {
        const res = block.getLocation(0, next)!;
        setRange(createRange(...res));
      }
    } else {
      // 多选，清楚选中内容
    }

    return true;
  }

  handleBeforeInput(e: TypedInputEvent, context: EventContext): boolean | void {
    // const { block, page, range } = context;
    // return true;
  }
}
