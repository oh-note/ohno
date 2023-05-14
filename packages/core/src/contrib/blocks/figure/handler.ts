import {
  EventContext,
  Handler,
  FineHandlerMethods,
  RangedEventContext,
  dispatchKeyEvent,
} from "@ohno-editor/core/system/handler";

export class FigureHandler extends Handler implements FineHandlerMethods {
  name: string = "figure";
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}

  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }
  // 在 CompositionStart 时处理选中内容
  handleCompositionStart(
    e: CompositionEvent,
    context: RangedEventContext
  ): boolean | void {
    return true;
  }
  handleDeleteDown(e: KeyboardEvent, context: EventContext): boolean | void {
    return true;
  }

  handleTabDown(e: KeyboardEvent, context: EventContext): boolean | void {
    return true;
  }

  handleBackspaceDown(e: KeyboardEvent, context: EventContext): boolean | void {
    // 向前合并
    return true;
  }

  handleEnterDown(e: KeyboardEvent, context: EventContext): boolean | void {
    return true;
  }

  handleBeforeInput(e: TypedInputEvent, context: EventContext): boolean | void {
    // const { block, page, range } = context;
    return true;
  }
}
