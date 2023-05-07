import { getDefaultRange } from "@/helper/document";
import {
  EventContext,
  Handler,
  FineHandlerMethods,
  RangedEventContext,
  dispatchKeyEvent,
} from "@/system/handler";
import { FIRST_POSITION, intervalToRange } from "@/system/position";
import { BlockCreate, BlockReplace } from "@/contrib/commands/block";
import { containHTMLElement } from "@/helper/element";
import {
  Paragraph,
  prepareDeleteCommand,
  prepareEnterCommand,
} from "../paragraph";
import { Headings } from "./block";
import { createRange } from "@/system/range";

export class HeadingsHandler extends Handler implements FineHandlerMethods {
  name: string = "headings";
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedEventContext
  ): boolean | void {}
  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }
  handleDeleteDown(
    e: KeyboardEvent,
    { page, block, range }: RangedEventContext
  ): boolean | void {
    if (
      !range.collapsed ||
      !block.isLocationInLeft([range.startContainer, range.startOffset])
    ) {
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
    { page, block, range }: RangedEventContext
  ): boolean | void {
    if (!block.isLocationInLeft([range.startContainer, range.startOffset])) {
      return;
    }

    const command = new BlockReplace({
      block,
      page,
      newBlock: new Paragraph({ innerHTML: block.root.innerHTML }),
    });
    page.executeCommand(command);
    return true;
  }

  handleEnterDown(
    e: KeyboardEvent,
    { page, block, range }: EventContext
  ): boolean | void {
    if (e.shiftKey) {
      const newBlock = new Paragraph();
      const command = new BlockCreate({
        page,
        block,
        where: "after",
        newBlock,
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
            block: block,
            newBlock: paragraph,
            where: "after",
            page: page,
          });
        })
        .build();

      page.executeCommand(command);
    }
    return true;
  }
  handleSpaceDown(
    e: KeyboardEvent,
    context: RangedEventContext
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
    // debugger;
    let matchRes;
    if ((matchRes = prefix.match(/^(#{1,6})/))) {
      const level = matchRes[1].length as 1 | 2 | 3 | 4 | 5 | 6;
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
