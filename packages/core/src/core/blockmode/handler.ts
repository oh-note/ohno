import {
  MultiBlockEventContext,
  RangedBlockEventContext,
  PagesHandleMethods,
} from "@ohno-editor/core/system/handler";
import { defaultHandleArrowDown } from "../default/functional/arrowDown";
import {
  createRange,
  normalizeContainer,
  setRange,
} from "@ohno-editor/core/system/range";
import { OhNoClipboardData } from "@ohno-editor/core/system/base";

export class BlockModeHandler implements PagesHandleMethods {
  handleBlur(e: FocusEvent, context: MultiBlockEventContext): void | boolean {
    console.log("handleBlur", e, context.block);
  }
  handleEnterDown(
    e: KeyboardEvent,
    context: MultiBlockEventContext
  ): boolean | void {
    return true;
  }
  handleKeyDown(
    e: KeyboardEvent,
    context: MultiBlockEventContext
  ): boolean | void {}

  handleKeyPress(
    e: KeyboardEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleKeyPress", e, context.block);
  }
  handleKeyUp(
    e: KeyboardEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleKeyUp", e, context.block);
  }
  handleMouseDown(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleMouseDown", e, context.block);
  }
  handleMouseEnter(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleMouseEnter", e, context.block);
  }
  handleMouseMove(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleMouseMove", e, context.block);
  }
  handleArrowKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return defaultHandleArrowDown(this, e, context);
  }
  handleMouseLeave(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleMouseLeave", e, context.block);
  }

  handleClick(e: MouseEvent, context: MultiBlockEventContext): void | boolean {
    console.log("handleClick", e, context.block);
  }
  handleContextMenu(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleContextMenu", e, context.block);
  }
  handleInput(e: Event, context: MultiBlockEventContext): void | boolean {
    console.log("handleInput", e, context.block);
  }
  handleBeforeInput(
    e: TypedInputEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    return true;
  }
  handleCompositionEnd(
    e: CompositionEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleCompositionEnd", e, context.block);
  }
  handleCompositionStart(
    e: CompositionEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    return true;
  }
  handleCompositionUpdate(
    e: CompositionEvent,
    context: MultiBlockEventContext
  ): void | boolean {}
}
