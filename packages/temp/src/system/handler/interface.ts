// 事件系统可以处理的事件的定义
// import { IInline } from "./base";
import {
  BlockActiveEvent,
  BlockDeActiveEvent,
  BlockInvalideLocationEvent,
  BlockSelectChangeEvent,
  BlockUpdateEvent,
  Dict,
  IInline,
  PageRedoEvent,
  PageUndoEvent,
} from "../types";
import {
  BlockEventContext,
  InlineEventContext,
  InlineRangedEventContext,
  RangedBlockEventContext,
} from "./context";

export type HandlerOption = Dict;

export interface RawHandlerMethods {
  handleCopy?(e: ClipboardEvent): void | boolean;
  handleCut?(e: ClipboardEvent): void | boolean;
  handlePaste?(e: ClipboardEvent): void | boolean;
  handleBlur?(e: FocusEvent): void | boolean;
  handleFocus?(e: FocusEvent): void | boolean;
  handleKeyDown?(e: KeyboardEvent): void | boolean;
  handleKeyPress?(e: KeyboardEvent): void | boolean;
  handleKeyUp?(e: KeyboardEvent): void | boolean;
  handleMouseDown?(e: MouseEvent): void | boolean;
  handleMouseEnter?(e: MouseEvent): void | boolean;
  handleMouseLeave?(e: MouseEvent): void | boolean;
  handleMouseMove?(e: MouseEvent): void | boolean;
  handleMouseUp?(e: MouseEvent): void | boolean;
  handleClick?(e: MouseEvent): void | boolean;
  handleContextMenu?(e: MouseEvent): void | boolean;
  handleInput?(e: Event): void | boolean;
  handleBeforeInput?(e: InputEvent): void | boolean;
  handleDrop?(e: DragEvent): void | boolean;
  handleSelectStart?(e: Event): void | boolean;
  handleSelectionChange?(e: Event): void | boolean;
  handleSelect?(e: Event): void | boolean;
  handleCompositionEnd?(e: CompositionEvent): void | boolean;
  handleCompositionStart?(e: CompositionEvent): void | boolean;
  handleCompositionUpdate?(e: CompositionEvent): void | boolean;
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
  handleClick?(e: MouseEvent, context: RangedBlockEventContext): void | boolean;
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
