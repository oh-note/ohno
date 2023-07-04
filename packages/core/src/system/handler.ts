// 事件系统可以处理的事件的定义
import { IInline } from "./base";
import { AnyBlock } from "./block";
import { Page } from "./page";
import {
  BlockActiveEvent,
  BlockDeActiveEvent,
  BlockInvalideLocationEvent,
  BlockSelectChangeEvent,
  BlockUpdateEvent,
  PageRedoEvent,
  PageUndoEvent,
} from "./pageevent";

export interface HandlerOption {
  [key: string]: any;
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

export interface BlockEventContext {
  page: Page;
  block: AnyBlock;
  endBlock?: AnyBlock;
  range?: Range;
  isMultiBlock?: boolean;
}

export interface RangedBlockEventContext extends BlockEventContext {
  range: Range;
}

export interface InlineEventContext<T = IInline> extends BlockEventContext {
  inline: HTMLLabelElement;
  manager: T;
}
export interface InlineRangedEventContext<T = IInline>
  extends RangedBlockEventContext {
  inline: HTMLLabelElement;
  manager: T;
}

export interface MultiBlockEventContext extends BlockEventContext {
  // page: Page;
  // block: IBlock;
  isMultiBlock: boolean;
  endBlock: AnyBlock;
  range: Range;
  blocks: AnyBlock[];
}

export type HandlerMethod<K = Event, T = BlockEventContext> = (
  this: PagesHandleMethods,
  e: K,
  context: T
) => boolean | void;

export interface ClipboardEventHandleMethods<
  T extends RangedBlockEventContext = RangedBlockEventContext
> {
  handleCopy?(e: ClipboardEvent, context: T): void | boolean;
  handleCut?(e: ClipboardEvent, context: T): void | boolean;
  handlePaste?(e: ClipboardEvent, context: T): void | boolean;
}

export interface KeyboardEventHandleMethods<
  T extends RangedBlockEventContext = RangedBlockEventContext
> {
  handleKeyDown?(e: KeyboardEvent, context: T): void | boolean;
  handleKeyPress?(e: KeyboardEvent, context: T): void | boolean;
  handleKeyUp?(e: KeyboardEvent, context: T): void | boolean;
}

export interface FocusEventHandleMethods<
  T extends BlockEventContext = BlockEventContext
> {
  handleBlur?(e: FocusEvent, context: T): void | boolean;
  handleFocus?(e: FocusEvent, context: T): void | boolean;
}

export interface MouseEventHandleMethods<
  T extends BlockEventContext = BlockEventContext
> {
  handleMouseEnter?(e: MouseEvent, context: T): void | boolean;
  handleMouseLeave?(e: MouseEvent, context: T): void | boolean;
  handleMouseDown?(e: MouseEvent, context: T): void | boolean;
  handleMouseUp?(e: MouseEvent, context: T): void | boolean;
  handleMouseMove?(e: MouseEvent, context: T): void | boolean;
  handleClick?(e: MouseEvent, context: T): void | boolean;
  handleContextMenu?(e: MouseEvent, context: T): void | boolean;
}

export interface InputEventHandleMethods<
  T extends RangedBlockEventContext = RangedBlockEventContext
> {
  handleInput?(e: Event, context: T): void | boolean;
  handleBeforeInput?(e: TypedInputEvent, context: T): void | boolean;
  handleCompositionEnd?(e: CompositionEvent, context: T): void | boolean;
  handleCompositionStart?(e: CompositionEvent, context: T): void | boolean;
  handleCompositionUpdate?(e: CompositionEvent, context: T): void | boolean;
}
export interface WindowEventHandleMethods {
  handleResize?(e: Event, context: any): void;
}

export interface UIEventHandleMethods
  extends ClipboardEventHandleMethods,
    KeyboardEventHandleMethods,
    FocusEventHandleMethods,
    MouseEventHandleMethods,
    InputEventHandleMethods,
    WindowEventHandleMethods {}

export interface ControlKeyEventHandleMethods<
  T extends RangedBlockEventContext = RangedBlockEventContext
> {
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
export interface BlockEventHandleMethods {
  handlePageUndo?(e: PageUndoEvent, context: BlockEventContext): boolean | void;
  handlePageRedo?(e: PageRedoEvent, context: BlockEventContext): boolean | void;
  handleBlockInvalideLocation?(
    e: BlockInvalideLocationEvent,
    context: BlockEventContext
  ): boolean | void;
  handleBlockUpdated?(e: BlockUpdateEvent, context: any): void;
  handleBlockActivated?(e: BlockActiveEvent, context: any): void;
  handleBlockDeActivated?(e: BlockDeActiveEvent, context: any): void;
  handleBlockSelectChange?(e: BlockSelectChangeEvent, context: any): void;
}

export interface InlineEventHandleMethods {}

export interface PagesHandleMethods
  extends UIEventHandleMethods,
    ControlKeyEventHandleMethods,
    BlockEventHandleMethods {}

export interface HandlerMethods
  extends BlockEventHandleMethods,
    UIEventHandleMethods {}

export interface InlineHandleMethods {}

export interface InlineHandler<T = IInline>
  extends ControlKeyEventHandleMethods<InlineRangedEventContext<T>>,
    ClipboardEventHandleMethods<InlineRangedEventContext<T>>,
    KeyboardEventHandleMethods<InlineRangedEventContext<T>>,
    MouseEventHandleMethods<InlineEventContext<T>>,
    InputEventHandleMethods<RangedBlockEventContext> {
  handleActivated?(e: InlineEventContext<T>, context: any): void | boolean;
  handleDeActivated?(e: InlineEventContext<T>, context: any): void | boolean;
  handleKeyboardEnter?(
    e: KeyboardEvent,
    context: InlineRangedEventContext<T>
  ): void | boolean;
  handleKeyboardLeave?(
    e: KeyboardEvent,
    context: InlineRangedEventContext<T>
  ): void | boolean;
  handleKeyboardDeActivated?(
    e: KeyboardEvent,
    context: InlineRangedEventContext<T>
  ): void | boolean;
  handleMouseDeActivated?(
    e: MouseEvent,
    context: InlineEventContext<T>
  ): void | boolean;
  /** 第一次在 [label, 0] 位置时按下 Enter/Space 触发 */
  handleKeyboardActivated?(
    e: KeyboardEvent,
    context: InlineRangedEventContext<T>
  ): void | boolean;
  /** 第一次（之前非 activated 状态）鼠标点击时出发，后续不再触发 */
  handleMouseActivated?(
    e: MouseEvent,
    context: InlineEventContext<T>
  ): void | boolean;

  handleInsideBeforeInput?(
    e: TypedInputEvent,
    context: InlineRangedEventContext<T>
  ): void | boolean;
}

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
