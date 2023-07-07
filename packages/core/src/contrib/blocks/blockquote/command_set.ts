import {
  CommandSet,
  Dict,
  ListCommandBuilder,
} from "@ohno-editor/core/system/types";
import { BlockQuote } from "./block";
import {
  BackspacePayLoad,
  InnerHTMLExtra,
  CommonPayLoad,
  DeletePayLoad,
  EditableExtra,
  MultiBlockPayLoad,
  MultiBlockExtra,
  SplitExtra,
} from "@ohno-editor/core/system/block/command_set";
import {
  BlockCreate,
  BlockRemove,
  BlockReplace,
  TextInsert,
  removeEditableContentAfterLocation,
  removeEditableContentBeforeLocation,
} from "@ohno-editor/core/contrib/commands";
import { Paragraph } from "../paragraph";

export class BlockquoteCommandSet implements CommandSet<BlockQuote> {
  collapsedEnter(
    builder: ListCommandBuilder<CommonPayLoad<BlockQuote>, InnerHTMLExtra>
  ): void {
    builder
      .addLazyCommand(({ block, page }, { innerHTML }) => {
        const newBlock = new BlockQuote({
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
    builder: ListCommandBuilder<DeletePayLoad<BlockQuote>, EditableExtra>
  ): void {
    builder
      .addLazyCommand(({ block, page }, { editables }) => {
        if (editables.length === 0) {
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
    builder: ListCommandBuilder<DeletePayLoad<BlockQuote>, EditableExtra>
  ): void {
    builder.addLazyCommand(({ page, nextBlock }, extra) => {
      extra.editables = nextBlock.getEditables();
      return new BlockRemove({ page, block: nextBlock });
    });
  }

  backspaceAtStart(
    builder: ListCommandBuilder<BackspacePayLoad<BlockQuote>, EditableExtra>
  ): "connect" | "independent" {
    builder.addLazyCommand(({ page, block }, extra) => {
      extra.editables = block.getEditables();
      // 1. 删除当前 block
      return new BlockReplace({
        block,
        page,
        newBlock: new Paragraph({ children: [block.root.innerHTML] }),
      });
    });
    return "independent";
  }

  backspaceFromNextBlockStart(
    builder: ListCommandBuilder<BackspacePayLoad<BlockQuote>, EditableExtra>
  ): void {
    builder.addLazyCommand(({ page, prevBlock }, { editables }) => {
      const token_number = prevBlock.selection.getTokenSize(
        prevBlock.getLastEditable()
      );
      if (editables.length == 0 || editables[0].innerHTML.length === 0) {
        return;
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
    builder: ListCommandBuilder<CommonPayLoad<BlockQuote>, Dict>
  ): void {
    return;
  }

  pasteSplit(
    builder: ListCommandBuilder<CommonPayLoad<BlockQuote>, InnerHTMLExtra>
  ): void {
    builder
      .addLazyCommand(({ block, page }, { innerHTML }) => {
        const newBlock = new BlockQuote({
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
