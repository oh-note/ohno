import { getDefaultRange } from "@/helper/document";
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  RangedEventContext,
  dispatchKeyDown,
  setBeforeHandlers,
} from "@/system/handler";
import { FIRST_POSITION, offsetToRange } from "@/system/position";
import { BlockCreate, BlockReplace } from "@/contrib/commands/block";
import { containHTMLElement } from "@/helper/element";
import {
  Paragraph,
  prepareDeleteCommand,
  prepareEnterCommand,
} from "../paragraph";
import { Blockquote } from "./block";

export class BlockQuoteHandler extends Handler implements KeyDispatchedHandler {
  name: string = "blockquote";
  handleKeyPress(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
  }
  handleDeleteDown(
    e: KeyboardEvent,
    { page, block, range }: EventContext
  ): boolean | void {
    if (!range) {
      throw new NoRangeError();
    }

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
        const blockquote = new Blockquote({
          innerHTML: innerHTML,
        });
        return new BlockCreate({
          block: block,
          newBlock: blockquote,
          offset: offset,
          newOffset: FIRST_POSITION,
          where: "after",
          page: page,
        });
      }) // 将新文本添加到
      .build();

    page.executeCommand(command);
  }
  handleSpaceDown(e: KeyboardEvent, context: EventContext): boolean | void {
    const { block, range } = context;
    if (!range) {
      throw new NoRangeError();
    }
    // 只在最右侧空格时触发 Block change 事件
    if (!block.isRight(range)) {
      return;
    }
    // 存在 HTMLElement 取消判定
    if (containHTMLElement(block.root)) {
      return;
    }

    const prefix = block.root.textContent || "";
    if (prefix.match(/^#{1,6} *$/)) {
      console.log("To Heading");
    } else if (prefix.match(/^ *(-*) *$/)) {
      console.log("To List");
    } else if (prefix.match(/^ *([0-9]+\.) *$/)) {
      console.log("To Ordered List");
    } else if (prefix.match(/^`{3}.*$/)) {
      console.log("To Ordered List");
    } else {
      return;
    }

    e.stopPropagation();
    e.preventDefault();
  }
}
