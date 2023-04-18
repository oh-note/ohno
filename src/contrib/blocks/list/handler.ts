import { createElement, getDefaultRange } from "@helper/document";
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  dispatchKeyDown,
} from "@system/handler";
import {
  FIRST_POSITION,
  LAST_POSITION,
  elementOffset,
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
import { ContainerPayload, Payload } from "@system/history";
import { Headings } from "../headings";
import { List } from "./block";
import { AnyBlock } from "@system/block";
import { createRange } from "@system/range";
import { Blockquote } from "../blockquote";
import { ContainerInsert, ContainerRemove } from "@contrib/commands/container";
import { addMarkdownHint } from "@helper/markdown";
import { Paragraph } from "../paragraph";

export interface DeleteContext extends EventContext {
  nextBlock: AnyBlock;
}

export function prepareDeleteCommand({
  page,
  block,
  nextBlock,
}: DeleteContext) {
  const offset = block.getOffset();
  const containers = block.containers();
  const builder = new ListCommandBuilder({ page, block, nextBlock });
  if (offset.index === containers.length - 1) {
    // 在最后一个 index 时
    // 如果是 list ，就合并 BlockRemove -> ContainerCreate

    if (nextBlock.multiContainer) {
      builder
        .withLazyCommand(({ page, block, nextBlock }, extra) => {
          const containers = nextBlock
            .containers()
            .map((item) => item.cloneNode(true));
          extra["containers"] = containers;
          return new BlockRemove({
            block: nextBlock,
            page: page,
            beforeOffset: offset,
          });
        })
        .withLazyCommand(({ block, page }, { containers }) => {
          return new ContainerInsert({
            block: block,
            index: offset.index!,
            newContainer: containers,
            page,
            afterOffset: { ...LAST_POSITION, index: offset.index },
            where: "below",
          });
        });
    } else {
      // 如果是 paragraph，就 BlockRemove -> TextInsert

      builder
        .withLazyCommand(({ block, page }, extra) => {
          extra["innerHTML"] = nextBlock.el.innerHTML;

          return new BlockRemove({
            block: nextBlock,
            page: page,
            beforeOffset: offset,
          });
        })
        .withLazyCommand(({ block, page }, { innerHTML }) => {
          return new TextInsert(
            {
              block,
              page,
              insertOffset: offset,
              innerHTML,
            },
            ({ block, insertOffset }) => {
              block.setOffset(insertOffset);
            }
          );
        });
    }
  } else {
    // 在中间 index 时，将下一个 container 的内容合并， ContainerRemove -> TextInsert
    builder
      .withLazyCommand(({ block, page }, extra) => {
        const nextIndex = offset.index! + 1;
        extra["innerHTML"] = containers[nextIndex].innerHTML;

        return new ContainerRemove({ block, page, index: [nextIndex] });
      })
      .withLazyCommand(({ block, page }, { innerHTML }) => {
        return new TextInsert(
          { block, page, innerHTML, insertOffset: offset },
          ({ block, insertOffset }) => {
            block.setOffset(insertOffset);
          }
        );
      });
  }

  // .withLazyCommand(({ page, block, nextBlock }, extra, status) => {
  //   if (nextBlock.el.innerHTML.length > 0) {
  //     return new TextInsert({
  //       block: block,
  //       insertOffset: { index: -1, start: -1 },
  //       afterOffset: { index: -1, start: -1 },
  //       page: page,
  //       innerHTML: nextBlock.el.innerHTML,
  //     });
  //   }
  //   return null;
  // })
  // .withLazyCommand(() => {
  //   return new BlockRemove({
  //     page,
  //     block: nextBlock,
  //     offset: FIRST_POSITION,
  //   });
  // });
  return builder;
}

export function prepareEnterCommand({ page, block }: EventContext) {
  const container = block.currentContainer();
  const builder = new ListCommandBuilder<ContainerPayload>({
    page,
    block,
    container,
  })
    .withLazyCommand(({ block, page, container }, _, status) => {
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

      const offset = rangeToOffset(container, range);
      return new TextDeleteSelection({
        block: block,
        page: page,
        delOffset: offset,
      });
    })
    .withLazyCommand(({ block, page, container }, extra, status) => {
      const range = getDefaultRange();
      if (!range) {
        throw new Error("sanity check");
      }
      // 删除右侧部分
      const oldOffset = { ...LAST_POSITION, index: block.getOffset().index };
      if (block.isRight(range)) {
        // 已经在最右侧了，直接返回并新建 Block
        status.skip();
        extra["innerHTML"] = "";
        extra["oldOffset"] = oldOffset;
        console.log("skip remove right");
        return;
      }
      // 获取光标到右侧的文本，删除并将其作为新建 Block 的参数
      const offset = rangeToOffset(container, range);
      offset.end = -1;
      offset.index = oldOffset.index;

      const tailSelectedRange = offsetToRange(container, offset);
      const newContent = tailSelectedRange!.cloneContents();

      extra["innerHTML"] = outerHTML(newContent);
      extra["oldOffset"] = oldOffset;
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

export class ListHandler extends Handler implements KeyDispatchedHandler {
  block_type: string = "list";
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
    const command = prepareDeleteCommand({ page, block, nextBlock }).build();
    page.executeCommand(command);
    return true;
  }
  handleTabDown(
    e: KeyboardEvent,
    { page, block }: EventContext
  ): boolean | void {
    const container = block.currentContainer();
  }

  handleBackspaceDown(
    e: KeyboardEvent,
    { block, page }: EventContext
  ): boolean | void {
    const range = getDefaultRange();
    if (!block.isLeft(range) || !range.collapsed) {
      return;
    }

    const offset = block.getOffset();
    let command;
    const cn = block.containers().length;
    if (cn === 1) {
      command = new BlockReplace({
        block,
        page,
        offset: FIRST_POSITION,
        newBlock: new Paragraph({
          innerHTML: block.currentContainer().innerHTML,
        }),
        newOffset: FIRST_POSITION,
      });
    } else {
      // 只需要考虑 Paragraph 类和 List 类型的退格删除导致的 Block 间信息增删行为
      // 对这两种删除行为，List 是将退格部分转化为 Paragraph（可能导致 List 分裂成两个）
      // Paragraph 是将整个 Block 的内容 put 到上一个 Block 的 LastContainer 中
      // 对 Paragraph，只需要 BlockRemove 和 TextInsert 两个命令的组合，即可完成这一操作
      // 对 List，还需要额外分析退格的 Container Index，并额外的创建 1 或 2 个 BlockCreate 命令
      command = new ListCommandBuilder({ page, block })
        .withLazyCommand((_, extra) => {
          // 删除 index 之后的全部 Container，但是保留内容
          const containers = block
            .containers()
            .filter((item, index) => index >= offset.index!);
          extra["containers"] = containers.map((item) => item.cloneNode(true));
          const index = Array.from(
            { length: containers.length },
            (_, index) => index + offset.index!
          );
          return new ContainerRemove(
            { page, block, index },
            undefined,
            ({ beforeOffset }) => {
              block.setOffset(beforeOffset!);
            }
          );
        })
        .withLazyCommand(({ page, block }, { containers }, status) => {
          return new BlockCreate({
            page,
            block,
            offset: FIRST_POSITION,
            newBlock: new List({
              children: (containers as HTMLElement[]).slice(
                1
              ) as HTMLLIElement[],
            }),
            newOffset: FIRST_POSITION,
            where: "after",
          });
        })
        .withLazyCommand(({ page, block }, { containers }) => {
          //  将 containers[0] 保存为 paragraph，将 containers[1:] 新增为 List
          return new BlockCreate(
            {
              page,
              block,
              offset: FIRST_POSITION,
              newBlock: new Paragraph({ innerHTML: containers[0].innerHTML }),
              newOffset: FIRST_POSITION,
              where: "after",
            },
            defaultAfterBlockCreateExecute
          );
        })
        .withLazyCommand(({ block, page }) => {
          if (offset.index === 0) {
            return new BlockRemove({ block, page, beforeOffset: offset });
          }
        })
        .build();
    }

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
        const newLi = createElement("li");
        newLi.innerHTML = innerHTML;
        addMarkdownHint(newLi);
        outerHTML(newLi);

        return new ContainerInsert({
          block,
          page,
          newContainer: [newLi],
          index: oldOffset.index!,
          where: "below",
        });
      })
      .build();

    page.executeCommand(command);
  }
}
