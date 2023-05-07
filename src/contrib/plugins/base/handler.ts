import {
  EventContext,
  Handler,
  HandlerMethods,
  FineHandlerMethods,
  RangedEventContext,
  dispatchKeyEvent,
} from "@/system/handler";

export class ExamplePluginHandler
  extends Handler
  implements FineHandlerMethods, HandlerMethods
{
  handleKeyPress(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleKeyUp(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleMouseDown(e: MouseEvent, context: EventContext): boolean | void {
    return true;
  }

  handleDeleteDown(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleBackspaceDown(
    e: KeyboardEvent,
    context: EventContext
  ): boolean | void {}

  handleEnterDown(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleSpaceDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}

  handleBeforeInput(
    e: InputEvent,
    context: RangedEventContext
  ): boolean | void {}
}
