import {
  BlockEventContext,
  RangedBlockEventContext,
  dispatchKeyEvent,
  PagesHandleMethods,
} from "@ohno-editor/core/system/handler";
import { BlockRemove, BlockReplace } from "../../commands";
import { AnyBlock } from "@ohno-editor/core/system";
import { Paragraph } from "../paragraph";

export class DivideHandler implements PagesHandleMethods {
  name: string = "divide";
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
  // 在 CompositionStart 时处理选中内容
  handleCompositionStart(
    e: CompositionEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return true;
  }

  handleDeleteDown(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {
    const { page, block } = context;

    let nextBlock: AnyBlock;
    let command;
    if ((nextBlock = page.getNextBlock(block)!)) {
      command = new BlockRemove({ page, block })
        .onExecute(() => {
          page.setLocation(nextBlock.getLocation(0, 0)!);
        })
        .onUndo(() => {
          page.setLocation(block.getLocation(0, 0)!);
        });
    } else if ((nextBlock = page.getPrevBlock(block)!)) {
      command = new BlockRemove({ page, block })
        .onExecute(() => {
          page.setLocation(nextBlock.getLocation(-1, -1)!);
        })
        .onUndo(() => {
          page.setLocation(block.getLocation(0, 0)!);
        });
    } else {
      const newBlock = page.createBlock<Paragraph>("paragraph");
      command = new BlockReplace({ page, block, newBlock })
        .onExecute(() => {
          page.setLocation(newBlock.getLocation(-1, -1)!);
        })
        .onUndo(() => {
          page.setLocation(block.getLocation(0, 0)!);
        });
    }
    page.executeCommand(command);
    return true;
  }

  handleBackspaceDown(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {
    const { page, block } = context;

    let nextBlock: AnyBlock;
    let command;
    if ((nextBlock = page.getPrevBlock(block)!)) {
      command = new BlockRemove({ page, block })
        .onExecute(() => {
          page.setLocation(nextBlock.getLocation(-1, -1)!);
        })
        .onUndo(() => {
          page.setLocation(block.getLocation(0, 0)!);
        });
    } else if ((nextBlock = page.getNextBlock(block)!)) {
      command = new BlockRemove({ page, block })
        .onExecute(() => {
          page.setLocation(nextBlock.getLocation(0, 0)!);
        })
        .onUndo(() => {
          page.setLocation(block.getLocation(0, 0)!);
        });
    } else {
      const newBlock = page.createBlock<Paragraph>("paragraph");
      command = new BlockReplace({ page, block, newBlock })
        .onExecute(() => {
          page.setLocation(newBlock.getLocation(-1, -1)!);
        })
        .onUndo(() => {
          page.setLocation(block.getLocation(0, 0)!);
        });
    }
    page.executeCommand(command);
    return true;
  }

  handleEnterDown(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {
    return true;
  }

  handleBeforeInput(
    e: TypedInputEvent,
    context: BlockEventContext
  ): boolean | void {
    // const { block, page, range } = context;
    return true;
  }
}
