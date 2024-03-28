import {
  BlockEventContext,
  RangedBlockEventContext,
  PagesHandleMethods,
  AnyBlock,
  ListCommandBuilder,
} from "@ohno/core/system/types";
import {
  BlockCreate,
  BlockRemove,
  BlockReplace,
  BlocksRemove,
} from "@ohno/core/contrib/commands/block";
import {
  dispatchKeyEvent,
  outerHTML,
  createRange,
} from "@ohno/core/system/functional";

import { Headings } from "../headings";
import { Paragraph } from "./block";

import { BlockQuote } from "../blockquote";
import { List } from "../list";
import { RichTextDelete, TextInsert } from "@ohno/core/contrib/commands";
import { Empty } from "@ohno/core/contrib/commands/select";

import { Code } from "../code";
import { Divide } from "../divide";
import { OrderedList } from "../orderedList";

import {
  DeletePayLoad,
  EditableExtra,
  InnerHTMLExtra,
  BackspacePayLoad,
} from "@ohno/core/system/block/command_set";
import {
  removeEditableContentAfterLocation,
  removeSelectionInEditable,
} from "../../commands/common_passes";

export interface DeleteContext extends BlockEventContext {
  nextBlock: AnyBlock;
}

export function prepareDeleteCommand({
  page,
  block,
  nextBlock,
}: DeleteContext) {
  const builder = new ListCommandBuilder({ page, block, nextBlock })
    .addLazyCommand(({ page, block, nextBlock }, extra, status) => {
      //
      if (nextBlock.inner.innerHTML.length > 0) {
        const token_number = block.selection.getTokenSize(block.inner);
        const offset = { index: -1, start: token_number };
        return new TextInsert({
          page: page,
          block: block,
          start: token_number,
          index: 0,
          innerHTML: nextBlock.root.innerHTML,
        }).onExecute(({ block, start, index }) => {
          page.setLocation(block.getLocation(start, index)!, block);
        });
      }
      return null;
    })
    .addLazyCommand(() => {
      // 2. 将下一个 block 删除。
      return new BlocksRemove({ page, blocks: [nextBlock] });
    });
  return builder;
}

export function prepareEnterCommand({ page, block, range }: BlockEventContext) {
  if (!range) {
    throw new NoRangeError();
  }
  const builder = new ListCommandBuilder({ page, block, range })
    .addLazyCommand(({ block, page, range }) => {
      // 1. 如果存在选中文本，则删除。
      if (range.collapsed) {
        // 没有选中文本，不需要删除
        return;
      }
      const start = block.getBias([range.startContainer, range.startOffset]);
      const token_number = block.selection.tokenBetweenRange(range);
      return new RichTextDelete({
        page,
        block,
        start,
        index: 0,
        token_number,
      }).onUndo(({ block, start, token_number }) => {
        page.setRange(
          block.getEditableRange({
            start,
            end: start + token_number,
            index: 0,
          })!
        );
      });
    })
    .addLazyCommand(({ block, page, range }, extra) => {
      // 2. 在删除后（上一条命令保证了是 range.collapsed），如果位于右侧，则直接创建
      const start = block.getBias([range.startContainer, range.startOffset]);
      if (block.isLocationInRight([range.startContainer, range.startOffset])) {
        extra["innerHTML"] = "";
        return new Empty({ block, start }).onUndo(({ block, start }) => {
          page.setLocation(block.getLocation(start, 0)!, block);
        });
      }
      // 2. 否则，将右侧内容放到下一行

      // 需要获取光标到右侧的文本，删除并将其作为新建 Block 的初始文本（下一条命令）
      const full_token_number = block.selection.getTokenSize(block.inner);
      const tailSelectedRange = block.getRange(
        {
          start,
          end: full_token_number,
        },
        block.inner
      )!;
      const newContent = tailSelectedRange!.cloneContents();

      extra["innerHTML"] = outerHTML(newContent);
      return new RichTextDelete({
        page,
        block,
        index: 0,
        start: full_token_number,
        token_number: start - full_token_number,
      }).onUndo(({ block, start }) => {
        page.setLocation(block.getLocation(start, 0)!, block);
      });
    });

  return builder;
}

export class ParagraphHandler implements PagesHandleMethods {
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
      !range.collapsed ||
      !block.isLocationInLeft([range.startContainer, range.startOffset])
    ) {
      // 不处理选中状态和不在左边的状态
      return;
    }
    const prevBlock = page.getPrevBlock(block);
    if (!prevBlock) {
      return true;
    }

    // const command = builder.build();
    if (!prevBlock.mergeable) {
      const newRange = createRange();
      newRange.selectNode(prevBlock.root);
      page.setRange(newRange);
      return true;
    }

    const builder = new ListCommandBuilder<BackspacePayLoad, EditableExtra>({
      ...context,
      prevBlock,
    });
    if (block.commandSet.backspaceAtStart!(builder) === "connect") {
      prevBlock.commandSet.backspaceFromNextBlockStart!(builder);
    }
    const command = builder.build();
    page.executeCommand(command);
    // 向前合并
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
        newBlock,
        where: "after",
      });
      page.executeCommand(command);
    } else {
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
    }

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
    let matchRes, command;
    if ((matchRes = prefix.match(/^(#{1,6})$/))) {
      const level = matchRes[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const newBlock = new Headings({
        level,
        children: block.root.innerHTML.replace(/^#+/, ""),
      });
      command = new BlockReplace({
        page,
        block,
        newBlock,
      });
    } else if ((matchRes = prefix.match(/^[>》]([!? ])?$/))) {
      const newBlock = new BlockQuote({
        children: block.root.innerHTML.replace(/^(》|&gt;)([!? ])?/, ""),
      });
      command = new BlockReplace({
        page,
        block,
        newBlock,
      });
    } else if (prefix.match(/^ *- *$/)) {
      const newBlock = new List({
        children: [block.root.innerHTML.replace(/^ *- */, "")],
      });
      command = new BlockReplace({
        page,
        block,
        newBlock,
      });
    } else if (prefix.match(/^ *([0-9]+\.) *$/)) {
      const newBlock = new OrderedList({
        children: [block.root.innerHTML.replace(/^ *([0-9]+\.) */, "")],
      });
      command = new BlockReplace({
        page,
        block,
        newBlock,
      });
    } else if (prefix.match(/^( *- *)?(【】|\[\]|\[ \])*$/)) {
      console.log("To Todo List");
    } else if (prefix.match(/^`{3} *$/)) {
      const newBlock = new Code({});
      command = new BlockReplace({
        page,
        block,
        newBlock,
      });
    } else if ((editable.textContent || "").match(/^-{3} *$/)) {
      const newBlock = new Divide();
      command = new BlockReplace({
        page,
        block,
        newBlock,
      });
    } else {
      return;
    }
    if (command) {
      page.executeCommand(command);
      return true;
    }
  }
}
