import { RangedBlockEventContext } from "./context";
import { ControlKeyEventHandleMethods } from "./interface";

export function dispatchKeyEvent<
  T extends RangedBlockEventContext = RangedBlockEventContext
>(
  handler: ControlKeyEventHandleMethods<T>,
  e: KeyboardEvent,
  context: T
): boolean | void {
  if (e.type === "keyup") {
    if (e.key == "Enter" && handler.handleEnterUp) {
      return handler.handleEnterUp(e, context);
    } else if (e.key == " " && handler.handleSpaceUp) {
      return handler.handleSpaceUp(e, context);
    } else if (e.key == "Tab" && handler.handleTabUp) {
      return handler.handleTabUp(e, context);
    } else if (e.key.startsWith("Arrow") && handler.handleArrowKeyUp) {
      return handler.handleArrowKeyUp(e, context);
    } else if (e.key == "Delete" && handler.handleDeleteUp) {
      return handler.handleDeleteUp(e, context);
    } else if (e.key == "Backspace" && handler.handleBackspaceUp) {
      return handler.handleBackspaceUp(e, context);
    } else if (e.key == "Escape" && handler.handleEscapeUp) {
      return handler.handleEscapeUp(e, context);
    } else if (e.key == "Home" && handler.handleHomeUp) {
      return handler.handleHomeUp(e, context);
    } else if (e.key == "End" && handler.handleEndUp) {
      return handler.handleEndUp(e, context);
    } else if (e.key == "PageUp" && handler.handlePageUpUp) {
      return handler.handlePageUpUp(e, context);
    } else if (e.key == "PageDown" && handler.handlePageDownUp) {
      return handler.handlePageDownUp(e, context);
    }
    return false;
  } else if (e.type === "keydown") {
    if (e.key == "Enter" && handler.handleEnterDown) {
      return handler.handleEnterDown(e, context);
    } else if (e.key == " " && handler.handleSpaceDown) {
      return handler.handleSpaceDown(e, context);
    } else if (e.key == "Tab" && handler.handleTabDown) {
      return handler.handleTabDown(e, context);
    } else if (e.key.startsWith("Arrow") && handler.handleArrowKeyDown) {
      return handler.handleArrowKeyDown(e, context);
    } else if (e.key == "Delete" && handler.handleDeleteDown) {
      return handler.handleDeleteDown(e, context);
    } else if (e.key == "Backspace" && handler.handleBackspaceDown) {
      return handler.handleBackspaceDown(e, context);
    } else if (e.key == "Escape" && handler.handleEscapeDown) {
      return handler.handleEscapeDown(e, context);
    } else if (e.key == "Home" && handler.handleHomeDown) {
      return handler.handleHomeDown(e, context);
    } else if (e.key == "End" && handler.handleEndDown) {
      return handler.handleEndDown(e, context);
    } else if (e.key == "PageUp" && handler.handlePageUpDown) {
      return handler.handlePageUpDown(e, context);
    } else if (e.key == "PageDown" && handler.handlePageDownDown) {
      return handler.handlePageDownDown(e, context);
    }
    return false;
  }
  return false;
}
