import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  RangedEventContext,
  dispatchKeyDown,
} from "@/system/handler";

export class EquationHandler extends Handler implements KeyDispatchedHandler {
  name: string = "equation";
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}

  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
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
