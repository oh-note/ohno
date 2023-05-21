import {
  InlineRangedEventContext,
  RangedBlockEventContext,
  InlineHandler,
  InlineEventContext,
  dispatchKeyEvent,
} from "@ohno-editor/core/system/handler";
import { TodoItem } from "./inline";
import { NodeInsert } from "@ohno-editor/core/contrib/commands/html";
import { ListCommandBuilder } from "@ohno-editor/core/contrib/commands/concat";
import { InlineSupport } from "@ohno-editor/core/contrib/plugins/inlineSupport/plugin";
import { TextDelete } from "@ohno-editor/core/contrib/commands";
import { tryGetDefaultRange } from "@ohno-editor/core/helper";

export class TodoItemHandler implements InlineHandler {
  handleKeyboardActivated(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    if (e.code === "Space") {
      const { inline, manager } = context;
      const check = inline.querySelector("input") as HTMLInputElement;
      check.checked = !(check.checked || false);
      // manager.plugin.setActiveInline();
    }
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

  handleMouseUp(e: MouseEvent, context: InlineEventContext): boolean | void {
    const { inline, page } = context;
    const range = tryGetDefaultRange();
    if (e.target === inline.querySelector("input")) {
      const check = e.target as HTMLInputElement;
      check.checked = !(check.checked || false);
    }
    page.focusEditable();
    return true;
  }

  handleMouseDown(e: MouseEvent, context: InlineEventContext): boolean | void {}

  // handleMouseEnter(e: MouseEvent, context: InlineEventContext): boolean | void {
  //   const { inline, manager } = context;
  //   (manager as BackLink).hoverLabel(inline);
  // }

  // handleMouseLeave(e: MouseEvent, context: InlineEventContext): boolean | void {
  //   const { inline, manager } = context;
  //   (manager as BackLink).unHoverLabel(inline);
  // }

  handleEscapeDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    return true;
  }
  handleSpaceDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleEnterDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    return true;
  }

  handleClick(
    e: MouseEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    const { page } = context;
    // page.focusEditable();
    // manager.edit(inline, context);

    return true;
  }

  handleArrowKeyDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {}

  handleDeleteDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {}

  handleBackspaceDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {}

  handleArrowKeyUp(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {}

  handleInsideBeforeInput(
    e: TypedInputEvent,
    context: InlineRangedEventContext
  ): boolean | void {}

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { range, block, page } = context;

    if (!range.collapsed) {
      return;
    }
    if (e.inputType === "insertText" && (e.data === "]" || e.data === "】")) {
      const text = range.startContainer.textContent || "";
      if (text[range.startOffset - 1] === e.data) {
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
          .withLazyCommand(({ page, block, index }) => {
            return new TextDelete({
              page,
              block,
              start: bias,
              index,
              token_number: -1,
            });
          })
          .withLazyCommand(({ page, block, index, node }) => {
            return new NodeInsert({
              page,
              block,
              index,
              start: bias - 1,
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
