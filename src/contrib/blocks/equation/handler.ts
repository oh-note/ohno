import { defaultHandleBeforeInputOfPlainText } from "@/core/default/beforeInput";
import {
  isParent,
  parentElementWithFilter,
  parentElementWithTag,
} from "@/helper/element";
import {
  EventContext,
  Handler,
  FineHandlerMethods,
  RangedEventContext,
  dispatchKeyEvent,
} from "@/system/handler";
import {
  BlockActiveEvent,
  BlockDeActiveEvent,
  BlockUpdateEvent,
} from "@/system/pageevent";
import { setLocation } from "@/system/range";
import { Equation } from "./block";

export class EquationHandler extends Handler implements FineHandlerMethods {
  handleBlockUpdated(e: BlockUpdateEvent, context: any): boolean | void {
    const { page, block } = e;
    (block as Equation).update();
  }
  handleBlockActivated(e: BlockActiveEvent, context: any): boolean | void {
    const { block } = e;
    (block as Equation).floatMode();
  }
  handleBlockDeActivated(e: BlockDeActiveEvent, context: any): boolean | void {
    const { block } = e;
    (block as Equation).hideMode();
  }
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}

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
  handleDeleteDown(e: KeyboardEvent, context: EventContext): boolean | void {
    return true;
  }

  handleTabDown(e: KeyboardEvent, context: EventContext): boolean | void {
    return true;
  }

  handleMouseDown(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseUp(e: MouseEvent, context: EventContext): boolean | void {
    const { range, block, page } = context;
    const node = range
      ? range.startContainer
      : document.elementFromPoint(e.clientX, e.clientY)!;
    if (!node) {
      return;
    }
    if (!isParent(node, block.inner)) {
      const loc = block.getLocation(0, 0);
      page.setLocation(loc!, block);
      return true;
    }
  }

  handleBackspaceDown(
    e: KeyboardEvent,
    context: EventContext
  ): boolean | void {}

  handleEnterDown(e: KeyboardEvent, context: EventContext): boolean | void {
    const { page, block } = context;
    const next = page.getNextBlock(block);
    if (next) {
      page.setLocation(next.getLocation(0, 0)!, next);
    }
    return true;
  }

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedEventContext
  ): boolean | void {
    return defaultHandleBeforeInputOfPlainText(this, e, context);
    // const { block, page, range } = context;
    // return true;
  }
}
