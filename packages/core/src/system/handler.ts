// 事件系统可以处理的事件的定义
import { IInline } from "./base";
import { AnyBlock } from "./block";
import { Page } from "./page";
import {
  BlockActiveEvent,
  BlockDeActiveEvent,
  BlockUpdateEvent,
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

export type HandlerMethod<K> = (
  this: Handler,
  e: K,
  context: BlockEventContext
) => boolean | void;

export type MultiBlockHandlerMethod<K> = (
  this: Handler,
  e: K,
  context: MultiBlockEventContext
) => boolean | void;

export interface HandlerMethods {
  handleBlockUpdated?(e: BlockUpdateEvent, context: any): void | boolean;
  handleBlockActivated?(e: BlockActiveEvent, context: any): void | boolean;
  handleBlockDeActivated?(e: BlockDeActiveEvent, context: any): void | boolean;
  //   window.addEventListener('resize', function() {
  //     // 在这里编写当浏览器大小改变时要执行的代码
  //     console.log('浏览器大小已改变');
  // });
  handleResize?(e: Event, context: any): void;
  // handlePageCreated?(e: PageCreateEvent): void;
  // // handleBlockSelected?(e:)
  // handleBlockCreated?(e: PageCreateEvent): void;
  // handleBlockRemoved?(e: PageCreateEvent): void;
  // handlePluginLoaded?(e: PageCreateEvent): void;
  handleSelect?(e: Event, context: BlockEventContext): void | boolean;
  handleSelectionChange?(e: Event, context: BlockEventContext): void | boolean;
  handleSelectStart?(e: Event, context: BlockEventContext): void | boolean;
  handleCopy?(e: ClipboardEvent, context: BlockEventContext): void | boolean;
  handlePaste?(e: ClipboardEvent, context: BlockEventContext): void | boolean;
  handleBlur?(e: FocusEvent, context: BlockEventContext): void | boolean;
  handleFocus?(e: FocusEvent, context: BlockEventContext): void | boolean;
  handleKeyDown?(e: KeyboardEvent, context: BlockEventContext): void | boolean;
  handleKeyPress?(e: KeyboardEvent, context: BlockEventContext): void | boolean;
  handleKeyUp?(e: KeyboardEvent, context: BlockEventContext): void | boolean;
  handleMouseEnter?(e: MouseEvent, context: BlockEventContext): void | boolean;
  handleMouseLeave?(e: MouseEvent, context: BlockEventContext): void | boolean;
  handleMouseDown?(e: MouseEvent, context: BlockEventContext): void | boolean;
  handleMouseUp?(e: MouseEvent, context: BlockEventContext): void | boolean;
  handleMouseMove?(e: MouseEvent, context: BlockEventContext): void | boolean;
  handleClick?(e: MouseEvent, context: BlockEventContext): void | boolean;
  handleContextMenu?(e: MouseEvent, context: BlockEventContext): void | boolean;
  handleInput?(e: Event, context: BlockEventContext): void | boolean;
  handleBeforeInput?(
    e: InputEvent,
    context: RangedBlockEventContext
  ): void | boolean;
  handleCompositionEnd?(
    e: CompositionEvent,
    context: BlockEventContext
  ): void | boolean;
  handleCompositionStart?(
    e: CompositionEvent,
    context: BlockEventContext
  ): void | boolean;
  handleCompositionUpdate?(
    e: CompositionEvent,
    context: BlockEventContext
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
    context: RangedBlockEventContext
  ): boolean | void {}
  handleKeyUp?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleEnterDown?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleSpaceDown?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleTabDown?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleArrowKeyDown?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleDeleteDown?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleBackspaceDown?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleEscapeDown?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleHomeDown?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleEndDown?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handlePageUpDown?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handlePageDownDown?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleEnterUp?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleSpaceUp?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleTabUp?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleArrowKeyUp?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleDeleteUp?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleBackspaceUp?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleEscapeUp?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleHomeUp?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleEndUp?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handlePageUpUp?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handlePageDownUp?(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}

  handleSelect?(e: Event, context: BlockEventContext): boolean | void {}
  handleSelectionChange?(
    e: Event,
    context: BlockEventContext
  ): boolean | void {}
  handleSelectStart?(e: Event, context: BlockEventContext): boolean | void {}
  handleCopy?(e: ClipboardEvent, context: BlockEventContext): boolean | void {}
  handlePaste?(e: ClipboardEvent, context: BlockEventContext): boolean | void {}
  handleBlur?(e: FocusEvent, context: BlockEventContext): boolean | void {}
  handleFocus?(e: FocusEvent, context: BlockEventContext): boolean | void {}
  handleKeyDown?(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {}
  handleKeyPress?(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {}
  handleMouseDown?(e: MouseEvent, context: BlockEventContext): boolean | void {}
  handleMouseEnter?(
    e: MouseEvent,
    context: BlockEventContext
  ): boolean | void {}
  handleMouseLeave?(
    e: MouseEvent,
    context: BlockEventContext
  ): boolean | void {}
  handleMouseUp?(e: MouseEvent, context: BlockEventContext): boolean | void {}
  handleMouseMove?(e: MouseEvent, context: BlockEventContext): boolean | void {}
  handleClick?(e: MouseEvent, context: BlockEventContext): boolean | void {}
  handleContextMenu?(
    e: MouseEvent,
    context: BlockEventContext
  ): boolean | void {}
  handleInput?(e: Event, context: BlockEventContext): boolean | void {}
  handleBeforeInput?(
    e: InputEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleCompositionEnd?(
    e: CompositionEvent,
    context: BlockEventContext
  ): boolean | void {}
  handleCompositionStart?(
    e: CompositionEvent,
    context: BlockEventContext
  ): boolean | void {}
  handleCompositionUpdate?(
    e: CompositionEvent,
    context: BlockEventContext
  ): boolean | void {}
}

export interface FineHandlerMethods<
  T extends RangedBlockEventContext = RangedBlockEventContext
> extends HandlerMethods {
  handleKeyDown?(e: KeyboardEvent, context: T): void | boolean;
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

export interface InlineHandler<T = IInline>
  extends FineHandlerMethods<InlineRangedEventContext<T>> {
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

  // handleDeActivated?(): void | boolean;

  handleKeyDown?(
    e: KeyboardEvent,
    context: InlineRangedEventContext<T>
  ): void | boolean;
  handleKeyUp?(
    e: KeyboardEvent,
    context: InlineRangedEventContext<T>
  ): void | boolean;

  handleKeyPress?(
    e: KeyboardEvent,
    context: InlineRangedEventContext<T>
  ): void | boolean;

  handleMouseDown?(
    e: MouseEvent,
    context: InlineEventContext<T>
  ): void | boolean;
  handleMouseUp?(e: MouseEvent, context: InlineEventContext<T>): void | boolean;
  handleMouseMove?(
    e: MouseEvent,
    context: InlineEventContext<T>
  ): void | boolean;
  handleMouseEnter?(
    e: MouseEvent,
    context: InlineEventContext<T>
  ): void | boolean;
  handleMouseLeave?(
    e: MouseEvent,
    context: InlineEventContext<T>
  ): void | boolean;
  handleClick?(e: MouseEvent, context: InlineEventContext<T>): void | boolean;
  handleContextMenu?(
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
