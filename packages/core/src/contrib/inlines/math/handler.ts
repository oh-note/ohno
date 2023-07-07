import {
  InlineRangedEventContext,
  RangedBlockEventContext,
  InlineHandler,
  InlineEventContext,
  ListCommandBuilder,
} from "@ohno-editor/core/system/types";
import { dispatchKeyEvent } from "@ohno-editor/core/system/functional";
import { KatexMath } from "./inline";

import { NodeInsert } from "@ohno-editor/core/contrib/commands/html";
import { InlineSupport } from "@ohno-editor/core/system/inline";
import { TextDelete } from "@ohno-editor/core/contrib/commands";

export class InlineMathHandler implements InlineHandler<KatexMath> {
  handleKeyboardActivated(
    e: KeyboardEvent,
    context: InlineRangedEventContext<KatexMath>
  ): boolean | void {
    const { page, inline, manager } = context;

    manager.activate(inline, context);
    return true;
  }
  handleMouseActivated(
    e: MouseEvent,
    context: InlineEventContext<KatexMath>
  ): boolean | void {
    const { page, inline, manager } = context;
    manager.activate(inline, context);
    return true;
  }
  handleKeyboardDeActivated(
    e: KeyboardEvent,
    context: InlineRangedEventContext<KatexMath>
  ): boolean | void {
    const { page, inline, manager } = context;
    manager.exit();
    return true;
  }
  handleMouseDeActivated(
    e: MouseEvent,
    context: InlineEventContext<KatexMath>
  ): void | boolean {
    const { page, inline, manager } = context;
    manager.exit();
    return true;
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

  handleMouseDown(e: MouseEvent, context: InlineEventContext): boolean | void {
    // const { page, inline, manager } = context;
    // manager.edit(inline, context);
    // return true;
  }
  handleMouseUp(e: MouseEvent, context: InlineEventContext): boolean | void {
    const { page, inline, manager } = context;
    (manager as KatexMath).activate(inline, context);
    return true;
  }

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
    const { page, inline, manager } = context;
    manager.activate(inline, context);
    return true;
  }
  handleClick(
    e: MouseEvent,
    context: InlineEventContext<KatexMath>
  ): boolean | void {}

  handleArrowKeyDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    const { manager, inline } = context;
    manager.hover(inline, context);
  }

  handleArrowKeyUp(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    // const { range, manager } = context;
    let inline;
  }

  handleInsideBeforeInput(
    e: InputEvent,
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
    if (e.inputType === "insertText" && e.data === "$") {
      let matchIndex: number;
      if (
        (matchIndex = range.startContainer.textContent!.lastIndexOf(
          "$",
          range.startOffset
        )) >= 0
      ) {
        const plugin = page.getPlugin<InlineSupport>("inlinesupport");
        const manager = plugin.getInlineManager<KatexMath>("math");

        // 删除之前的 $，创建一个 Math
        const text = range.startContainer.textContent!.slice(
          matchIndex + 1,
          range.startOffset
        );
        const node = manager.create(text);

        // debugger;
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
              token_number: -text.length - 1,
            });
          })
          .addLazyCommand(({ page, block, index, node }) => {
            return new NodeInsert({
              page,
              block,
              index,
              start: bias - text.length - 1,
              node,
            });
          })
          .build()
          .onExecute(() => {
            plugin.setActiveInline(node);
            manager.activate(node, context);
          });
        page.executeCommand(command);
        return true;
      }
    }
  }
}
