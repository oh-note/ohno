import {
  BlockEventContext,
  MultiBlockEventContext,
  RangedBlockEventContext,
  PagesHandleMethods,
  BlockActiveEvent,
  BlockUpdateEvent,
} from "@ohno-editor/core/system/types";
import {
  dispatchKeyEvent,
  createRange,
} from "@ohno-editor/core/system/functional";

import { Dragable } from "./plugin";
import { BlocksMove } from "@ohno-editor/core/contrib/commands/block";

export class DragablePluginHandler implements PagesHandleMethods {
  handleBlockUpdated(e: BlockUpdateEvent, context: any): boolean | void {
    const { page, block } = e;
    const plugin = page.getPlugin<Dragable>("dragable");
    if (block === plugin.current) {
      plugin.span(block);
    }
  }

  handleBlockActivated(e: BlockActiveEvent, context: any): boolean | void {
    const { page, block } = e;
    const plugin = page.getPlugin<Dragable>("dragable");
    plugin.span(block, true);
  }
  handleKeyPress(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {}
  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleKeyUp(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleMouseDown(e: MouseEvent, context: BlockEventContext): boolean | void {
    console.log(e);
    const { page, block, endBlock } = context;
    if (!endBlock) {
      const plugin = page.getPlugin<Dragable>("dragable");
      plugin.span(block);
    }
  }

  handleArrowKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext | MultiBlockEventContext
  ): boolean | void {
    const { page, block, range, isMultiBlock, endBlock } = context;
    if (e.shiftKey) {
      return;
    }

    if (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      const where = e.key === "ArrowDown" ? "after" : "before";
      const blocks = isMultiBlock
        ? (context as MultiBlockEventContext).blocks
        : [block];

      const ref =
        e.key === "ArrowDown"
          ? page.getNextBlock(blocks[blocks.length - 1])
          : page.getPrevBlock(blocks[0]);
      const startBias = blocks[0].getGlobalBiasPair([
        range.startContainer,
        range.startOffset,
      ]);
      const endBias = blocks[blocks.length - 1].getGlobalBiasPair([
        range.endContainer,
        range.endOffset,
      ]);
      if (ref) {
        const command = new BlocksMove({
          page,
          orders: blocks.map((item) => item.order),
          ref,
          where,
        })
          .onExecute(({ orders }, { newOrders }) => {
            const startBlock = page.query(newOrders[0])!;
            const endBlock = page.query(newOrders[newOrders.length - 1])!;
            const startLoc = startBlock.getLocation(...startBias);
            const endLoc = endBlock.getLocation(...endBias);
            page.setRange(createRange(...startLoc!, ...endLoc!));
          })
          .onUndo(({ orders }) => {
            const startBlock = page.query(orders[0])!;
            const endBlock = page.query(orders[orders.length - 1])!;
            const startLoc = startBlock.getLocation(...startBias);
            const endLoc = endBlock.getLocation(...endBias);
            page.setRange(createRange(...startLoc!, ...endLoc!));
          });
        page.executeCommand(command);
      }
      const plugin = page.getPlugin<Dragable>("dragable");
      plugin.span(block, true);
      return true;
    }
  }

  handleArrowKeyUp(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    // const { page, block, endBlock } = context;
  }
  handleDeleteDown(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {}
  handleBackspaceDown(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {}

  handleEnterDown(
    e: KeyboardEvent,
    context: BlockEventContext
  ): boolean | void {}
  handleSpaceDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
}
