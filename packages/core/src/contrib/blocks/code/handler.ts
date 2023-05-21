import {
  BlockEventContext,
  Handler,
  FineHandlerMethods,
  RangedBlockEventContext,
  dispatchKeyEvent,
} from "@ohno-editor/core/system/handler";

import { Code } from "./block";
import { AnyBlock } from "@ohno-editor/core/system/block";
import {
  defaultHandleBeforeInputOfPlainText,
  insertPlainText,
} from "@ohno-editor/core/core/default/functions/beforeInput";
import { BlockUpdateEvent } from "@ohno-editor/core/system/pageevent";

export interface DeleteContext extends BlockEventContext {
  nextBlock: AnyBlock;
}

export class CodeHandler extends Handler implements FineHandlerMethods {
  handleBlockUpdated(e: BlockUpdateEvent, context: any): void | boolean {
    console.log(e);
    (e.block as Code).updateRender();
  }

  handleKeyPress(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {}

  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleMouseDown(e: MouseEvent, context: BlockEventContext): boolean | void {}

  handleDeleteDown(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {}

  handleBackspaceDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}

  handleTabDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return insertPlainText(context, "\t");
  }

  handleEnterDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
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
    context: RangedBlockEventContext
  ): boolean | void {}

  handlePaste(
    e: ClipboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const content = e.clipboardData?.getData("text/plain");
    if (content) {
      insertPlainText(context, content);
    }
  }

  // handleBeforeInput(
  //   e: TypedInputEvent,
  //   context: RangedEventContext
  // ): boolean | void {
  //   if (
  //     e.inputType === "insertText" ||
  //     // e.inputType === "insertFromPaste" ||
  //     e.inputType === "insertFromDrop" ||
  //     e.inputType === "deleteContentBackward" ||
  //     e.inputType === "deleteWordBackward" ||
  //     e.inputType === "deleteContentForward" ||
  //     e.inputType === "deleteWordForward"
  //   ) {
  //     defaultHandleBeforeInputOfPlainText(this, e, context);
  //     return true;
  //   }
  //   return true;
  // }
}
