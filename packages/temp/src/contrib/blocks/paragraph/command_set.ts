import {
  CommandSet,
  Dict,
  ListCommandBuilder,
} from "@ohno/core/system/types";
import { Paragraph } from "./block";
import {
  BackspacePayLoad,
  InnerHTMLExtra,
  CommonPayLoad,
  DeletePayLoad,
  EditableExtra,
  MultiBlockPayLoad,
  MultiBlockExtra,
} from "@ohno/core/system/block/command_set";
import {
  BlockCreate,
  BlockRemove,
  Empty,
  TextInsert,
  removeEditableContentAfterLocation,
  removeEditableContentBeforeLocation,
} from "@ohno/core/contrib/commands";

export class ParagraphCommandSet implements CommandSet<Paragraph> {
  collapsedEnter(
    builder: ListCommandBuilder<CommonPayLoad<Paragraph>, InnerHTMLExtra>
  ): void {
    builder
      .addLazyCommand(({ block, page }, { innerHTML }) => {
        const newBlock = new Paragraph({
          children: innerHTML,
        });
        return new BlockCreate({
          page,
          block,
          newBlock,
          where: "after",
        });
      })
      .build();
  }

  deleteAtBlockEnd(
    builder: ListCommandBuilder<DeletePayLoad<Paragraph>, EditableExtra>
  ): void {
    builder
      .addLazyCommand(({ block, page }, { editables }) => {
        if (editables.length == 0 || editables[0].innerHTML.length === 0) {
          return;
        }
        const innerHTML = editables[0].innerHTML;
        const start = block.selection.getTokenSize(block.getEditable(0));
        return new TextInsert({
          page,
          block,
          innerHTML,
          start,
          index: -1,
        }).onExecute(({ block, start, index }) => {
          page.setLocation(block.getLocation(start, index)!, block);
        });
      })
      .build();
  }
  deleteFromPrevBlockEnd(
    builder: ListCommandBuilder<DeletePayLoad<Paragraph>, EditableExtra>
  ): void {
    builder.addLazyCommand(({ page, nextBlock }, extra) => {
      // feed content
      extra.editables = nextBlock.getEditables();
      // remove
      return new BlockRemove({ page, block: nextBlock });
    });
  }

  backspaceAtStart(
    builder: ListCommandBuilder<BackspacePayLoad<Paragraph>, EditableExtra>
  ): "connect" | "independent" {
    builder.addLazyCommand(({ page, block }, extra) => {
      // feed content
      extra.editables = block.getEditables();
      // remove
      return new BlockRemove({
        page,
        block,
      }).onUndo((_, { block }) => {
        page.setLocation(block.getLocation(0, 0)!, block);
      });
    });
    return "connect";
  }
  backspaceFromNextBlockStart(
    builder: ListCommandBuilder<BackspacePayLoad<Paragraph>, EditableExtra>
  ): void {
    builder.addLazyCommand(({ page, prevBlock }, { editables }) => {
      const token_number = prevBlock.selection.getTokenSize(prevBlock.inner);
      if (editables.length == 0 || editables[0].innerHTML.length === 0) {
        return new Empty({ block: prevBlock }).onExecute(({ block }) => {
          page.setLocation(block.getLocation(token_number, -1)!, block);
        });
      }
      // insert first editable content into last of paragraph
      return new TextInsert({
        page: page,
        block: prevBlock,
        start: token_number,
        index: -1,
        innerHTML: editables[0].innerHTML,
      }).onExecute(({ block }) => {
        page.setLocation(block.getLocation(token_number, -1)!, block);
      });
    });
  }

  removeMultipleEditable(
    builder: ListCommandBuilder<CommonPayLoad<Paragraph>, Dict>
  ): void {
    return;
  }
  pasteSplit(
    builder: ListCommandBuilder<CommonPayLoad<Paragraph>, InnerHTMLExtra>
  ): void {
    builder
      .addLazyCommand(({ block, page }, { innerHTML }) => {
        const newBlock = new Paragraph({
          children: innerHTML,
        });
        return new BlockCreate({
          page,
          block,
          newBlock,
          where: "after",
        });
      })
      .build();
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
    const { page, block, endBlock, range } = builder.payload;
    if (isEnd) {
      const bias = endBlock.getBias([range.endContainer, range.endOffset]);
      const index = endBlock.findEditableIndex(range.endContainer);
      removeEditableContentBeforeLocation(builder, {
        page,
        block: endBlock,
        bias,
        index,
      });
    } else {
      const bias = block.getBias([range.startContainer, range.startOffset]);
      const index = block.findEditableIndex(range.startContainer);
      removeEditableContentAfterLocation(builder, { page, block, bias, index });
    }
  }
}
