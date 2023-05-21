import {
  BlockEventContext,
  Handler,
  FineHandlerMethods,
  RangedBlockEventContext,
  dispatchKeyEvent,
} from "@ohno-editor/core/system/handler";
import { Toolbar } from "./plugin";

export class ToolbarPluginHandler
  extends Handler
  implements FineHandlerMethods
{
  handleKeyPress(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {}
  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleKeyUp(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleMouseDown(e: MouseEvent, context: BlockEventContext): boolean | void {
    console.log(e);
    const { page, block, endBlock } = context;
    if (!endBlock) {
      const plugin = page.getPlugin<Toolbar>("dragable");
      plugin.span(block);
    }
  }

  handleArrowKeyUp(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page, block, endBlock } = context;
    if (!endBlock) {
      const plugin = page.getPlugin<Toolbar>("dragable");
      plugin.span(block);
    }
  }
  handleDeleteDown(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {}
  handleBackspaceDown(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {}

  handleEnterDown(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {}
  handleSpaceDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
}
