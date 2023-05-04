// 事件系统可以处理的事件的定义
import { IBlock } from "./base";
import { AnyBlock, Block } from "./block";
import { Page } from "./page";

export interface HandlerOption {
  [key: string]: any;
}

export interface EventContext {
  page: Page;
  block: AnyBlock;
  endBlock?: AnyBlock;
  range?: Range;
}

export interface RangedEventContext extends EventContext {
  range: Range;
}

export interface MultiBlockEventContext extends EventContext {
  // page: Page;
  // block: IBlock;
  endBlock: AnyBlock;
  range: Range;
  blocks: AnyBlock[];
}

export type HandlerMethod<K> = (
  this: Handler,
  e: K,
  context: EventContext
) => boolean | void;

export type MultiBlockHandlerMethod<K> = (
  this: Handler,
  e: K,
  context: MultiBlockEventContext
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
  handleBeforeInput(e: InputEvent, context: RangedEventContext): void | boolean;
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

export class Handler implements HandlerMethods {
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
  handleKeyDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean {}
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean {}
  handleKeyUp(e: KeyboardEvent, context: RangedEventContext): void | boolean {}
  handleMouseDown(e: MouseEvent, context: EventContext): void | boolean {}
  handleMouseEnter(e: MouseEvent, context: EventContext): void | boolean {}
  handleMouseLeave(e: MouseEvent, context: EventContext): void | boolean {}
  handleMouseUp(e: MouseEvent, context: EventContext): void | boolean {}
  handleMouseMove(e: MouseEvent, context: EventContext): void | boolean {}
  handleClick(e: MouseEvent, context: EventContext): void | boolean {}
  handleContextMenu(e: MouseEvent, context: EventContext): void | boolean {}
  handleInput(e: TypedInputEvent, context: EventContext): void | boolean {}
  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedEventContext
  ): void | boolean {}
  handleCompositionEnd(
    e: CompositionEvent,
    context: RangedEventContext
  ): void | boolean {}
  handleCompositionStart(
    e: CompositionEvent,
    context: RangedEventContext
  ): void | boolean {}
  handleCompositionUpdate(
    e: CompositionEvent,
    context: RangedEventContext
  ): void | boolean {}
}

export interface KeyDispatchedHandler {
  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): void | boolean;
  handleKeyUp(e: KeyboardEvent, context: RangedEventContext): void | boolean;

  handleEnterDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean;
  handleSpaceDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean;
  handleTabDown?(e: KeyboardEvent, context: RangedEventContext): void | boolean;
  handleArrowKeyDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean;
  handleDeleteDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean;
  handleBackspaceDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean;
  handleEscapeDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean;
  handleHomeDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean;
  handleEndDown?(e: KeyboardEvent, context: RangedEventContext): void | boolean;
  handlePageUpDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean;
  handlePageDownDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean;

  handleEnterUp?(e: KeyboardEvent, context: RangedEventContext): void | boolean;
  handleSpaceUp?(e: KeyboardEvent, context: RangedEventContext): void | boolean;
  handleTabUp?(e: KeyboardEvent, context: RangedEventContext): void | boolean;
  handleArrowKeyUp?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean;
  handleDeleteUp?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean;
  handleBackspaceUp?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean;
  handleEscapeUp?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean;
  handleHomeUp?(e: KeyboardEvent, context: RangedEventContext): void | boolean;
  handleEndUp?(e: KeyboardEvent, context: RangedEventContext): void | boolean;
  handlePageUpUp?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean;
  handlePageDownUp?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): void | boolean;
}

export function dispatchKeyDown(
  handler: KeyDispatchedHandler,
  e: KeyboardEvent,
  context: RangedEventContext
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
}
