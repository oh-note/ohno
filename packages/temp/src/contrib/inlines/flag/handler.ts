import {
  InlineRangedEventContext,
  InlineHandler,
  InlineEventContext,
} from "@ohno/core/system/types";
import {
  dispatchKeyEvent,
  getValidAdjacent,
  tryGetDefaultRange,
} from "@ohno/core/system/functional";
import { defaultSelection } from "@ohno/core/system/selection";
import { Flag } from "./inline";
import { defaultHandleBeforeInput } from "@ohno/core/core/default/functional/beforeInput";

export class FlagHandler implements InlineHandler<Flag> {
  handleKeyboardActivated(
    e: KeyboardEvent,
    context: InlineRangedEventContext<Flag>
  ): boolean | void {
    const { inline, manager } = context;
    manager.hover(inline, context);
    manager.toggleCheckbox();
    manager.plugin.setHoveredInline("cursor");
    manager.plugin.setHoveredInline("mouse");
    manager.plugin.setActiveInline();
    manager.exit();
  }
  handleKeyboardDeActivated(
    e: KeyboardEvent,
    context: InlineRangedEventContext<Flag>
  ): void {
    const { manager, inline } = context;
    manager.exit();
  }
  handleMouseActivated(
    e: MouseEvent,
    context: InlineEventContext<Flag>
  ): boolean | void {
    const { manager, inline } = context;
    manager.hover(inline, context);
    manager.toggleCheckbox();
    manager.plugin.setHoveredInline("cursor");
    manager.plugin.setHoveredInline("mouse");
    manager.plugin.setActiveInline();
    manager.exit();
    return true;
  }
  handleMouseDeActivated(
    e: MouseEvent,
    context: InlineEventContext<Flag>
  ): void {
    const { manager, inline } = context;
    manager.exit();
  }

  handleKeyPress(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {}
  handleKeyDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleKeyUp(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleMouseUp(
    e: MouseEvent,
    context: InlineEventContext<Flag>
  ): boolean | void {
    const { inline, page, manager } = context;
    const range = tryGetDefaultRange();
    manager.toggleCheckbox();
    manager.plugin.setHoveredInline("cursor", inline);
    manager.plugin.setActiveInline();

    return true;
  }

  handleMouseDown(e: MouseEvent, context: InlineEventContext): boolean | void {
    return true;
  }

  handleClick(
    e: MouseEvent,
    context: InlineEventContext<Flag>
  ): boolean | void {
    return true;
  }

  // handleMouseEnter(e: MouseEvent, context: InlineEventContext): boolean | void {
  //   const { inline, manager } = context;
  //   manager.hoverLabel(inline);
  // }

  // handleMouseLeave(e: MouseEvent, context: InlineEventContext): boolean | void {
  //   const { inline, manager } = context;
  //   manager.unHoverLabel(inline);
  // }

  handleEscapeDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    return true;
  }
  handleSpaceDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext<Flag>
  ): boolean | void {
    if (e.shiftKey) {
      const { manager } = context;
      manager.toggleCheckbox();
      return true;
    }
  }
  handleTabDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext<Flag>
  ): boolean | void {
    const { manager } = context;
    manager.toggleCheckbox();
    return true;
  }
  handleEnterDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext<Flag>
  ): boolean | void {
    const { page, inline, manager } = context;
    // manager.simulateEnter();
    page.setLocation(getValidAdjacent(inline, "afterend"));
    manager.exit();
    return true;
  }

  handleBackspaceDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    const { range, manager, inline } = context;
    if (range.collapsed) {
      const slot = inline.querySelector("q")!;
      if (
        !defaultSelection.getPrevLocation(
          [range.startContainer, range.startOffset],
          slot
        )
      ) {
        return true;
      }
    }
  }

  handleArrowKeyUp(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {}

  handleInsideBeforeInput(
    e: TypedInputEvent,
    context: InlineRangedEventContext<Flag>
  ): boolean | void {
    const inputType = e.inputType as InputType;
    const { manager } = context;
    const res = defaultHandleBeforeInput(this, e, context, () => false);

    return res;
  }
}
