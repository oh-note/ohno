// 事件系统可以处理的事件的定义
import { IInline } from "./base";
import { AnyBlock } from "./block";
import { Page } from "./page";

export interface HandlerOption {
  [key: string]: any;
}

export interface ExtraEvent {
  page: Page;
  original?: Event;
}
export interface PageCreateEvent {
  type: "pagecreated";
}
export interface BlockActivatedEvent {
  type: "blockactivated";
}
/**
 * 
 * 预计要逐步添加对下面事件的支持
BlockActivated
BlockActiveChanged
BlockCreated
BlockMoved
BlockRemoved
BlockReplaced
BlockSelectionChanged
BlockUpdated
 */

export interface PageEventContext {
  page: Page;
}

export interface EventContext {
  page: Page;
  block: AnyBlock;
  endBlock?: AnyBlock;
  range?: Range;
  isMultiBlock?: boolean;
}

export interface RangedEventContext extends EventContext {
  range: Range;
}

export interface InlineEventContext extends EventContext {
  first: boolean;
  inline: HTMLLabelElement;
  manager: IInline;
}
export interface InlineRangedEventContext extends RangedEventContext {
  first: boolean;
  inline: HTMLLabelElement;
  manager: IInline;
}

export interface MultiBlockEventContext extends EventContext {
  // page: Page;
  // block: IBlock;
  isMultiBlock: boolean;
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
  handlePageCreated?(e: PageCreateEvent): void;
  handleBlockCreated?(e: PageCreateEvent): void;
  handleBlockRemoved?(e: PageCreateEvent): void;
  handleBlockUpdated?(e: PageCreateEvent): void;
  handlePluginLoaded?(e: PageCreateEvent): void;
  handleSelect?(e: Event, context: EventContext): void | boolean;
  handleSelectionChange?(e: Event, context: EventContext): void | boolean;
  handleSelectStart?(e: Event, context: EventContext): void | boolean;
  handleCopy?(e: ClipboardEvent, context: EventContext): void | boolean;
  handlePaste?(e: ClipboardEvent, context: EventContext): void | boolean;
  handleBlur?(e: FocusEvent, context: EventContext): void | boolean;
  handleFocus?(e: FocusEvent, context: EventContext): void | boolean;
  handleKeyDown?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleKeyPress?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleKeyUp?(e: KeyboardEvent, context: EventContext): void | boolean;
  handleMouseEnter?(e: MouseEvent, context: EventContext): void | boolean;
  handleMouseLeave?(e: MouseEvent, context: EventContext): void | boolean;
  handleMouseDown?(e: MouseEvent, context: EventContext): void | boolean;
  handleMouseUp?(e: MouseEvent, context: EventContext): void | boolean;
  handleMouseMove?(e: MouseEvent, context: EventContext): void | boolean;
  handleClick?(e: MouseEvent, context: EventContext): void | boolean;
  handleContextMenu?(e: MouseEvent, context: EventContext): void | boolean;
  handleInput?(e: Event, context: EventContext): void | boolean;
  handleBeforeInput?(
    e: InputEvent,
    context: RangedEventContext
  ): void | boolean;
  handleCompositionEnd?(
    e: CompositionEvent,
    context: EventContext
  ): void | boolean;
  handleCompositionStart?(
    e: CompositionEvent,
    context: EventContext
  ): void | boolean;
  handleCompositionUpdate?(
    e: CompositionEvent,
    context: EventContext
  ): void | boolean;
}

export class Handler<T = HandlerOption> implements FineHandlerMethods {
  option: T;
  constructor(option?: T) {
    if (!option) {
      option = {} as T;
    }
    this.option = option;
  }
  handleKeyDow?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleKeyUp?(e: KeyboardEvent, context: RangedEventContext): boolean | void {}
  handleEnterDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleSpaceDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleTabDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleArrowKeyDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleDeleteDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleBackspaceDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleEscapeDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleHomeDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleEndDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handlePageUpDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handlePageDownDown?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleEnterUp?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleSpaceUp?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleTabUp?(e: KeyboardEvent, context: RangedEventContext): boolean | void {}
  handleArrowKeyUp?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleDeleteUp?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleBackspaceUp?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleEscapeUp?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleHomeUp?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleEndUp?(e: KeyboardEvent, context: RangedEventContext): boolean | void {}
  handlePageUpUp?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handlePageDownUp?(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handlePageCreated?(e: PageCreateEvent): void {}
  handleBlockCreated?(e: PageCreateEvent): void {}
  handleBlockRemoved?(e: PageCreateEvent): void {}
  handleBlockUpdated?(e: PageCreateEvent): void {}
  handlePluginLoaded?(e: PageCreateEvent): void {}
  handleSelect?(e: Event, context: EventContext): boolean | void {}
  handleSelectionChange?(e: Event, context: EventContext): boolean | void {}
  handleSelectStart?(e: Event, context: EventContext): boolean | void {}
  handleCopy?(e: ClipboardEvent, context: EventContext): boolean | void {}
  handlePaste?(e: ClipboardEvent, context: EventContext): boolean | void {}
  handleBlur?(e: FocusEvent, context: EventContext): boolean | void {}
  handleFocus?(e: FocusEvent, context: EventContext): boolean | void {}
  handleKeyDown?(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleKeyPress?(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleMouseDown?(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseEnter?(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseLeave?(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseUp?(e: MouseEvent, context: EventContext): boolean | void {}
  handleMouseMove?(e: MouseEvent, context: EventContext): boolean | void {}
  handleClick?(e: MouseEvent, context: EventContext): boolean | void {}
  handleContextMenu?(e: MouseEvent, context: EventContext): boolean | void {}
  handleInput?(e: Event, context: EventContext): boolean | void {}
  handleBeforeInput?(
    e: InputEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleCompositionEnd?(
    e: CompositionEvent,
    context: EventContext
  ): boolean | void {}
  handleCompositionStart?(
    e: CompositionEvent,
    context: EventContext
  ): boolean | void {}
  handleCompositionUpdate?(
    e: CompositionEvent,
    context: EventContext
  ): boolean | void {}
}

export interface FineHandlerMethods<
  T extends RangedEventContext = RangedEventContext
> extends HandlerMethods {
  handleKeyDow?(e: KeyboardEvent, context: T): void | boolean;
  handleKeyUp?(e: KeyboardEvent, context: T): void | boolean;

  handleEnterDown?(e: KeyboardEvent, context: T): void | boolean;
  handleSpaceDown?(e: KeyboardEvent, context: T): void | boolean;
  handleTabDown?(e: KeyboardEvent, context: T): void | boolean;
  handleArrowKeyDown?(e: KeyboardEvent, context: T): void | boolean;
  handleDeleteDown?(e: KeyboardEvent, context: T): void | boolean;
  handleBackspaceDown?(e: KeyboardEvent, context: T): void | boolean;
  handleEscapeDown?(e: KeyboardEvent, context: T): void | boolean;
  handleHomeDown?(e: KeyboardEvent, context: T): void | boolean;
  handleEndDown?(e: KeyboardEvent, context: T): void | boolean;
  handlePageUpDown?(e: KeyboardEvent, context: T): void | boolean;
  handlePageDownDown?(e: KeyboardEvent, context: T): void | boolean;

  handleEnterUp?(e: KeyboardEvent, context: T): void | boolean;
  handleSpaceUp?(e: KeyboardEvent, context: T): void | boolean;
  handleTabUp?(e: KeyboardEvent, context: T): void | boolean;
  handleArrowKeyUp?(e: KeyboardEvent, context: T): void | boolean;
  handleDeleteUp?(e: KeyboardEvent, context: T): void | boolean;
  handleBackspaceUp?(e: KeyboardEvent, context: T): void | boolean;
  handleEscapeUp?(e: KeyboardEvent, context: T): void | boolean;
  handleHomeUp?(e: KeyboardEvent, context: T): void | boolean;
  handleEndUp?(e: KeyboardEvent, context: T): void | boolean;
  handlePageUpUp?(e: KeyboardEvent, context: T): void | boolean;
  handlePageDownUp?(e: KeyboardEvent, context: T): void | boolean;
}

export interface InlineHandler
  extends FineHandlerMethods<InlineRangedEventContext> {
  handleMouseDown?(e: MouseEvent, context: InlineEventContext): void | boolean;
  handleMouseUp?(e: MouseEvent, context: InlineEventContext): void | boolean;
  handleMouseMove?(e: MouseEvent, context: InlineEventContext): void | boolean;
  handleClick?(e: MouseEvent, context: InlineEventContext): void | boolean;
  handleContextMenu?(
    e: MouseEvent,
    context: InlineEventContext
  ): void | boolean;
  handleInsideBeforeInput?(
    e: InputEvent,
    context: InlineRangedEventContext
  ): void | boolean;
}

export function dispatchKeyEvent<
  T extends RangedEventContext = RangedEventContext
>(
  handler: FineHandlerMethods<T>,
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
}
