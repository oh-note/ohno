import { getDefaultRange } from "@helper/document";
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  dispatchKeyDown,
} from "@system/handler";
import {
  FIRST_POSITION,
  LAST_POSITION,
  offsetToRange,
  rangeToOffset,
} from "@system/position";
import {
  BlockActive,
  BlockCreate,
  BlockRemove,
  BlockReplace,
  defaultAfterBlockCreateExecute,
} from "@contrib/commands/block";
import { outerHTML } from "@helper/element";
import { ListCommandBuilder } from "@contrib/commands/concat";
import { TextDeleteSelection, TextInsert } from "@contrib/commands/text";
import { Payload } from "@system/history";
import { Headings } from "../headings";
import { Paragraph } from "./block";
import { AnyBlock } from "@system/block";
import { createRange } from "@system/range";
import { Blockquote } from "../blockquote";
import { List } from "../list";

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
      if (nextBlock.el.innerHTML.length > 0) {
        return new TextInsert({
          block: block,
          insertOffset: { index: -1, start: -1 },
          afterOffset: { index: -1, start: -1 },
          page: page,
          innerHTML: nextBlock.el.innerHTML,
        });
      }
      return null;
    })
    .withLazyCommand(() => {
      return new BlockRemove(
        {
          page,
          block: nextBlock,
          beforeOffset: FIRST_POSITION,
        },
        undefined,
        undefined
      );
    });
  return builder;
}

export function prepareEnterCommand({ page, block }: EventContext) {
  const builder = new ListCommandBuilder<Payload>({ page, block })
    .withLazyCommand(({ block, page }, _, status) => {
      const range = getDefaultRange();
      if (!range) {
        throw new Error("sanity check");
      }
      if (range.collapsed) {
        // 没有选中文本，不需要删除
        console.log("skip remove selection");
        status.skip();
        return;
      }
      const offset = rangeToOffset(block.el, range);
      return new TextDeleteSelection({
        block: block,
        page: page,
        delOffset: offset,
      });
    })
    .withLazyCommand(({ block, page }, extra, status) => {
      const range = getDefaultRange();
      if (!range) {
        throw new Error("sanity check");
      }
      if (block.isRight(range)) {
        // 已经在最右侧了，直接返回并新建 Block
        status.skip();
        extra["innerHTML"] = "";
        extra["oldOffset"] = LAST_POSITION;
        console.log("skip remove right");
        return;
      }
      // 获取光标到右侧的文本，删除并将其作为新建 Block 的参数
      const offset = rangeToOffset(block.el, range);
      offset.end = -1;

      const tailSelectedRange = offsetToRange(block.el, offset);
      const newContent = tailSelectedRange!.cloneContents();

      extra["innerHTML"] = outerHTML(newContent);
      extra["oldOffset"] = LAST_POSITION;
      console.log(newContent.textContent);
      return new TextDeleteSelection({
        block: block,
        page: page,
        beforeOffset: { ...offset, end: undefined },
        delOffset: offset,
      });
    });

  return builder;
}

export class ParagraphHandler extends Handler implements KeyDispatchedHandler {
  block_type: string = "p";
  handleKeyPress(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleKeyDown(e: KeyboardEvent, context: EventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
  }

  handleDeleteDown(
    e: KeyboardEvent,
    { page, block }: EventContext
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
      // block.firstContainer();
      throw new Error("Not supported yet");
    } else {
      const command = prepareDeleteCommand({ page, block, nextBlock }).build();
      page.executeCommand(command);
      return true;
    }
  }

  handleBackspaceDown(
    e: KeyboardEvent,
    { block, page }: EventContext
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
    const command = new ListCommandBuilder({ page, block })
      .withLazyCommand(() => {
        return new BlockRemove(
          { page, block, beforeOffset: FIRST_POSITION },
          undefined,
          ({ block, beforeOffset: offset }) => {
            block.setOffset(offset);
          }
        );
      })
      .withLazyCommand(({ page, block }, extra, status) => {
        if (block.el.innerHTML.length > 0) {
          return new TextInsert({
            block: prevBlock,
            insertOffset: { index: -1, start: -1 },
            afterOffset: { index: -1, start: -1 },
            page: page,
            innerHTML: block.el.innerHTML,
          });
        } else {
          return new BlockActive({
            page,
            block,
            offset: FIRST_POSITION,
            newBlock: prevBlock,
            newOffset: LAST_POSITION,
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
    { page, block }: EventContext
  ): boolean | void {
    e.stopPropagation();
    e.preventDefault();

    const command = prepareEnterCommand({ page, block }) // 删除当前光标向后所有文本
      .withLazyCommand(({ block, page }, { innerHTML, oldOffset }) => {
        if (innerHTML === undefined || !oldOffset) {
          throw new Error("sanity check");
        }
        const paragraph = new Paragraph({
          innerHTML: innerHTML,
        });
        return new BlockCreate(
          {
            block: block,
            newBlock: paragraph,
            offset: oldOffset,
            newOffset: FIRST_POSITION,
            where: "after",
            page: page,
          },
          defaultAfterBlockCreateExecute
        );
      }) // 将新文本添加到
      .build();

    page.executeCommand(command);
  }
  handleSpaceDown(e: KeyboardEvent, context: EventContext): boolean | void {
    const { page, block } = context;
    const range = document.getSelection()?.getRangeAt(0);
    if (!range) {
      console.log("have no range");
      return;
    }
    const prefixRange = offsetToRange(block.currentContainer(), { start: 0 })!;
    prefixRange.setEnd(range.endContainer, range.endOffset);

    const prefix = prefixRange.cloneContents().textContent!;
    let matchRes, command;
    if ((matchRes = prefix.match(/^(#{1,6})/))) {
      const offset = block.getOffset();
      const level = matchRes[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const newBlock = new Headings({
        level,
        innerHTML: block.el.innerHTML.replace(/^#+/, " "),
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
        innerHTML: block.el.innerHTML.replace(/^(》|&gt;)([!? ])?/, ""),
      });
      const newOffset = FIRST_POSITION;
      command = new BlockReplace({
        page,
        block,
        offset,
        newOffset,
        newBlock,
      });
    } else if (prefix.match(/^ *(-*) */)) {
      const offset = block.getOffset();
      const newBlock = new List({
        firstLiInnerHTML: block.el.innerHTML.replace(/^ *(-*) */, ""),
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
      console.log("To Ordered List");
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
