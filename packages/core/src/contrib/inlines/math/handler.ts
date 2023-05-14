import {
  EventContext,
  Handler,
  InlineRangedEventContext,
  FineHandlerMethods,
  RangedEventContext,
  dispatchKeyEvent,
  InlineHandler,
  InlineEventContext,
} from "@ohno-editor/core/system/handler";
import { KatexMath } from "./inline";
import { getPrevLocation } from "@ohno-editor/core/system/range";
import { NodeInsert } from "@ohno-editor/core/contrib/commands/html";
import { ListCommandBuilder } from "@ohno-editor/core/contrib/commands/concat";
import { InlineSupport } from "@ohno-editor/core/contrib/plugins/inlineSupport/plugin";
import { TextDelete } from "@ohno-editor/core/contrib/commands";

export class InlineMathHandler implements InlineHandler {
  handleMouseDown(e: MouseEvent, context: InlineEventContext): boolean | void {
    // const { page, inline, manager } = context;
    // manager.edit(inline, context);
    // return true;
  }
  handleMouseUp(e: MouseEvent, context: InlineEventContext): boolean | void {
    const { page, inline, manager } = context;
    (manager as KatexMath).edit(inline, context);
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
    context: RangedEventContext
  ): boolean | void {}
  handleEnterDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    const { page, inline, manager } = context;
    manager.edit(inline, context);
    return true;
  }
  handleClick(
    e: MouseEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    // const { range, inline, manager } = context;
    // manager.edit(inline, context);
    // return true;
  }

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
    context: RangedEventContext
  ): boolean | void {
    const { range, block, page } = context;

    if (!range.collapsed) {
      return;
    }
    if (e.inputType === "insertText" && e.data === "$") {
      const prev = getPrevLocation(range.startContainer, range.startOffset);
      if (!prev || !(prev[0] instanceof Text)) {
        return;
      }

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
          .withLazyCommand(({ page, block, index }) => {
            return new TextDelete({
              page,
              block,
              start: bias,
              index,
              token_number: -text.length - 1,
            });
          })
          .withLazyCommand(({ page, block, index, node }) => {
            return new NodeInsert({
              page,
              block,
              index,
              start: bias - text.length - 1,
              node,
            });
          })
          .build();
        page.executeCommand(command);
        page.setActiveInline(node);
        manager.edit(node, context);
        return true;
      }
    }
  }
}
