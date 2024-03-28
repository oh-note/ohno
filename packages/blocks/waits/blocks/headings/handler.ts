import {
  RangedBlockEventContext,
  PagesHandleMethods,
  ListCommandBuilder,
  InnerHTMLExtra,
  BackspacePayLoad,
  EditableExtra,
  DeletePayLoad,
} from "../../../system/types";
import {
  BlockCreate,
  BlockReplace,
} from "../../../contrib/commands/block";
import {
  createRange,
  dispatchKeyEvent,
} from "../../../system/functional";

import { Paragraph } from "../paragraph";
import { Headings } from "./block";
import {
  removeEditableContentAfterLocation,
  removeSelectionInEditable,
} from "../../commands";
export class HeadingsHandler implements PagesHandleMethods {
  name: string = "headings";
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedBlockEventContext
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
    const { page, block, range } = context;

    const editable = block.findEditable(range.startContainer)!;
    const startLoc = block.getLocation(0, editable)!;
    const prefixRange = createRange(
      ...startLoc,
      range.endContainer,
      range.endOffset
    );

    const prefix = prefixRange.cloneContents().textContent!;
    let matchRes;
    if ((matchRes = prefix.match(/^(#{1,6})$/))) {
      const level = matchRes[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      let newBlock;
      if ((block as Headings).meta.level === level) {
        newBlock = new Paragraph({
          children: block.root.innerHTML.replace(/^#+/, ""),
        });
      } else {
        newBlock = new Headings({
          level,
          children: block.root.innerHTML.replace(/^#+/, ""),
        });
      }
      const command = new BlockReplace({
        page,
        block,
        newBlock,
      });
      page.executeCommand(command);
      return true;
    }
  }
}
