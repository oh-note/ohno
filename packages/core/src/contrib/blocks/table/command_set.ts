import {
  CommandSet,
  Dict,
  ListCommandBuilder,
} from "@ohno-editor/core/system/types";
import { Table } from "./block";
import {
  BackspacePayLoad,
  InnerHTMLExtra,
  CommonPayLoad,
  DeletePayLoad,
  EditableExtra,
  MultiBlockPayLoad,
  MultiBlockExtra,
} from "@ohno-editor/core/system/block/command_set";
import {
  BlockCreate,
  BlockRemove,
  RichTextDelete,
  TextInsert,
  removeEditableContentAfterLocation,
  removeEditableContentBeforeLocation,
  removeSelectionInEditables,
} from "@ohno-editor/core/contrib/commands";
import { createRange } from "@ohno-editor/core/system/functional";

export class TableCommandSet implements CommandSet<Table> {
  deleteFromPrevBlockEnd(
    builder: ListCommandBuilder<DeletePayLoad<Table>, EditableExtra>
  ): void {}

  removeMultipleEditable(
    builder: ListCommandBuilder<CommonPayLoad<Table>, Dict>
  ): void {
    return;
  }

  multiblockMergeWhenIsLast(
    builder: ListCommandBuilder<MultiBlockPayLoad, MultiBlockExtra>
  ): void {
    builder.addLazyCommand(({ page, endBlock }, extra) => {
      extra.innerHTML = endBlock.getFirstEditable().innerHTML;
      return new BlockRemove({ page, block: endBlock });
    });
  }

  multiblockMergeWhenIsFirst(
    builder: ListCommandBuilder<MultiBlockPayLoad, MultiBlockExtra>
  ): void {
    builder.addLazyCommand(({ page, block }, { innerHTML, prevent }) => {
      if (prevent) {
        return;
      }
      return new TextInsert({ page, block, index: -1, innerHTML, start: -1 });
    });
  }

  multiblockPartSelectionRemove(
    builder: ListCommandBuilder<MultiBlockPayLoad, any>,
    option?: { isEnd?: boolean | undefined } | undefined
  ): void {
    const { isEnd } = option || {};
    const { range, page } = builder.payload;

    const block = isEnd ? builder.payload.endBlock : builder.payload.block;

    if (isEnd) {
    } else {
    }

    const startBias = isEnd
      ? 0
      : block.getBias([range.startContainer, range.startOffset]);
    const startTokenNumber = isEnd
      ? block.selection.getTokenSize(block.getFirstEditable())
      : block.selection.getTokenSize(
          block.findEditable(range.startContainer)!
        ) - startBias;
    const startEditable = isEnd
      ? block.getFirstEditable()
      : block.findEditable(range.startContainer)!;
    const startIndex = isEnd ? 0 : block.getEditableIndex(startEditable);

    const endBias = isEnd
      ? block.getBias([range.endContainer, range.endOffset])
      : block.selection.getTokenSize(block.getLastEditable());
    const endIndex = isEnd
      ? block.findEditableIndex(range.endContainer)
      : block.length - 1;
    const payload = { page, block };
    let start: number, token_number: number;
    builder
      .addLazyCommand(({ page, block }) => {
        return new RichTextDelete({
          page,
          block,
          start: startBias,
          index: startIndex,
          token_number: startTokenNumber,
        }).onUndo(({ block }) => {
          const startLoc = block.getLocation(startBias, startIndex)!;
          const endLoc = block.getLocation(endBias, endIndex)!;
          page.setRange(createRange(...startLoc, ...endLoc));
        });
      }, payload)
      .addLazyCommand(({ page, block }) => {
        return new RichTextDelete({
          page,
          block,
          start: 0,
          index: endIndex,
          token_number: endBias,
        });
      }, payload);

    for (
      let cur = startIndex + 1,
        curEditable = block.getNextEditable(startEditable)!;
      cur < endIndex;
      cur++, curEditable = block.getNextEditable(curEditable)!
    ) {
      builder.addLazyCommand(({ block, page }) => {
        start = 0;
        token_number = block.selection.getTokenSize(curEditable);
        const command = new RichTextDelete({
          page,
          block,
          start,
          index: cur,
          token_number,
        });
        command.onUndo();
        return command;
      }, payload);
    }
  }
}
