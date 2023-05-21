import {
  BlockEventContext,
  Handler,
  FineHandlerMethods,
  MultiBlockEventContext,
  RangedBlockEventContext,
  dispatchKeyEvent,
} from "@ohno-editor/core/system/handler";
import { Dragable } from "./plugin";
import {
  BlockMove,
  BlocksMove,
} from "@ohno-editor/core/contrib/commands/block";
import {
  createRange,
  setLocation,
  setRange,
} from "@ohno-editor/core/system/range";
import {
  BlockActiveEvent,
  BlockUpdateEvent,
} from "@ohno-editor/core/system/pageevent";

export class DragablePluginHandler
  extends Handler
  implements FineHandlerMethods
{
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

    if (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      const where = e.key === "ArrowDown" ? "after" : "before";
      if (isMultiBlock) {
        const { blocks } = context as MultiBlockEventContext;
        const ref =
          e.key === "ArrowDown"
            ? page.getNextBlock(blocks[blocks.length - 1])
            : page.getPrevBlock(blocks[0]);
        const startBias = blocks[0].getGlobalBias([
          range.startContainer,
          range.startOffset,
        ]);
        const endBias = blocks[blocks.length - 1].getGlobalBias([
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
              const startLoc = startBlock.getGlobalLocation(startBias);
              const endLoc = endBlock.getGlobalLocation(endBias);
              setRange(createRange(...startLoc!, ...endLoc!));
            })
            .onUndo(({ orders }) => {
              const startBlock = page.query(orders[0])!;
              const endBlock = page.query(orders[orders.length - 1])!;
              const startLoc = startBlock.getGlobalLocation(startBias);
              const endLoc = endBlock.getGlobalLocation(endBias);
              setRange(createRange(...startLoc!, ...endLoc!));
            });
          page.executeCommand(command);
        }
      } else {
        const bias = block.getGlobalBias([
          range.startContainer,
          range.startOffset,
        ]);
        const ref =
          e.key === "ArrowDown"
            ? page.getNextBlock(block)
            : page.getPrevBlock(block);
        if (ref) {
          const command = new BlockMove({
            page,
            order: block.order,
            ref,
            where,
          })
            .onExecute(({ order }, { newOrder }) => {
              const block = page.query(newOrder)!;
              page.setLocation(block.getGlobalLocation(bias)!, block);
            })
            .onUndo(({ order }) => {
              const block = page.query(order)!;
              page.setLocation(block.getGlobalLocation(bias)!, block);
            });
          page.executeCommand(command);
        }
      }

      return true;
    }
  }

  handleArrowKeyUp(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page, block, endBlock } = context;
    if (!endBlock) {
      const plugin = page.getPlugin<Dragable>("dragable");
      plugin.span(block);
    }
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
