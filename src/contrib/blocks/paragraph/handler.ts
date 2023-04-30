import { getDefaultRange } from "@/helper/document";
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  RangedEventContext,
  dispatchKeyDown,
} from "@/system/handler";
import {
  FIRST_POSITION,
  LAST_POSITION,
  getTokenSize,
  locationToBias,
  offsetToRange,
  rangeToOffset,
} from "@/system/position";
import {
  BlockCreate,
  BlockRemove,
  BlockReplace,
  BlocksRemove,
} from "@/contrib/commands/block";
import { ValidNode, outerHTML } from "@/helper/element";
import { ListCommandBuilder } from "@/contrib/commands/concat";
import { TextDeleteSelection } from "@/contrib/commands/text";
import { Payload } from "@/system/history";
import { Headings } from "../headings";
import { Paragraph } from "./block";
import { AnyBlock } from "@/system/block";
import { createRange } from "@/system/range";
import { Blockquote } from "../blockquote";
import { List } from "../list";
import { TextInsert } from "@/contrib/commands";
import { Empty, SetBlockRange } from "@/contrib/commands/select";
import { ContainerRemove } from "@/contrib/commands/container";
import { OrderedList } from "../orderedList";

export interface DeleteContext extends EventContext {
  nextBlock: AnyBlock;
}

export function prepareDeleteCommand({
  page,
  block,
  nextBlock,
}: DeleteContext) {
  const builder = new ListCommandBuilder({ page, block, nextBlock })
    .withLazyCommand(({ page, block, nextBlock }, extra, status) => {
      if (nextBlock.root.innerHTML.length > 0) {
        const token_number = getTokenSize(block.root);
        const offset = { index: -1, start: token_number };
        return new TextInsert({
          block: block,
          insertOffset: offset,
          page: page,
          innerHTML: nextBlock.root.innerHTML,
        }).onExecute(({ block, insertOffset }) => {
          block.setOffset(insertOffset);
        });
      }
      return null;
    })
    .withLazyCommand(() => {
      return new BlocksRemove({ page, blocks: [nextBlock] });
    });
  return builder;
}

export function prepareEnterCommand({ page, block, range }: EventContext) {
  if (!range) {
    throw new NoRangeError();
  }
  const builder = new ListCommandBuilder({ page, block, range })
    .withLazyCommand(({ block, page, range }, _, status) => {
      if (range.collapsed) {
        // 没有选中文本，不需要删除
        return;
      }
      const offset = rangeToOffset(block.root, range);
      return new TextDeleteSelection({
        block: block,
        page: page,
        delOffset: offset,
      }).onUndo(({ block, page, delOffset }) => {
        block.setOffset(delOffset);
      });
    })
    .withLazyCommand(({ block, page, range }, extra, status) => {
      const bias = locationToBias(
        block.root,
        range.startContainer as ValidNode,
        range.startOffset
      );
      const token_number = getTokenSize(block.root);

      if (block.isRight(range)) {
        // 已经在最右侧了，直接返回并新建 Block
        status.skip();
        extra["innerHTML"] = "";
        extra["offset"] = { start: bias };
        return;
      }
      // 获取光标到右侧的文本，删除并将其作为新建 Block 的参数
      // const offset = rangeToOffset(block.el, range);
      // offset.end = -1;

      const delOffset = {
        start: bias,
        end: token_number,
      };
      const tailSelectedRange = offsetToRange(block.root, delOffset);
      const newContent = tailSelectedRange!.cloneContents();

      extra["innerHTML"] = outerHTML(newContent);
      extra["offset"] = { start: bias };
      return new TextDeleteSelection({
        block: block,
        page: page,
        delOffset,
      }).onUndo(({ block, delOffset }) => {
        block.setOffset({ ...delOffset, end: undefined });
      });
    });

  return builder;
}

export class ParagraphHandler extends Handler implements KeyDispatchedHandler {
  name: string = "p";
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
  }

  handleDeleteDown(
    e: KeyboardEvent,
    { page, block }: RangedEventContext
  ): boolean | void {
    const range = getDefaultRange();
    console.log("Delete");
    if (!block.isRight(range)) {
      return;
    }
    const nextBlock = page.getNextBlock(block);
    if (!nextBlock) {
      // 在右下方，不做任何操作
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
    // 需要将下一个 Block 的第一个 Container 删除，然后添加到尾部
    // 执行过程是 TextInsert -> ContainerDelete
    if (nextBlock.multiContainer) {
      // 删除第一个 Container
      // 将 Container 的内容插入到末尾
      const command = new ListCommandBuilder({
        page,
        block,
        nextBlock,
      })
        .withLazyCommand(({ block, nextBlock }, extra) => {
          const n = nextBlock.containers().length;
          extra["innerHTML"] = nextBlock.firstContainer().innerHTML;
          if (n === 1) {
            return new BlockRemove({ page, block: nextBlock });
          } else {
            return new ContainerRemove({ page, block: nextBlock, index: [0] });
          }
        })
        .withLazyCommand(({ block, page }, { innerHTML }) => {
          const insertOffset = block.getOffset();
          return new TextInsert({
            page,
            block,
            innerHTML,
            insertOffset,
          }).onExecute(({ block }) => {
            block.setOffset(insertOffset);
          });
        })
        .build();
      page.executeCommand(command);
      return true;
    } else {
      const command = prepareDeleteCommand({ page, block, nextBlock }).build();
      page.executeCommand(command);
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
  }

  handleBackspaceDown(
    e: KeyboardEvent,
    { block, page }: RangedEventContext
  ): boolean | void {
    const range = getDefaultRange();
    if (!block.isLeft(range) || !range.collapsed) {
      return;
    }
    const prevBlock = page.getPrevBlock(block);
    if (!prevBlock) {
      // 在左上方，不做任何操作
      e.preventDefault();
      e.stopPropagation();
      return true;
    }

    // 只需要考虑 Paragraph 类和 List 类型的退格删除导致的 Block 间信息增删行为
    // 对这两种删除行为，List 是将退格部分转化为 Paragraph（可能导致 List 分裂成两个）
    // Paragraph 是将整个 Block 的内容 put 到上一个 Block 的 LastContainer 中
    // 对 Paragraph，只需要 BlockRemove 和 TextInsert 两个命令的组合，即可完成这一操作
    // 对 List，还需要额外分析退格的 Container Index，并额外的创建 1 或 2 个 BlockCreate 命令
    const command = new ListCommandBuilder({ page, block, prevBlock })
      .withLazyCommand(() => {
        return new BlockRemove({
          page,
          block,
        }).onUndo(({ block }) => {
          block.setOffset(FIRST_POSITION);
        });
      })
      .withLazyCommand(({ page, block, prevBlock }, extra, status) => {
        const token_number = getTokenSize(prevBlock.lastContainer());
        if (block.root.innerHTML.length > 0) {
          return new TextInsert({
            block: prevBlock,
            insertOffset: { index: -1, start: -1 },
            page: page,
            innerHTML: block.root.innerHTML,
          }).onExecute(({ block }) => {
            block.setOffset({ index: -1, start: token_number });
          });
        } else {
          return new Empty({
            page,
            block,
            offset: FIRST_POSITION,
            newBlock: prevBlock,
            newOffset: LAST_POSITION,
          }).onExecute(({ block, newBlock }) => {
            newBlock.setOffset({ index: -1, start: token_number });
          });
        }
      })
      .build();
    page.executeCommand(command);
    // 向前合并
    return true;
  }

  handleEnterDown(
    e: KeyboardEvent,
    { page, block, range }: RangedEventContext
  ): boolean | void {
    e.stopPropagation();
    e.preventDefault();

    const command = prepareEnterCommand({ page, block, range }) // 删除当前光标向后所有文本
      .withLazyCommand(({ block, page }, { innerHTML, offset }) => {
        if (innerHTML === undefined || !offset) {
          throw new Error("sanity check");
        }
        const paragraph = new Paragraph({
          innerHTML: innerHTML,
        });
        return new BlockCreate({
          page: page,
          block: block,
          newBlock: paragraph,
          where: "after",
          offset: offset,
          newOffset: FIRST_POSITION,
        });
      }) // 将新文本添加到
      .build();

    page.executeCommand(command);
  }
  handleSpaceDown(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {
    const { page, block, range } = context;

    const prefixRange = offsetToRange(block.currentContainer(), { start: 0 })!;
    prefixRange.setEnd(range.endContainer, range.endOffset);

    const prefix = prefixRange.cloneContents().textContent!;
    let matchRes, command;
    if ((matchRes = prefix.match(/^(#{1,6})/))) {
      const offset = block.getOffset();
      const level = matchRes[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const newBlock = new Headings({
        level,
        innerHTML: block.root.innerHTML.replace(/^#+/, ""),
      });
      const newOffset = FIRST_POSITION;
      command = new BlockReplace({
        page,
        block,
        offset,
        newOffset,
        newBlock,
      });
    } else if ((matchRes = prefix.match(/^[>》]([!? ])?/))) {
      const offset = block.getOffset();
      const newBlock = new Blockquote({
        innerHTML: block.root.innerHTML.replace(/^(》|&gt;)([!? ])?/, ""),
      });
      const newOffset = FIRST_POSITION;
      command = new BlockReplace({
        page,
        block,
        offset,
        newOffset,
        newBlock,
      });
    } else if (prefix.match(/^ *- */)) {
      const offset = block.getOffset();
      const newBlock = new List({
        firstLiInnerHTML: block.root.innerHTML.replace(/^ *(-*) */, ""),
      });
      const newOffset = FIRST_POSITION;
      command = new BlockReplace({
        page,
        block,
        offset,
        newOffset,
        newBlock,
      });
    } else if (prefix.match(/^ *([0-9]+\.) *$/)) {
      const offset = block.getOffset();
      const newBlock = new OrderedList({
        firstLiInnerHTML: block.root.innerHTML.replace(/^ *([0-9]+\.) *$/, ""),
      });
      const newOffset = FIRST_POSITION;
      command = new BlockReplace({
        page,
        block,
        offset,
        newOffset,
        newBlock,
      });
    } else if (prefix.match(/^( *- *)?(【】|\[\]|\[ \])*$/)) {
      console.log("To Todo List");
    } else if (prefix.match(/^`{3}.*$/)) {
      console.log("To Code");
    } else {
      return;
    }
    if (command) {
      page.executeCommand(command);
      e.stopPropagation();
      e.preventDefault();
    }
  }
}
