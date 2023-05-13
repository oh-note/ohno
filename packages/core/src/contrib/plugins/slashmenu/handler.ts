import {
  EventContext,
  Handler,
  FineHandlerMethods,
  RangedEventContext,
  dispatchKeyEvent,
} from "@/system/handler";
import { SlashMenu } from "./plugin";

export class SlashMenuHandler extends Handler implements FineHandlerMethods {
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
      const plugin = page.getPlugin<SlashMenu>("slashmenu");
      plugin.close();
    }
  }

  handleArrowKeyDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    const { page, block, isMultiBlock } = context;
    if (isMultiBlock) {
      return;
    }
    const plugin = page.getPlugin<SlashMenu>("slashmenu");
    if (plugin.isOpen) {
      if (plugin.visibleElements.length > 0) {
        if (e.key === "ArrowDown") {
          plugin.simulateArrowDown();
          return true;
        } else if (e.key === "ArrowUp") {
          plugin.simulateArrowUp();
          return true;
        } else {
          plugin.close();
        }
      } else {
        plugin.close();
        return true;
      }
    }
  }
  handleEscapeDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    const plugin = context.page.getPlugin<SlashMenu>("slashmenu");
    if (plugin.isOpen) {
      plugin.close();
    }
  }

  handleArrowKeyUp(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    // const { page, block, isMultiBlock } = context;
    // if (isMultiBlock) {
    //   return;
    // }
    // if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    //   const plugin = page.getPlugin<SlashMenu>("slashmenu");
    //   if (plugin.isOpen) {
    //     plugin.close();
    //   }
    // }
  }
  handleDeleteDown(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleBackspaceDown(
    e: KeyboardEvent,
    context: EventContext
  ): boolean | void {}

  handleEnterDown(e: KeyboardEvent, context: EventContext): boolean | void {
    const { page, block, isMultiBlock } = context;
    if (isMultiBlock) {
      return;
    }
    const plugin = page.getPlugin<SlashMenu>("slashmenu");
    if (plugin.isOpen) {
      if (plugin.visibleElements.length > 0) {
        plugin.simulateEnter();
      } else {
        plugin.close();
      }
      return true;
    }
  }
  handleSpaceDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    return this.handleEnterDown(e, context);
  }

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedEventContext
  ): boolean | void {
    const { page, range, block } = context;
    // 弹出条件：首次输入 /
    const slashmenu = page.getPlugin<SlashMenu>("slashmenu");
    if (e.inputType === "insertText" && e.data === "/") {
      slashmenu.open(context);
    }
    // 筛选条件：弹出条件（包括首次）下键入或删除
    if (slashmenu.isOpen) {
      const line = range.startContainer.textContent!;
      if (e.inputType === "insertText") {
        if (e.data !== "/") {
          const index = line.lastIndexOf("/", range.startOffset);
          const text =
            index === -1
              ? undefined
              : line.slice(index + 1, range.startOffset) + e.data!;
          slashmenu.setFilter(text, context);
        }
      } else if (e.inputType === "deleteContentBackward") {
        const index = line.lastIndexOf("/", range.startOffset);
        if (index === range.startOffset - 1) {
          slashmenu.close();
          return;
        }
        const text = line.slice(index + 1, range.startOffset - 1);
        slashmenu.setFilter(text, context);
      } else {
        slashmenu.close();
      }
    }
  }
}
