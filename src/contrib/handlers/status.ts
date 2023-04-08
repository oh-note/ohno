/**
 * 手动更新 hover、active 和 selection 状态，
 * 用于模拟 input 和 textarea 的 placeholder 和其他效果的更新
 */
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  dispatchKeyDown,
  setBeforeHandlers,
  setHandler,
} from "../../system/handler";
import {
  DeleteTextBackward,
  DeleteTextForward,
  InsertText,
} from "../commands/text";
import { defaultHandleArrowDown } from "./defaultArrowDown";
import { rangeToOffset } from "../../system/position";
import { FormatText } from "../commands/format";
import { HTMLElementTagName } from "../../helper/document";

export class TransferHandler extends Handler implements KeyDispatchedHandler {
  handleClick(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseEnter(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseDown(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseUp(e: MouseEvent, context: EventContext): boolean | void {}
  handleContextMenu(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseLeave(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseMove(e: MouseEvent, context: EventContext): boolean | void {}

  handleKeyDown(e: KeyboardEvent, context: EventContext): boolean | void {
    if (dispatchKeyDown(this, e, context)) {
      return true;
    } else if (e.metaKey) {
      if (e.key === "z") {
        if (e.shiftKey) {
          context.page.history.redo();
        } else {
          context.page.history.undo();
        }
      }
    }
  }

  handleArrowKeyDown(e: KeyboardEvent, context: EventContext): boolean | void {
    return defaultHandleArrowDown(this, e, context);
  }
  handleArrowKeyUp(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleKeyPress(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleKeyUp(e: KeyboardEvent, context: EventContext): boolean | void {}

  handleBeforeInput(
    e: InputEvent,
    { page, block }: EventContext
  ): boolean | void {
    e.preventDefault();
    e.stopPropagation();
    // https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
    const range = document.getSelection()!.getRangeAt(0);
    if (e.inputType === "insertText") {
      const command = new InsertText({
        page: page,
        block: block,
        offset: block.getPosition(range),
        value: e.data as string,
        intime: { range: range },
      });
      page.emit(command);
    } else if (e.inputType === "deleteContentBackward") {
      const prev = block.getPrevRange(range)!;
      const offset = block.getPosition(prev);
      prev.setEnd(range.startContainer, range.startOffset);
      const command = new DeleteTextBackward({
        page: page,
        block: block,
        offset: offset,
        value: prev?.cloneContents().textContent as string,
        intime: { range: range },
      });
      page.emit(command);
    } else if (e.inputType === "deleteWordBackward") {
    } else if (e.inputType === "deleteContentForward") {
      const next = block.getNextRange(range)!;
      const offset = block.getPosition(range);
      next.setStart(range.startContainer, range.startOffset);
      const command = new DeleteTextForward({
        page: page,
        block: block,
        offset: offset,
        value: next?.cloneContents().textContent as string,
        intime: { range: range },
      });
      page.emit(command);
    } else if (e.inputType === "formatBold") {
      const range = document.getSelection()?.getRangeAt(0)!;
      page.emit(
        new FormatText({
          page: page,
          block: block,
          format: "b",
          offset: block.getPosition(range),
        })
      );
    } else if (e.inputType === "formatItalic") {
      const range = document.getSelection()?.getRangeAt(0)!;
      page.emit(
        new FormatText({
          page: page,
          block: block,
          format: "i",
          offset: block.getPosition(range),
        })
      );
    } else {
      console.log(e);
    }
  }
}

setHandler(new TransferHandler());
