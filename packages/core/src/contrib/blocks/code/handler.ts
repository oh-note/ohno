import {
  BlockEventContext,
  RangedBlockEventContext,
  PagesHandleMethods,
  AnyBlock,
  BlockUpdateEvent,
} from "@ohno-editor/core/system/types";
import {
  dispatchKeyEvent,
  createRange,
} from "@ohno-editor/core/system/functional";

import {
  defaultHandleBeforeInputOfPlainText,
  insertPlainText,
} from "@ohno-editor/core/core/default/functional/beforeInput";
import { Code } from "./block";
import { BlockReplace } from "../../commands";
import { Paragraph } from "../paragraph";

export interface DeleteContext extends BlockEventContext {
  nextBlock: AnyBlock;
}

export class CodeHandler implements PagesHandleMethods {
  handleBlockUpdated(e: BlockUpdateEvent, context: any): void | boolean {
    console.log(e);
    const { range, block, page } = e;
    if (range) {
      const startGlobalBias = block.getGlobalBiasPair([
        range.startContainer,
        range.startOffset,
      ]);
      const endGlobalBias = block.getGlobalBiasPair([
        range.endContainer,
        range.endOffset,
      ]);
      (block as Code).updateRender();
      const startLoc = block.getLocation(...startGlobalBias)!;
      const endLoc = block.getLocation(...endGlobalBias)!;
      page.setRange(createRange(...startLoc, ...endLoc));
    } else {
      // debugger;
      // (block as Code).updateRender();
    }
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
    insertPlainText(context, "    ");
    return true;
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

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { block, range, page } = context;
    const editable = block.findEditable(range.commonAncestorContainer);

    if (!editable) {
      if (range.collapsed) {
        page.setLocation(block.getLocation(0, 0)!);
      } else {
        const newBlock = new Paragraph();
        const command = new BlockReplace({ page, block, newBlock });
        page.executeCommand(command);
        return true;
      }
      return;
    }

    if (
      e.inputType === "insertText" ||
      // e.inputType === "insertFromPaste" ||
      e.inputType === "insertFromDrop" ||
      e.inputType === "deleteContentBackward" ||
      e.inputType === "deleteWordBackward" ||
      e.inputType === "deleteContentForward" ||
      e.inputType === "deleteWordForward"
    ) {
      // const { block, page, range } = context;
      defaultHandleBeforeInputOfPlainText(this, e, context);

      // const startGlobalBias = block.getGlobalBiasPair([
      //   range.startContainer,
      //   range.startOffset,
      // ]);
      // const endGlobalBias = block.getGlobalBiasPair([
      //   range.endContainer,
      //   range.endOffset,
      // ]);
      // (block as Code).updateRender();
      // const startLoc = block.getLocation(...startGlobalBias)!;
      // const endLoc = block.getLocation(...endGlobalBias)!;
      // page.setRange(createRange(...startLoc, ...endLoc));
      return true;
    }
    return true;
  }
}
