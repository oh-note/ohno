import { EventContext, Handler } from "@/system/handler";

export class DebuggerHandler extends Handler {
  handleCopy(e: ClipboardEvent, context: EventContext): void | boolean {
    console.log("handleCopy", e, context.block);
  }
  handlePaste(e: ClipboardEvent, context: EventContext): void | boolean {
    console.log("handlePaste", e, context.block);
  }
  handleBlur(e: FocusEvent, context: EventContext): void | boolean {
    console.log("handleBlur", e, context.block);
  }
  handleFocus(e: FocusEvent, context: EventContext): void | boolean {
    const sel = document.getSelection();
    if (sel && sel.rangeCount > 0) {
      console.log("handleFocus", e, context.block);
    }
  }
  handleKeyDown(e: KeyboardEvent, context: EventContext): void | boolean {
    console.log("handleKeyDown", e, context.block);
  }
  handleKeyPress(e: KeyboardEvent, context: EventContext): void | boolean {
    console.log("handleKeyPress", e, context.block);
  }
  handleKeyUp(e: KeyboardEvent, context: EventContext): void | boolean {
    console.log("handleKeyUp", e, context.block);
  }
  handleMouseDown(e: MouseEvent, context: EventContext): void | boolean {
    console.log("handleMouseDown", e, context.block);
  }
  handleMouseEnter(e: MouseEvent, context: EventContext): void | boolean {
    console.log("handleMouseEnter", e, context.block);
  }
  handleMouseMove(e: MouseEvent, context: EventContext): void | boolean {
    console.log("handleMouseMove", e, context.block);
  }
  handleMouseLeave(e: MouseEvent, context: EventContext): void | boolean {
    console.log("handleMouseLeave", e, context.block);
  }
  handleMouseUp(e: MouseEvent, context: EventContext): void | boolean {
    console.log("handleMouseUp", e, context.block);
  }
  handleClick(e: MouseEvent, context: EventContext): void | boolean {
    console.log("handleClick", e, context.block);
  }
  handleContextMenu(e: MouseEvent, context: EventContext): void | boolean {
    console.log("handleContextMenu", e, context.block);
  }
  handleInput(e: Event, context: EventContext): void | boolean {
    console.log("handleInput", e, context.block);
  }
  handleBeforeInput(e: InputEvent, context: EventContext): void | boolean {
    console.log("handleBeforeInput", e, context.block);
  }
  handleCompositionEnd(
    e: CompositionEvent,
    context: EventContext
  ): void | boolean {
    console.log("handleCompositionEnd", e, context.block);
  }
  handleCompositionStart(
    e: CompositionEvent,
    context: EventContext
  ): void | boolean {
    console.log("handleCompositionStart", e, context.block);
  }
  handleCompositionUpdate(
    e: CompositionEvent,
    context: EventContext
  ): void | boolean {
    console.log("handleCompositionUpdate", e, context.block);
  }
}
