import {
  BlockEventContext,
  Handler,
  FineHandlerMethods,
  RangedBlockEventContext,
  dispatchKeyEvent,
} from "@ohno-editor/core/system/handler";
import {
  getTokenSize,
  tokenBetweenRange,
} from "@ohno-editor/core/system/position";
import {
  BlockCreate,
  BlockRemove,
  BlockReplace,
  BlocksRemove,
} from "@ohno-editor/core/contrib/commands/block";
import { outerHTML } from "@ohno-editor/core/helper/element";
import { ListCommandBuilder } from "@ohno-editor/core/contrib/commands/concat";
import { Headings } from "../headings";
import { Paragraph } from "./block";
import { AnyBlock } from "@ohno-editor/core/system/block";
import { Blockquote } from "../blockquote";
import { List } from "../list";
import { RichTextDelete, TextInsert } from "@ohno-editor/core/contrib/commands";
import { Empty, SetLocation } from "@ohno-editor/core/contrib/commands/select";
import { ContainerRemove } from "@ohno-editor/core/contrib/commands/container";
import { OrderedList } from "../orderedList";
import {
  createRange,
  setLocation,
  setRange,
} from "@ohno-editor/core/system/range";
import { Code } from "../code";

export interface DeleteContext extends BlockEventContext {
  nextBlock: AnyBlock;
}

export function prepareDeleteCommand({
  page,
  block,
  nextBlock,
}: DeleteContext) {
  const builder = new ListCommandBuilder({ page, block, nextBlock })
    .withLazyCommand(({ page, block, nextBlock }, extra, status) => {
      //
      if (nextBlock.inner.innerHTML.length > 0) {
        const token_number = getTokenSize(block.inner);
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
    .withLazyCommand(() => {
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
    .withLazyCommand(({ block, page, range }, _, status) => {
      // 1. 如果存在选中文本，则删除。
      if (range.collapsed) {
        // 没有选中文本，不需要删除
        return;
      }
      const start = block.getBias([range.startContainer, range.startOffset]);
      const token_number = tokenBetweenRange(range);
      return new RichTextDelete({
        page,
        block,
        start,
        index: 0,
        token_number,
      }).onUndo(({ block, start, token_number }) => {
        setRange(
          block.getEditableRange({
            start,
            end: start + token_number,
            index: 0,
          })!
        );
      });
    })
    .withLazyCommand(({ block, page, range }, extra) => {
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
      const full_token_number = getTokenSize(block.inner);
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
        start,
        token_number: full_token_number - start,
      }).onUndo(({ block, start }) => {
        page.setLocation(block.getLocation(start, 0)!, block);
      });
    });

  return builder;
}

export class ParagraphHandler extends Handler implements FineHandlerMethods {
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
    { page, block, range }: RangedBlockEventContext
  ): boolean | void {
    if (!block.isLocationInRight([range.startContainer, range.startOffset])) {
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
    if (nextBlock.isMultiEditable) {
      // 删除第一个 Container
      // 将 Container 的内容插入到末尾
      const command = new ListCommandBuilder({
        page,
        block,
        nextBlock,
      })
        .withLazyCommand(({ block, nextBlock }, extra) => {
          // 1/1 删除下一个 Block 的首元素
          // 1/2 如果下一个多区域元素是只有一个 Editable，则直接删除整个 Block
          const n = nextBlock.getEditables().length;
          extra["innerHTML"] = nextBlock.getFirstEditable().innerHTML;
          if (n === 1) {
            return new BlockRemove({ page, block: nextBlock });
          } else {
            return new ContainerRemove({ page, block: nextBlock, indexs: [0] });
          }
        })
        .withLazyCommand(({ block, page }, { innerHTML }) => {
          // const insertOffset = block.getOffset();
          // 将删除的 Editable 的内容插入到该 block
          const start = getTokenSize(block.getEditable(0));
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
    { block, page, range }: RangedBlockEventContext
  ): boolean | void {
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

    // 只需要考虑 Paragraph 类和 List 类型的退格删除导致的 Block 间信息增删行为
    // 对这两种删除行为，List 是将退格部分转化为 Paragraph（可能导致 List 分裂成两个）
    // Paragraph 是将整个 Block 的内容 put 到上一个 Block 的 LastContainer 中
    // 对 Paragraph，只需要 BlockRemove 和 TextInsert 两个命令的组合，即可完成这一操作
    // 对 List，还需要额外分析退格的 Container Index，并额外的创建 1 或 2 个 BlockCreate 命令
    const command = new ListCommandBuilder({ page, block, prevBlock })
      .withLazyCommand(() => {
        // 1. 删除当前 block
        return new BlockRemove({
          page,
          block,
        }).onUndo((_, { block }) => {
          page.setLocation(block.getLocation(0, 0)!, block);
        });
      })
      .withLazyCommand(({ page, block, prevBlock }, extra, status) => {
        const token_number = getTokenSize(prevBlock.getLastEditable());
        if (block.root.innerHTML.length > 0) {
          // 2/1. 将当前 block 的内容添加到上一个 block的 lastBlock 中
          return new TextInsert({
            page: page,
            block: prevBlock,
            start: token_number,
            index: -1,
            // insertOffset: { index: -1, start: -1 },
            innerHTML: block.root.innerHTML,
          }).onExecute(({ block }) => {
            page.setLocation(block.getLocation(token_number, -1)!, block);
          });
        } else {
          // 2/2. 如果是个空 Block，直接在删除后将内容放到上面去
          return new Empty({ page, block, prevBlock })
            .onExecute(({ page }) => {
              page.setLocation(
                prevBlock.getLocation(token_number, -1)!,
                prevBlock
              );
            })
            .onUndo(({ page }) => {
              page.setLocation(block.getLocation(token_number, 0)!, block);
            });
          return new SetLocation({
            page,
            newBlock: prevBlock,
            newOffset: { start: token_number, end: token_number, index: -1 },
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
    { page, block, range }: RangedBlockEventContext
  ): boolean | void {
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
      const command = prepareEnterCommand({ page, block, range })
        .withLazyCommand(({ block, page }, { innerHTML }) => {
          if (innerHTML === undefined) {
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
          });
        })
        .build();

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
        innerHTML: block.root.innerHTML.replace(/^#+/, ""),
      });
      command = new BlockReplace({
        page,
        block,
        newBlock,
      });
    } else if ((matchRes = prefix.match(/^[>》]([!? ])?$/))) {
      const newBlock = new Blockquote({
        innerHTML: block.root.innerHTML.replace(/^(》|&gt;)([!? ])?/, ""),
      });
      command = new BlockReplace({
        page,
        block,
        newBlock,
      });
    } else if (prefix.match(/^ *- *$/)) {
      const newBlock = new List({
        innerHTMLs: [block.root.innerHTML.replace(/^ *- */, "")],
      });
      command = new BlockReplace({
        page,
        block,
        newBlock,
      });
    } else if (prefix.match(/^ *([0-9]+\.) *$/)) {
      const newBlock = new OrderedList({
        innerHTMLs: [block.root.innerHTML.replace(/^ *([0-9]+\.) */, "")],
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
