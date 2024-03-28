import {
  InlineRangedEventContext,
  RangedBlockEventContext,
  InlineHandler,
  InlineEventContext,
  ListCommandBuilder,
} from "@ohno/core/system/types";
import {
  dispatchKeyEvent,
  getValidAdjacent,
} from "@ohno/core/system/functional";
import { KeyLabel } from "./inline";
import { NodeInsert } from "@ohno/core/contrib/commands/html";
import { InlineSupport } from "@ohno/core/system/inline";
import { TextDelete } from "@ohno/core/contrib/commands";

export class KeyLabelHandler implements InlineHandler<KeyLabel> {
  handleKeyboardActivated(
    e: KeyboardEvent,
    context: InlineRangedEventContext<KeyLabel>
  ): boolean | void {
    const { manager, inline } = context;
    manager.activate(inline, context);
  }
  handleKeyboardDeActivated(
    e: KeyboardEvent,
    context: InlineRangedEventContext<KeyLabel>
  ): void {
    const { manager, inline } = context;
    manager.exit();
  }
  handleMouseActivated(
    e: MouseEvent,
    context: InlineEventContext<KeyLabel>
  ): boolean | void {
    const { manager, inline } = context;
    manager.activate(inline, context);
  }
  handleMouseDeActivated(
    e: MouseEvent,
    context: InlineEventContext<KeyLabel>
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
    const { page, manager, inline } = context;

    const res = dispatchKeyEvent(this, e, context);
    if (res) {
      return true;
    }

    if (
      e.key === "Shift" ||
      e.key === "Meta" ||
      e.key === "Alt" ||
      e.key === "Control"
    ) {
      return true;
    }

    (manager as KeyLabel).update(e, context);
    // (manager as KeyLabel).rangeToLeft();
    return true;
  }

  handleEscapeDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    const { page, manager, inline } = context;
    (manager as KeyLabel).exit();
    page.setLocation(getValidAdjacent(inline, "beforebegin"));
    return true;
  }

  handleEnterDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    const { manager, page, inline } = context;
    (manager as KeyLabel).exit();
    if (e.shiftKey) {
      page.setLocation(getValidAdjacent(inline, "beforebegin"));
    } else {
      page.setLocation(getValidAdjacent(inline, "afterend"));
    }
    return true;
  }

  handleMouseDown(e: MouseEvent, context: InlineEventContext): boolean | void {}

  handleClick(
    e: MouseEvent,
    context: InlineEventContext<KeyLabel>
  ): boolean | void {
    const { range, inline, manager } = context;
    manager.activate(inline, context);
    return true;
  }

  handleInsideBeforeInput(
    e: TypedInputEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    return true;
  }

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { range, block, page } = context;

    if (!range.collapsed) {
      return;
    }
    if (e.inputType === "insertText" && e.data === "|") {
      const text = range.startContainer.textContent || "";
      if (text[range.startOffset - 1] === e.data) {
        const plugin = page.getPlugin<InlineSupport>("inlinesupport");
        const manager = plugin.getInlineManager<KeyLabel>("backlink");

        const node = manager.create({ code: "Unidentified" });

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
              token_number: -1,
            });
          })
          .addLazyCommand(({ page, block, index, node }) => {
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
