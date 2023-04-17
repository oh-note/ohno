/**
 * 手动更新 hover、active 和 selection 状态，
 * 用于模拟 input 和 textarea 的 placeholder 和其他效果的更新
 */
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  dispatchKeyDown,
  setGlobalHandler,
} from "@system/handler";
import {
  TextDeleteSelection,
  TextDeleteBackward,
  TextDeleteForward,
  TextInsert,
} from "@contrib/commands/text";
import { defaultHandleArrowDown } from "./defaultArrowDown";
import { FormatText } from "@contrib/commands/format";
import { HTMLElementTagName, getDefaultRange } from "@helper/document";
import {
  getPrevRange,
  normalizeRange,
  tryGetBoundsRichNode,
} from "@system/range";
import { getTagName } from "@helper/element";
import { FIRST_POSITION, elementOffset } from "@system/position";

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
    page.activate(block.order);
  }
  handleMouseUp(e: MouseEvent, context: EventContext): boolean | void {
    console.log(e);
    const range = getDefaultRange();
    const collapsed = range.collapsed;
    normalizeRange(context.block.el, range);
    if (collapsed) {
      const rect = range.getBoundingClientRect();
      const bound = rect.x + rect.width / 2;
      // 鼠标在右边的时候
      console.log(bound, e.clientX);
      range.collapse(e.clientX < bound);
    }
  }
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
        e.preventDefault();
        e.stopPropagation();
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
      const command = new TextInsert({
        page: page,
        block: block,
        insertOffset: block.getPosition(range),
        innerHTML: e.data as string,
        intime: { range: range },
      });
      page.executeCommand(command);
    } else if (e.inputType === "deleteContentBackward") {
      // 添加对范围的判断
      let command;
      console.log("delete");
      if (range.collapsed) {
        // 判断是否是格式字符边界，两种情况：
        // <b>asd</b>|?
        // ?<b>|asd</b>
        let hint;
        if (
          (hint = tryGetBoundsRichNode(
            range.startContainer,
            range.startOffset,
            "left"
          ))
        ) {
          const format = getTagName(hint) as HTMLElementTagName;
          const command = new FormatText({
            block,
            page,
            format,
            offset: elementOffset(block.currentContainer(), hint),
          });
          page.executeCommand(command);

          return true;
        }

        const prev = block.getPrevRange(range)!;
        const offset = block.getPosition(prev);
        prev.setEnd(range.startContainer, range.startOffset);
        command = new TextDeleteBackward({
          page: page,
          block: block,
          offset: offset,
          innerHTML: prev?.cloneContents().textContent as string,
          intime: { range: range },
        });
      } else {
        const offset = block.getPosition(range);
        command = new TextDeleteSelection({ delOffset: offset, page, block });
      }
      page.executeCommand(command);
    } else if (e.inputType === "deleteWordBackward") {
    } else if (e.inputType === "deleteContentForward") {
      const next = block.getNextRange(range)!;
      const offset = block.getPosition(range);
      next.setStart(range.startContainer, range.startOffset);
      const command = new TextDeleteForward({
        page: page,
        block: block,
        offset: offset,
        innerHTML: next?.cloneContents().textContent as string,
        intime: { range: range },
      });
      page.executeCommand(command);
    } else if (e.inputType === "formatBold") {
      const range = getDefaultRange();
      page.executeCommand(
        new FormatText({
          page: page,
          block: block,
          format: "b",
          offset: block.getPosition(range),
        })
      );
    } else if (e.inputType === "formatItalic") {
      const range = getDefaultRange();
      page.executeCommand(
        new FormatText({
          page: page,
          block: block,
          format: "i",
          offset: block.getPosition(range),
        })
      );
    } else {
    }
  }
}
