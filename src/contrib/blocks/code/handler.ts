import { HTMLElementTagName } from "@/helper/document";
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  RangedEventContext,
  dispatchKeyDown,
} from "@/system/handler";
import {
  elementOffset,
  getTokenSize,
  locationToBias,
  intervalToRange,
  rangeToInterval,
  tokenBetweenRange,
} from "@/system/position";
import { BlocksRemove } from "@/contrib/commands/block";
import { ValidNode, getTagName, outerHTML } from "@/helper/element";
import { ListCommandBuilder } from "@/contrib/commands/concat";

import { Code } from "./block";
import { AnyBlock } from "@/system/block";
import {
  setLocation,
  setRange,
  tryGetBoundsRichNode,
  validateRange,
} from "@/system/range";
import { RichTextDelete, TextDelete, TextInsert } from "@/contrib/commands";
import { FormatText } from "@/contrib/commands/format";
import { IBlockRemove } from "@/contrib/commands/inlineblock";

export interface DeleteContext extends EventContext {
  nextBlock: AnyBlock;
}

export function defaultHandleBeforeInput(
  handler: CodeHandler,
  e: TypedInputEvent,
  context: RangedEventContext
): boolean | void {
  const { page, block, range } = context;
  validateRange(range);

  let command;
  if (e.inputType === "insertText") {
    return handler.insertPlainText(context, e.data!);
  } else if (e.inputType === "insertFromPaste") {
    if (e.dataTransfer) {
      let content: string;
      if ((content = e.dataTransfer.getData("text/html"))) {
        handler.insertPlainText(context, content);
      } else if ((content = e.dataTransfer.getData("text/plain"))) {
        handler.insertPlainText(context, content);
      } else {
        // eslint-disable-next-line no-debugger
        debugger;
        return true;
      }
    }
  } else if (e.inputType === "insertCompositionText") {
    return true;
  } else if (
    !range.collapsed &&
    (e.inputType === "deleteContentBackward" ||
      e.inputType === "deleteContentForward")
  ) {
    // 所有的 multi block 应该被 multiblock handler 接受
    // 所有的 multi container 应该被 block handler 接受

    const start = block.getBias([range.startContainer, range.startOffset]);
    const token_number = tokenBetweenRange(range);

    command = new TextDelete({
      page,
      block,
      start,
      index: 0,
      token_number,
    })
      .onExecute(({ block, start }) => {
        setLocation(block.getLocation(start, 0)!);
        (block as Code).updateRender();
      })
      .onUndo(({ block, start, token_number }) => {
        setRange(block.getRange({ start, end: start + token_number }, 0)!);
        (block as Code).updateRender();
      });
  } else if (e.inputType === "deleteContentBackward") {
    const start = block.getBias([range.startContainer, range.startOffset]);
    command = new TextDelete({
      page,
      block,
      start,
      index: 0,
      token_number: -1,
    })
      .onExecute(() => {
        (block as Code).updateRender();
      })
      .onUndo(() => {
        (block as Code).updateRender();
      });
  } else if (e.inputType === "deleteWordBackward") {
  } else if (e.inputType === "deleteContentForward") {
    // 判断是否是格式字符边界，两种情况：
    // ?|<b>asd</b>
    // <b>asd|</b>?
    console.log("deleteForward");
    const start = block.getBias([range.startContainer, range.startOffset]);
    command = new TextDelete({
      page,
      block,
      start,
      index: 0,
      token_number: 1,
    }).onExecute(({ block, start, index }) => {
      (block as Code).updateRender();
    });
  }

  if (command) {
    page.executeCommand(command);
    return true;
  }
}

export class CodeHandler extends Handler implements KeyDispatchedHandler {
  handleKeyPress(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
  }

  handleMouseDown(e: MouseEvent, context: EventContext): boolean | void {}

  handleDeleteDown(e: KeyboardEvent, context: EventContext): boolean | void {
    // return true;
  }

  handleBackspaceDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    const { block, range } = context;
    if (block.isLocationInLeft([range.startContainer, range.startOffset])) {
      return true;
    }
  }
  handleTabDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    this.insertPlainText(context, "\t");
    return true;
  }
  insertPlainText(context: RangedEventContext, text: string) {
    const { page, block, range } = context;
    const command = new TextInsert({
      page,
      block,
      start: block.getBias([range.startContainer, range.startOffset]),
      index: 0,
      innerHTML: block.isLocationInRight([
        range.startContainer,
        range.startOffset,
      ])
        ? "\n "
        : "\n",
      plain: true,
    })
      .onExecute(({ block, start }) => {
        setLocation(block.getLocation(start + 1, 0)!);
        (block as Code).updateRender();
      })
      .onUndo(({ block, start }) => {
        setLocation(block.getLocation(start, 0)!);
        (block as Code).updateRender();
      });
    page.executeCommand(command);
    return true;
  }

  handleEnterDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    e.stopPropagation();
    e.preventDefault();
    return this.insertPlainText(context, "\n");
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
      defaultHandleBeforeInput(this, e, context);

      return true;
    }
    return true;
  }
}
