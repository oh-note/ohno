import {
  InlineRangedEventContext,
  RangedEventContext,
  InlineHandler,
  InlineEventContext,
  EventContext,
} from "@/system/handler";
import { BackLink } from "./inline";
import { NodeInsert } from "@/contrib/commands/html";
import { ListCommandBuilder } from "@/contrib/commands/concat";
import { InlineSupport } from "@/contrib/plugins/inlineSupport/plugin";
import { TextDelete } from "@/contrib/commands";
import {
  getNextLocation,
  getPrevLocation,
  getValidAdjacent,
  normalizeRange,
  setLocation,
  setRange,
} from "@/system/range";
import { biasToLocation } from "@/system/position";
import { defaultHandleBeforeInput } from "@/core/default/beforeInput";
import { isHintLeft, parentElementWithTag } from "@/helper/element";

export class BackLinkHandler implements InlineHandler {
  handleMouseUp(e: MouseEvent, context: InlineEventContext): boolean | void {
    const { page, inline, manager, range, first } = context;
    (manager as BackLink).edit(inline, context);
    if (range) {
      const inspan = parentElementWithTag(range.startContainer, "span", inline);
      if (inspan) {
        if (isHintLeft(inspan)) {
          (manager as BackLink).rangeToLeft();
        } else {
          (manager as BackLink).rangeToRight();
        }
      } else if (!parentElementWithTag(range.startContainer, "q", inline)) {
        (manager as BackLink).rangeToLeft();
      }
      return true;
    }
  }

  handleMouseDown(e: MouseEvent, context: InlineEventContext): boolean | void {
    if (e.metaKey) {
      return;
    }
    if (context.first) {
      return this.handleMouseUp(e, context);
    }
  }

  handleMouseEnter(e: MouseEvent, context: InlineEventContext): boolean | void {
    const { inline, manager } = context;
    (manager as BackLink).hoverLabel(inline);
  }

  handleMouseLeave(e: MouseEvent, context: InlineEventContext): boolean | void {
    const { inline, manager } = context;
    (manager as BackLink).unHoverLabel(inline);
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
    (manager as BackLink).simulateEnter();
    return true;
  }
  handleClick(
    e: MouseEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    const { range, inline, manager } = context;
    if (e.metaKey) {
      const option = (manager as BackLink).parseOption(inline);
      const { cite, type } = option;
      if (type === "link") {
        window.open(cite, "_blank");
      }
    }
    // manager.edit(inline, context);
    return true;
  }

  handleArrowKeyDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    const { page, block, inline, range, first, manager } = context;
    const slot = inline.querySelector("q")!;
    if (first) {
      manager.edit(inline, context);
      if (e.key === "ArrowLeft") {
        (manager as BackLink).rangeToRight();
      } else if (e.key === "ArrowRight") {
        (manager as BackLink).rangeToLeft();
      }
      return true;
    } else {
      // 这里不需要 return  true，在边界时，将位置设置为 label，并由 default 行为来处理光标移动
      const typedManager = manager as BackLink;
      if (typedManager.resultSize <= 0) {
        return;
      }
      if (
        e.key === "ArrowLeft" &&
        getPrevLocation(range.startContainer, range.startOffset, slot) === null
      ) {
        (manager as BackLink).exit();
        page.setLocation([inline, 0], block);
      } else if (
        e.key === "ArrowRight" &&
        getNextLocation(range.startContainer, range.startOffset, slot) === null
      ) {
        (manager as BackLink).exit();
        page.setLocation([inline, 0], block);
      } else if (e.key === "ArrowUp") {
        (manager as BackLink).simulateArrowUp();
        return true;
      } else if (e.key === "ArrowDown") {
        (manager as BackLink).simulateArrowDown();
        return true;
      }
    }
  }
  handleDeleteDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    const { range, manager, inline } = context;
    // if()
    if (range.collapsed) {
      const slot = inline.querySelector("q")!;
      if (!getNextLocation(range.startContainer, range.startOffset, slot)) {
        return true;
      }
    }
  }
  handleBackspaceDown(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    const { range, manager, inline } = context;
    // if()
    if (range.collapsed) {
      const slot = inline.querySelector("q")!;
      if (!getPrevLocation(range.startContainer, range.startOffset, slot)) {
        return true;
      }
    }
  }

  handleArrowKeyUp(
    e: KeyboardEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    const { block, range, manager, page, inline, first } = context;
    if (first) {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        const slot = inline.querySelector("q")!;
        const loc = biasToLocation(slot, 0)!;
        page.setLocation(loc, block);
      }
      return true;
    }
  }

  handleInsideBeforeInput(
    e: TypedInputEvent,
    context: InlineRangedEventContext
  ): boolean | void {
    console.log(e);
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
      (manager as BackLink).update();
      return res;
    } else {
      return true;
    }
  }

  handleBeforeInput(
    e: TypedInputEvent,
    context: RangedEventContext
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
              page.setActiveInline(current);
              manager.edit(current, context);
              manager.rangeToLeft();
            });
          })
          .build();
        page.executeCommand(command);
        // page.setActiveInline(node);
        // manager.edit(node, context);
        // // (manager as Back)
        // manager.rangeToLeft();

        return true;
      }
    }
  }
}
