import {
  AnyBlock,
  BlockQuery,
  Order,
  Command,
  CommandCallback,
  Page,
  ListCommandBuilder,
} from "@ohno-editor/core/system/types";

import { Paragraph } from "../blocks";

export interface BlockCreatePayload {
  page: Page;
  block: AnyBlock;
  newBlock: AnyBlock;
  where: "after" | "tail" | "head" | "before";
}

export interface BlockRemovePayload {
  page: Page;
  block: BlockQuery;
}
export interface BlocksRemovePayload {
  page: Page;
  blocks: AnyBlock[];
}

export interface BlockReplacePayload {
  page: Page;
  block: AnyBlock;
  newBlock: AnyBlock;

  // offset?: Offset;
  // newOffset?: Offset;
}

export class BlockReplace extends Command<BlockReplacePayload> {
  onExecuteFn: CommandCallback<BlockReplacePayload> = ({
    page,
    newBlock,
    // newOffset,
  }) => {
    page.setLocation(newBlock.getLocation(0, 0)!, newBlock);
  };

  onUndoFn: CommandCallback<BlockReplacePayload> = ({ block, page }) => {
    page.setLocation(block.getLocation(0, 0)!, block);
  };

  execute(): void {
    this.onExecuteFn;
    const { page, block, newBlock } = this.payload;
    page.replaceBlock(newBlock, block);
  }

  undo(): void {
    const { page, block, newBlock } = this.payload;
    page.replaceBlock(block, newBlock);
  }
}

export class BlocksRemove extends Command<BlocksRemovePayload> {
  declare buffer: {
    // 待删除的最后一个 Block 的下一个 Block，可以为空
    orders: Order[];
    blocks: AnyBlock[];
    endBlock: AnyBlock | null;
  };
  execute(): void {
    const { page, blocks } = this.payload;
    this.buffer = {
      blocks: blocks.slice().reverse(),
      orders: blocks
        .map((item) => {
          return item.order;
        })
        .reverse(),
      endBlock: page.getNextBlock(blocks[blocks.length - 1]),
    };
    blocks.forEach((item) => {
      page.removeBlock(item.order);
    });
  }
  undo(): void {
    const { page } = this.payload;
    const { blocks, orders } = this.buffer;
    let cur = this.buffer.endBlock;
    blocks.forEach((block, index) => {
      block.setOrder(this.buffer.orders[index]);
      if (cur) {
        page.insertBlockAdjacent(block, "before", cur);
      } else {
        page.appendBlock(block);
      }
      cur = block;
    });
  }
}

export function withNearestLocation(command: BlockRemove): Command<any> {
  const { page, block } = command.payload;
  const nextBlock = page.getNextBlock(block);
  if (nextBlock) {
    command.onExecute(() => {
      page.setLocation(nextBlock.getLocation(0, 0)!);
    });
    return command;
  }
  const prevBlock = page.getPrevBlock(block);
  if (prevBlock) {
    command.onExecute(() => {
      page.setLocation(prevBlock.getLocation(-1, -1)!);
    });
    return command;
  }

  const builder = new ListCommandBuilder({ page, block })
    .addLazyCommand(() => {
      const newBlock = new Paragraph();
      return new BlockCreate({
        block: page.query(block)!,
        page,
        newBlock,
        where: "before",
      });
    })
    .addCommand(command);

  return builder.build();
}

export class BlockRemove extends Command<BlockRemovePayload> {
  declare buffer: {
    order: Order;
    block: AnyBlock;
    nextBlock: AnyBlock | null;
  };
  execute(): void {
    const { page, block: query } = this.payload;
    const block = page.query(query)!;
    this.buffer = {
      block,
      order: block.order,
      nextBlock: page.getNextBlock(block),
    };
    page.removeBlock(block.order);
  }
  undo(): void {
    const { page } = this.payload;
    const { block } = this.buffer;

    block.setOrder(this.buffer.order);
    if (this.buffer.nextBlock) {
      page.insertBlockAdjacent(block, "before", this.buffer.nextBlock);
    } else {
      page.appendBlock(block);
    }
  }
}

export interface BlockMovePayload {
  page: Page;
  order: Order;
  ref: AnyBlock;
  where: "after" | "before";
}

export interface BlocksMovePayload {
  page: Page;
  orders: Order[];
  ref: AnyBlock;
  where: "after" | "before";
}

export class BlocksMove extends Command<BlocksMovePayload> {
  declare buffer: {
    nextRef?: string;
    orders: string[];
    newOrders: string[];
  };
  execute(): void {
    const { page, orders, ref, where } = this.payload;
    const next = page.getNextBlock(orders[orders.length - 1]);

    const blocks = orders.map((item) => page.query(item)!);
    let curRef = ref;

    const newOrders = blocks.map((item) => {
      page.removeBlock(item);
      page.insertBlockAdjacent(item, where, curRef);
      if (where === "after") {
        curRef = item;
      }
      return item.order;
    });

    this.buffer = {
      nextRef: next?.order,
      orders,
      newOrders,
    };
  }
  undo(): void {
    const { page } = this.payload;
    const { nextRef, orders, newOrders } = this.buffer;

    const blocks = newOrders.map((item) => page.query(item)!);
    blocks.forEach((item, index) => {
      page.removeBlock(item);
      item.setOrder(orders[index]);
    });
    if (!nextRef) {
      blocks.forEach((item) => {
        page.appendBlock(item);
      });
    } else {
      blocks.forEach((item) => {
        page.insertBlockAdjacent(item, "before", nextRef);
      });
    }
  }
}
export class BlockMove extends Command<BlockMovePayload> {
  declare buffer: {
    nextRef?: string;
    order: string;
    newOrder: string;
  };
  execute(): void {
    const { page, order, ref, where } = this.payload;
    const block = page.query(order)!;
    const next = page.getNextBlock(order);
    this.buffer = {
      nextRef: next?.order,
      order,
      newOrder: block.order,
    };

    page.removeBlock(block);
    block.setOrder(order);
    page.insertBlockAdjacent(block, where, ref);
  }
  undo(): void {
    const { page } = this.payload;
    const { nextRef, order, newOrder } = this.buffer;
    const block = page.query(newOrder)!;
    page.removeBlock(block);
    block.setOrder(order);
    if (!nextRef) {
      page.appendBlock(block);
    } else {
      page.insertBlockAdjacent(block, "before", nextRef);
    }
  }
}

export interface BlocksCreatePayload {
  page: Page;
  block: AnyBlock;
  newBlocks: AnyBlock[];
  where: "after" | "tail" | "head" | "before";

  // offset?: Offset;
  // newOffset?: Offset;
}
export class BlocksCreate extends Command<BlocksCreatePayload> {
  onExecuteFn: CommandCallback<BlocksCreatePayload> = ({ page, newBlocks }) => {
    const newBlock = newBlocks[newBlocks.length - 1];
    page.setLocation(newBlock.getLocation(0, 0)!, newBlock);
  };
  onUndoFn: CommandCallback<BlocksCreatePayload> = ({ page, block }) => {
    page.setLocation(block.getLocation(0, 0)!, block);
  };
  execute(): void {
    const { where, page, block, newBlocks } = this.payload;

    if (where === "after") {
      let cur = block;
      newBlocks.forEach((newBlock) => {
        page.insertBlockAdjacent(newBlock, "after", cur);
        cur = newBlock;
      });
      // page.insertBlockAfter(block.order, newBlock);
    } else if (where === "before") {
      // let cur = block;
      newBlocks.forEach((newBlock) => {
        page.insertBlockAdjacent(newBlock, "before", block);
        // cur = newBlock;
      });
      // page.insertBlockBefore(block.order, newBlock);
    } else if (where === "head") {
      if (page.chain.first) {
        // let cur = page.chain.first.value;
        newBlocks.forEach((newBlock) => {
          page.insertBlockAdjacent(newBlock, "before", block);
          // cur = newBlock;
        });
        // page.insertBlockBefore(page.blockChain.first.name!, newBlock);
      } else {
        newBlocks.forEach((newBlock) => {
          page.appendBlock(newBlock);
        });
      }
    } else if (where === "tail") {
      newBlocks.forEach((newBlock) => {
        page.appendBlock(newBlock);
      });
    }
  }
  undo(): void {
    const { page, newBlocks } = this.payload;
    newBlocks.forEach((item) => {
      page.removeBlock(item.order);
    });
  }
}

export class BlockCreate extends Command<BlockCreatePayload> {
  onExecuteFn: CommandCallback<BlockCreatePayload> = ({ page, newBlock }) => {
    page.setLocation(newBlock.getLocation(0, 0)!, newBlock);
  };
  onUndoFn: CommandCallback<BlockCreatePayload> = ({ page, block }) => {
    page.setLocation(block.getLocation(0, 0)!, block);
  };
  execute(): void {
    const { where, page, block, newBlock } = this.payload;

    if (where === "after") {
      page.insertBlockAdjacent(newBlock, "after", block);
      // page.insertBlockAfter(block.order, newBlock);
    } else if (where === "before") {
      page.insertBlockAdjacent(newBlock, "before", block);
      // page.insertBlockBefore(block.order, newBlock);
    } else if (where === "head") {
      if (page.chain.first) {
        page.insertBlockAdjacent(newBlock, "before", page.chain.first.value);
        // page.insertBlockBefore(page.blockChain.first.name!, newBlock);
      } else {
        page.appendBlock(newBlock);
      }
    } else if (where === "tail") {
      page.appendBlock(newBlock);
    }
  }
  undo(): void {
    const { page, newBlock } = this.payload;
    page.removeBlock(newBlock.order);
  }
}
