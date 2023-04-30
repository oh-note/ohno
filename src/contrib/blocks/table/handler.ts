import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  RangedEventContext,
  dispatchKeyDown,
} from "@/system/handler";
import { createRange, setRange } from "@/system/range";

export class TableHandler extends Handler implements KeyDispatchedHandler {
  name: string = "table";
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}

  handleMouseUp(e: MouseEvent, { range, block }: EventContext): boolean | void {
    if (range) {
      if (
        range?.collapsed &&
        !block.findContainer(range!.commonAncestorContainer)
      ) {
        const container = block.firstContainer();
        setRange(createRange(...block.getLocation(0, { container })!));
      }
    }
  }

  handleContextMenu(e: MouseEvent, context: EventContext): boolean | void {
    return true;
  }

  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
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
    const container = block.findContainer(range.commonAncestorContainer);
    if (container) {
      const container = block.findContainer(range.startContainer);
      if (container) {
        const next = e.shiftKey
          ? block.prevContainer(container)
          : block.nextContainer(container);
        if (next) {
          const start = block.getLocation(0, { container: next })!;
          const end = block.getLocation(-1, { container: next })!;
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
    const container = block.findContainer(range.commonAncestorContainer);
    if (container) {
      const next = e.shiftKey
        ? block.prevContainer(container)
        : block.nextContainer(container);
      if (next) {
        const res = block.getLocation(0, { container: next })!;
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
