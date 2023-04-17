import { getDefaultRange } from "@helper/document";
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  dispatchKeyDown,
} from "@system/handler";
import { FIRST_POSITION } from "@system/position";
import { BlockCreate, BlockReplace } from "@contrib/commands/block";
import { containHTMLElement } from "@helper/element";
import {
  Paragraph,
  prepareDeleteCommand,
  prepareEnterCommand,
} from "../paragraph";

export class HeadingsHandler extends Handler implements KeyDispatchedHandler {
  block_type: string = "headings";
  handleKeyPress(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleKeyDown(e: KeyboardEvent, context: EventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
  }
  handleDeleteDown(
    e: KeyboardEvent,
    { page, block }: EventContext
  ): boolean | void {
    const range = getDefaultRange();
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
    { page, block }: EventContext
  ): boolean | void {
    const range = getDefaultRange();
    if (!block.isLeft(range)) {
      return;
    }
    const prevBlock = page.getPrevBlock(block);
    if (!prevBlock) {
      // 在左上方，不做任何操作
      e.preventDefault();
      e.stopPropagation();
      return true;
    }

    const command = new BlockReplace({
      block,
      page,
      offset: FIRST_POSITION,
      newBlock: new Paragraph({ innerHTML: block.el.innerHTML }),
      newOffset: FIRST_POSITION,
    });
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

    const command = prepareEnterCommand({ page, block })
      .withLazyCommand(({ block, page }, { innerHTML, oldOffset }) => {
        if (innerHTML === undefined || !oldOffset) {
          throw new Error("sanity check");
        }
        const paragraph = new Paragraph({
          innerHTML: innerHTML,
        });
        return new BlockCreate({
          block: block,
          newBlock: paragraph,
          offset: oldOffset,
          newOffset: FIRST_POSITION,
          where: "after",
          page: page,
        });
      }) // 将新文本添加到
      .build();

    page.executeCommand(command);
  }
  handleSpaceDown(e: KeyboardEvent, context: EventContext): boolean | void {
    const { block } = context;
    const range = document.getSelection()?.getRangeAt(0);
    if (!range) {
      console.log("have no range");
      return;
    }
    // 只在最右侧空格时触发 Block change 事件
    if (!block.isRight(range)) {
      console.log("is not Right");
      return;
    }
    // 存在 HTMLElement 取消判定
    if (containHTMLElement(block.el)) {
      console.log("is not pure text");
      return;
    }
    const prefix = block.el.textContent || "";
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
