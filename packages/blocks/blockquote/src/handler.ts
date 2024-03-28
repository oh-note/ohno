import { createRange } from "@ohno/core/system/functional";
import {
  BlockEventContext,
  RangedBlockEventContext,
  PagesHandleMethods,
  ListCommandBuilder,
  InnerHTMLExtra,
  BackspacePayLoad,
  EditableExtra,
  DeletePayLoad,
} from "@ohno/core/system/types";
import { dispatchKeyEvent } from "@ohno/core/system/functional";
import "./style.css";
import {
  BlockCreate,
  removeEditableContentAfterLocation,
  removeSelectionInEditable,
} from "@ohno/core/contrib/commands";
import { Paragraph } from "@ohno/core/contrib/blocks/paragraph";
export class BlockQuoteHandler implements PagesHandleMethods {
  handleKeyPress(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {}

  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleDeleteDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page, block, range } = context;
    if (!block.isLocationInRight([range.startContainer, range.startOffset])) {
      return;
    }
    const nextBlock = page.getNextBlock(block);
    if (!nextBlock) {
      return true;
    }
    if (!nextBlock.mergeable) {
      const newRange = createRange();
      newRange.selectNode(nextBlock.root);
      page.setRange(newRange);
      return true;
    }

    const builder = new ListCommandBuilder<DeletePayLoad, EditableExtra>({
      ...context,
      nextBlock,
    });
    nextBlock.commandSet.deleteFromPrevBlockEnd?.(builder);
    block.commandSet.deleteAtBlockEnd?.(builder);
    const command = builder.build();
    page.executeCommand(command);
    return true;
  }

  handleBackspaceDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { block, page, range } = context;
    if (
      range &&
      (!range.collapsed ||
        !block.isLocationInLeft([range.startContainer, range.startOffset]))
    ) {
      return;
    }
    const builder = new ListCommandBuilder<BackspacePayLoad, EditableExtra>(
      context as BackspacePayLoad
    );

    block.commandSet.backspaceAtStart!(builder);
    const command = builder.build();
    page.executeCommand(command);
    return true;
  }

  handleEnterDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page, block, range } = context;
    if (e.shiftKey) {
      const newBlock = new Paragraph();
      const command = new BlockCreate({
        page,
        block,
        where: "after",
        newBlock,
      });
      page.executeCommand(command);
      return true;
    }
    const builder = new ListCommandBuilder<
      RangedBlockEventContext,
      InnerHTMLExtra
    >(context);
    removeSelectionInEditable(builder);
    const bias = block.getBias([range.startContainer, range.startOffset]);
    const index = block.findEditableIndex(range.startContainer);
    removeEditableContentAfterLocation(builder, { page, block, bias, index });
    block.commandSet.collapsedEnter?.(builder);
    const command = builder.build();
    page.executeCommand(command);
    return true;
  }

  handleSpaceDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { block, range } = context;

    // 只在最右侧空格时触发 Block change 事件
    if (
      !range.collapsed ||
      !block.isLocationInRight([range.startContainer, range.startOffset])
    ) {
      return;
    }

    const prefix = block.root.textContent || "";
    if (prefix.match(/^#{1,6} *$/)) {
      console.log("To Heading");
    } else if (prefix.match(/^ *(-*) *$/)) {
      console.log("To Blockquote List");
    } else if (prefix.match(/^ *([0-9]+\.) *$/)) {
      console.log("To Blockquote Ordered List");
    } else {
      return;
    }
    return true;
  }
}
