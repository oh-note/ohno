import {
  InlineRangedEventContext,
  RangedBlockEventContext,
  InlineHandler,
  InlineEventContext,
  ListCommandBuilder,
} from "@ohno-editor/core/system/types";
import {
  tryGetDefaultRange,
  dispatchKeyEvent,
  getValidAdjacent,
} from "@ohno-editor/core/system/functional";
import { defaultSelection } from "@ohno-editor/core/system/selection";

import { TodoItem } from "./inline";
import { NodeInsert } from "@ohno-editor/core/contrib/commands/html";
import { InlineSupport } from "@ohno-editor/core/system/inline";
import { TextDelete } from "@ohno-editor/core/contrib/commands";
import { defaultHandleBeforeInput } from "@ohno-editor/core/core/default/functional/beforeInput";

export class TodoItemHandler implements InlineHandler<TodoItem> {
  handleKeyboardActivated(
    e: KeyboardEvent,
    context: InlineRangedEventContext<TodoItem>
  ): boolean | void {
    const { inline, manager } = context;
    if (e.code === "Space") {
      manager.hover(inline, context);
      manager.toggleCheckbox();
      manager.plugin.setHoveredInline("cursor", inline);
      manager.plugin.setActiveInline();
    } else {
      manager.activate(inline, context);
    }
  }
  handleKeyboardDeActivated(
    e: KeyboardEvent,
    context: InlineRangedEventContext<TodoItem>
  ): void {
    const { manager, inline } = context;
    manager.exit();
  }
  handleMouseActivated(
    e: MouseEvent,
    context: InlineEventContext<TodoItem>
  ): boolean | void {
    const { manager, inline } = context;
    manager.activate(inline, context);
  }
  handleMouseDeActivated(
    e: MouseEvent,
    context: InlineEventContext<TodoItem>
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
    context: InlineEventContext<TodoItem>
  ): boolean | void {
    const { inline, page, manager } = context;
    const range = tryGetDefaultRange();
    if (e.target === inline.querySelector("input")) {
      manager.toggleCheckbox();
      manager.activate(inline, context);
      page.focusEditable();
    }
    return true;
  }

  handleMouseDown(e: MouseEvent, context: InlineEventContext): boolean | void {
    return;
  }

  handleClick(
    e: MouseEvent,
    context: InlineEventContext<TodoItem>
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
    context: InlineRangedEventContext<TodoItem>
  ): boolean | void {
    if (e.shiftKey) {
      const { manager } = context;
      manager.toggleCheckbox();
      return true;
    }
  }
  handleTabDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext<TodoItem>
  ): boolean | void {
    const { manager } = context;
    manager.toggleCheckbox();
    return true;
  }
  handleEnterDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext<TodoItem>
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
      const slot = inline.querySelector("data")!;
      // debugger;
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
  ): boolean | void {
    // const { block, range, manager, page, inline, first } = context;
    // if (first) {
    //   if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    //     const slot = inline.querySelector("q")!;
    //     const loc = biasToLocation(slot, 0)!;
    //     page.setLocation(loc, block);
    //   }
    //   return true;
    // }
  }

  handleInsideBeforeInput(
    e: TypedInputEvent,
    context: InlineRangedEventContext<TodoItem>
  ): boolean | void {
    const inputType = e.inputType as InputType;
    const { manager } = context;
    const res = defaultHandleBeforeInput(this, e, context, () => false);

    return res;
  }

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { range, block, page } = context;

    if (!range.collapsed) {
      return;
    }
    if (e.inputType === "insertText" && (e.data === "]" || e.data === "】")) {
      const text = (range.startContainer.textContent || "").slice(
        0,
        range.startOffset
      );
      if (text.slice(-2).match(/[[【] /)) {
        const plugin = page.getPlugin<InlineSupport>("inlinesupport");
        const manager = plugin.getInlineManager<TodoItem>("todoitem");

        const node = manager.create();

        const bias = block.getBias([range.startContainer, range.startOffset]);
        const index = block.findEditableIndex(range.startContainer);
        const command = new ListCommandBuilder({
          block,
          page,
          node,
          bias,
          index,
        })
          .addLazyCommand(({ page, block, index }) => {
            return new TextDelete({
              page,
              block,
              start: bias,
              index,
              token_number: -2,
            });
          })
          .addLazyCommand(({ page, block, index, node }) => {
            return new NodeInsert({
              page,
              block,
              index,
              start: bias - 2,
              node,
            }).onExecute(({ page }, { current }) => {
              plugin.setActiveInline(current);
              manager.activate(current, context);
            });
          })
          .build();
        page.executeCommand(command);

        return true;
      }
    }
  }
}
