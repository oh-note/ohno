import {
  EventContext,
  Handler,
  FineHandlerMethods,
  RangedEventContext,
  dispatchKeyEvent,
} from "@/system/handler";

import { Code } from "./block";
import { AnyBlock } from "@/system/block";
import {
  defaultHandleBeforeInputOfPlainText,
  insertPlainText,
} from "@/core/default/beforeInput";
import { BlockUpdateEvent } from "@/system/pageevent";

export interface DeleteContext extends EventContext {
  nextBlock: AnyBlock;
}

export class CodeHandler extends Handler implements FineHandlerMethods {
  handleBlockUpdated(e: BlockUpdateEvent, context: any): void | boolean {
    console.log(e);
    (e.block as Code).updateRender();
  }

  handleKeyPress(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleMouseDown(e: MouseEvent, context: EventContext): boolean | void {}

  handleDeleteDown(e: KeyboardEvent, context: EventContext): boolean | void {}

  handleBackspaceDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    // const { block, range } = context;
    // if (block.isLocationInLeft([range.startContainer, range.startOffset])) {
    //   return true;
    // }
  }
  handleTabDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return insertPlainText(context, "\t");
  }

  handleEnterDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    const { block, range } = context;
    return insertPlainText(
      context,
      block.isLocationInRight([range.startContainer, range.startOffset])
        ? "\n "
        : "\n"
    );
  }

  handleSpaceDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedEventContext
  ): boolean | void {
    if (
      e.inputType === "insertText" ||
      e.inputType === "insertFromPaste" ||
      e.inputType === "deleteContentBackward" ||
      e.inputType === "deleteWordBackward" ||
      e.inputType === "deleteContentForward" ||
      e.inputType === "deleteWordForward"
    ) {
      defaultHandleBeforeInputOfPlainText(this, e, context);
      return true;
    }
    return true;
  }
}
