import { AnyBlock, Block, BlockOperations } from "./block";
import { Page } from "./page";

export class HandlerOption {}

export interface EventContext {
  page: Page;
  block: AnyBlock;
}

export type HandlerMethod<K> = (
  this: Handler,
  e: K,
  context: EventContext
) => boolean | void;

export interface HandlerMethods {
  handleSelect(e: Event, context: EventContext): void | boolean;
  handleSelectionChange(e: Event, context: EventContext): void | boolean;
  handleSelectStart(e: Event, context: EventContext): void | boolean;
  handleCopy(e: ClipboardEvent, context: EventContext): void | boolean;
  handlePaste(e: ClipboardEvent, context: EventContext): void | boolean;
  handleBlur(e: FocusEvent, context: EventContext): void | boolean;
  handleFocus(e: FocusEvent, context: EventContext): void | boolean;
  handleKeyDown(e: KeyboardEvent, context: EventContext): void | boolean;
  handleKeyPress(e: KeyboardEvent, context: EventContext): void | boolean;
  handleKeyUp(e: KeyboardEvent, context: EventContext): void | boolean;
  handleMouseDown(e: MouseEvent, context: EventContext): void | boolean;
  handleMouseEnter(e: MouseEvent, context: EventContext): void | boolean;
  handleMouseLeave(e: MouseEvent, context: EventContext): void | boolean;
  handleMouseUp(e: MouseEvent, context: EventContext): void | boolean;
  handleMouseMove(e: MouseEvent, context: EventContext): void | boolean;
  handleClick(e: MouseEvent, context: EventContext): void | boolean;
  handleContextMenu(e: MouseEvent, context: EventContext): void | boolean;
  handleInput(e: Event, context: EventContext): void | boolean;
  handleBeforeInput(e: InputEvent, context: EventContext): void | boolean;
  handleCompositionEnd(
    e: CompositionEvent,
    context: EventContext
  ): void | boolean;
  handleCompositionStart(
    e: CompositionEvent,
    context: EventContext
  ): void | boolean;
  handleCompositionUpdate(
    e: CompositionEvent,
    context: EventContext
  ): void | boolean;
}

export class Handler implements HandlerMethods, KeyDispatchedHandler {
  block_type: string = "abc";
  option: HandlerOption;
  constructor(option?: any) {
    if (!option) {
      option = {};
    }
    this.option = option;
  }
  handleSelect(e: Event, context: EventContext): boolean | void {}
  handleSelectionChange(e: Event, context: EventContext): boolean | void {}
  handleSelectStart(e: Event, context: EventContext): boolean | void {}

  handleCopy(e: ClipboardEvent, context: EventContext): void | boolean {}
  handlePaste(e: ClipboardEvent, context: EventContext): void | boolean {}
  handleBlur(e: FocusEvent, context: EventContext): void | boolean {}
  handleFocus(e: FocusEvent, context: EventContext): void | boolean {}
  handleKeyDown(e: KeyboardEvent, context: EventContext): void | boolean {}
  handleKeyPress(e: KeyboardEvent, context: EventContext): void | boolean {}
  handleKeyUp(e: KeyboardEvent, context: EventContext): void | boolean {}
  handleMouseDown(e: MouseEvent, context: EventContext): void | boolean {}
  handleMouseEnter(e: MouseEvent, context: EventContext): void | boolean {}
  handleMouseLeave(e: MouseEvent, context: EventContext): void | boolean {}
  handleMouseUp(e: MouseEvent, context: EventContext): void | boolean {}
  handleMouseMove(e: MouseEvent, context: EventContext): void | boolean {}
  handleClick(e: MouseEvent, context: EventContext): void | boolean {}
  handleContextMenu(e: MouseEvent, context: EventContext): void | boolean {}
  handleInput(e: Event, context: EventContext): void | boolean {}
  handleBeforeInput(e: InputEvent, context: EventContext): void | boolean {}
  handleCompositionEnd(
    e: CompositionEvent,
    context: EventContext
  ): void | boolean {}
  handleCompositionStart(
    e: CompositionEvent,
    context: EventContext
  ): void | boolean {}
  handleCompositionUpdate(
    e: CompositionEvent,
    context: EventContext
  ): void | boolean {}
}

export interface KeyDispatchedHandler {
  handleKeyDown(e: KeyboardEvent, context: EventContext): void | boolean;
  handleKeyUp(e: KeyboardEvent, context: EventContext): void | boolean;

  handleEnterDown?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleSpaceDown?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleTabDown?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleArrowKeyDown?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleDeleteDown?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleBackspaceDown?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleEscapeDown?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleHomeDown?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleEndDown?(e: KeyboardEvent, context: EventContext): void | boolean;
  handlePageUpDown?(e: KeyboardEvent, context: EventContext): void | boolean;
  handlePageDownDown?(e: KeyboardEvent, context: EventContext): void | boolean;

  handleEnterUp?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleSpaceUp?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleTabUp?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleArrowKeyUp?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleDeleteUp?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleBackspaceUp?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleEscapeUp?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleHomeUp?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleEndUp?(e: KeyboardEvent, context: EventContext): void | boolean;
  handlePageUpUp?(e: KeyboardEvent, context: EventContext): void | boolean;
  handlePageDownUp?(e: KeyboardEvent, context: EventContext): void | boolean;
}

export function dispatchKeyDown(
  handler: KeyDispatchedHandler,
  e: KeyboardEvent,
  context: EventContext
): boolean | void {
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

export const defaultBeforeHandlers: { [key: string]: Handler[] } = {};
export const defaultGlobalHandlers: Handler[] = [];
export const defaultAfterHandlers: { [key: string]: Handler[] } = {};

export function setBeforeHandlers(handler: Handler) {
  if (!defaultBeforeHandlers[handler.block_type]) {
    defaultBeforeHandlers[handler.block_type] = [];
  }
  // console.log(["Register before handler", handler]);
  defaultBeforeHandlers[handler.block_type].push(handler);
}

export function setGlobalHandler(handler: Handler) {
  // console.log(["Register global handler", handler]);
  console.log(handler)
  defaultGlobalHandlers.push(handler);
}

export function setAfterHandlers(handler: Handler) {
  if (!defaultAfterHandlers[handler.block_type]) {
    defaultAfterHandlers[handler.block_type] = [];
  }
  console.log(["Register after handler", handler]);
  defaultAfterHandlers[handler.block_type].push(handler);
}
