import { getDefaultRange } from "@/helper/document";
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  RangedEventContext,
  dispatchKeyDown,
} from "@/system/handler";
import { FIRST_POSITION, offsetToRange } from "@/system/position";
import { BlockCreate, BlockReplace } from "@/contrib/commands/block";
import { containHTMLElement } from "@/helper/element";
import {
  Paragraph,
  prepareDeleteCommand,
  prepareEnterCommand,
} from "../paragraph";
import { Headings } from "./block";

export class HeadingsHandler extends Handler implements KeyDispatchedHandler {
  name: string = "headings";
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
  }
  handleDeleteDown(
    e: KeyboardEvent,
    { page, block }: EventContext
  ): boolean | void {
    const range = getDefaultRange();
    if (!block.isLeft(range) || !range.collapsed) {
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
    { page, block }: EventContext
  ): boolean | void {
    const range = getDefaultRange();
    if (!block.isLeft(range)) {
      return;
    }

    const command = new BlockReplace({
      block,
      page,
      offset: FIRST_POSITION,
      newBlock: new Paragraph({ innerHTML: block.root.innerHTML }),
      newOffset: FIRST_POSITION,
    });
    page.executeCommand(command);
    // 向前合并
    return true;
  }

  handleEnterDown(
    e: KeyboardEvent,
    { page, block, range }: EventContext
  ): boolean | void {
    e.stopPropagation();
    e.preventDefault();

    const command = prepareEnterCommand({ page, block, range })
      .withLazyCommand(({ block, page }, { innerHTML, offset }) => {
        if (innerHTML === undefined || !offset) {
          throw new Error("sanity check");
        }
        const paragraph = new Paragraph({
          innerHTML: innerHTML,
        });
        return new BlockCreate({
          block: block,
          newBlock: paragraph,
          offset: offset,
          newOffset: FIRST_POSITION,
          where: "after",
          page: page,
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
    // debugger;
    if ((matchRes = prefix.match(/^(#{1,6})/))) {
      const offset = block.getOffset();
      const level = matchRes[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      // if(level)
      let newBlock;
      if ((block as Headings).init.level === level) {
        newBlock = new Paragraph({
          innerHTML: block.root.innerHTML.replace(/^#+/, ""),
        });
      } else {
        newBlock = new Headings({
          level,
          innerHTML: block.root.innerHTML.replace(/^#+/, ""),
        });
      }
      const newOffset = FIRST_POSITION;
      command = new BlockReplace({
        page,
        block,
        offset,
        newOffset,
        newBlock,
      });
      page.executeCommand(command);
      return true;
    }
  }
}
