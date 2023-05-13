import {
  EventContext,
  Handler,
  FineHandlerMethods,
  RangedEventContext,
  dispatchKeyEvent,
} from "@/system/handler";
import { Toolbar } from "./plugin";

export class ToolbarPluginHandler
  extends Handler
  implements FineHandlerMethods
{
  handleKeyPress(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleKeyUp(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleMouseDown(e: MouseEvent, context: EventContext): boolean | void {
    console.log(e);
    const { page, block, endBlock } = context;
    if (!endBlock) {
      const plugin = page.getPlugin<Toolbar>("dragable");
      plugin.span(block);
    }
  }

  handleArrowKeyUp(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    const { page, block, endBlock } = context;
    if (!endBlock) {
      const plugin = page.getPlugin<Toolbar>("dragable");
      plugin.span(block);
    }
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
}
