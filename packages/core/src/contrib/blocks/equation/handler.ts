import { defaultHandleBeforeInputOfPlainText } from "@ohno-editor/core/core/default/functions/beforeInput";
import {
  isParent,
  parentElementWithFilter,
  parentElementWithTag,
} from "@ohno-editor/core/helper/element";
import {
  BlockEventContext,
  Handler,
  FineHandlerMethods,
  RangedBlockEventContext,
  dispatchKeyEvent,
} from "@ohno-editor/core/system/handler";
import {
  BlockActiveEvent,
  BlockDeActiveEvent,
  BlockUpdateEvent,
} from "@ohno-editor/core/system/pageevent";
import { setLocation } from "@ohno-editor/core/system/range";
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
    context: RangedBlockEventContext
  ): boolean | void {}

  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }
  // 在 CompositionStart 时处理选中内容
  handleCompositionStart(
    e: CompositionEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return true;
  }
  handleDeleteDown(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {
    return true;
  }

  handleTabDown(e: KeyboardEvent, context: BlockEventContext): boolean | void {
    return true;
  }

  handleMouseDown(e: MouseEvent, context: BlockEventContext): boolean | void {}
  handleMouseUp(e: MouseEvent, context: BlockEventContext): boolean | void {
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
    context: BlockEventContext
  ): boolean | void {}

  handleEnterDown(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {
    const { page, block } = context;
    const next = page.getNextBlock(block);
    if (next) {
      page.setLocation(next.getLocation(0, 0)!, next);
    }
    return true;
  }

  // handleBeforeInput(
  //   e: TypedInputEvent,
  //   context: RangedEventContext
  // ): boolean | void {

  //   return defaultHandleBeforeInputOfPlainText(this, e, context);
  //   // const { block, page, range } = context;
  //   // return true;
  // }
}
