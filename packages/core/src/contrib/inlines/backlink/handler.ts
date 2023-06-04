import {
  InlineRangedEventContext,
  RangedBlockEventContext,
  InlineHandler,
  InlineEventContext,
  dispatchKeyEvent,
} from "@ohno-editor/core/system/handler";
import { BackLink } from "./inline";
import { NodeInsert } from "@ohno-editor/core/contrib/commands/html";
import { ListCommandBuilder } from "@ohno-editor/core/contrib/commands/concat";
import { InlineSupport } from "@ohno-editor/core/contrib/plugins/inlineSupport/plugin";
import { TextDelete } from "@ohno-editor/core/contrib/commands";
import { getValidAdjacent } from "@ohno-editor/core/system/range";
import { defaultHandleBeforeInput } from "@ohno-editor/core/core/default/functional/beforeInput";
import { defaultSelection } from "@ohno-editor/core/system/selection";

export class BackLinkHandler implements InlineHandler<BackLink> {
  handleKeyboardActivated(
    e: KeyboardEvent,
    context: InlineRangedEventContext<BackLink>
  ): boolean | void {
    const { manager, inline } = context;
    manager.activate(inline, context);
  }
  handleKeyboardDeActivated(
    e: KeyboardEvent,
    context: InlineRangedEventContext<BackLink>
  ): void {
    const { manager, inline } = context;
    manager.exit();
  }
  handleMouseActivated(
    e: MouseEvent,
    context: InlineEventContext<BackLink>
  ): boolean | void {
    const { manager, inline } = context;
    manager.activate(inline, context);
  }
  handleMouseDeActivated(
    e: MouseEvent,
    context: InlineEventContext<BackLink>
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
    context: InlineEventContext<BackLink>
  ): boolean | void {
    const { page, inline, manager, range } = context;
    manager.activate(inline, context);
    return true;
  }

  handleMouseDown(e: MouseEvent, context: InlineEventContext): boolean | void {}
  handleClick(
    e: MouseEvent,
    context: InlineEventContext<BackLink>
  ): boolean | void {}

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
    context: InlineRangedEventContext<BackLink>
  ): boolean | void {
    const { page, inline, manager } = context;
    // manager.simulateEnter();
    page.setLocation(getValidAdjacent(inline, "afterend"));
    manager.exit();
    return true;
  }

  handleArrowKeyDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    const { page, block, inline, range, manager } = context;
    const slot = inline.querySelector("q")!;

    // 这里不需要 return  true，在边界时，将位置设置为 label，并由 default 行为来处理光标移动
    const typedManager = manager as BackLink;

    if (
      e.key === "ArrowLeft" &&
      defaultSelection.getPrevLocation(
        [range.startContainer, range.startOffset],
        slot
      ) === null
    ) {
      typedManager.exit();
      page.setLocation([inline, 0], block);
    } else if (
      e.key === "ArrowRight" &&
      defaultSelection.getNextLocation(
        [range.startContainer, range.startOffset],
        slot
      ) === null
    ) {
      typedManager.exit();
      page.setLocation([inline, 0], block);
    }
    // if()
    if (e.key === "ArrowUp") {
      // typedManager.simulateArrowUp();
      return true;
    } else if (e.key === "ArrowDown") {
      // typedManager.simulateArrowDown();
      return true;
    }
  }
  handleDeleteDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    const { range, manager, inline, block } = context;
    if (range.collapsed) {
      const slot = inline.querySelector("q")!;
      if (
        defaultSelection.getNextLocation(
          [range.startContainer, range.startOffset],
          slot
        )
      ) {
        return true;
      }
    }
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
    context: InlineRangedEventContext<BackLink>
  ): boolean | void {
    const inputType = e.inputType as InputType;

    if (
      inputType === "insertText" ||
      inputType === "deleteContentBackward" ||
      inputType === "deleteContentForward" ||
      inputType === "insertFromPaste" ||
      inputType === "deleteWordBackward" ||
      inputType === "deleteWordForward"
    ) {
      // 思考怎么在 label 内部正常带 undo redo 的编辑文本
      // defaultHandleBeforeInput;
      const res = defaultHandleBeforeInput(this, e, context, () => false);
      const { manager, range } = context;
      manager.query();
      return res;
    } else {
      return true;
    }
  }

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { range, block, page } = context;

    if (!range.collapsed) {
      return;
    }
    if (e.inputType === "insertText" && (e.data === "[" || e.data === "【")) {
      const text = range.startContainer.textContent || "";
      if (text[range.startOffset - 1] === e.data) {
        const plugin = page.getPlugin<InlineSupport>("inlinesupport");
        const manager = plugin.getInlineManager<BackLink>("backlink");

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
