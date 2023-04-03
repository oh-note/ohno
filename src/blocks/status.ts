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
} from "../system/handler";
import { defaultHandleArrowDown } from "./defaultCursor";

export class TransferHandler extends Handler implements KeyDispatchedHandler {
  handleClick(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseEnter(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseDown(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseUp(e: MouseEvent, context: EventContext): boolean | void {}
  handleContextMenu(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseLeave(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseMove(e: MouseEvent, context: EventContext): boolean | void {}

  handleKeyDown(e: KeyboardEvent, context: EventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
  }

  handleArrowKeyDown(e: KeyboardEvent, context: EventContext): boolean | void {
    return defaultHandleArrowDown(this, e, context);
  }
  handleArrowKeyUp(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleKeyPress(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleKeyUp(e: KeyboardEvent, context: EventContext): boolean | void {}
}

setHandler(new TransferHandler());
