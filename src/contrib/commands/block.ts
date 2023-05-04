import { Command, CommandCallback } from "@/system/history";
import { Page } from "@/system/page";
import { setLocation } from "@/system/range";
import { AnyBlock } from "@/system/block";

export interface BlockCreatePayload {
  page: Page;
  block: AnyBlock;
  newBlock: AnyBlock;
  where: "after" | "tail" | "head" | "before";

  // offset?: Offset;
  // newOffset?: Offset;
}

export interface BlockRemovePayload {
  page: Page;
  block: AnyBlock;
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
    newBlock,
    // newOffset,
  }) => {
    setLocation(newBlock.getLocation(0, 0)!);
  };

  onUndoFn: CommandCallback<BlockReplacePayload> = ({ block }) => {
    setLocation(block.getLocation(0, 0)!);
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
    endBlock: AnyBlock | null;
  };
  execute(): void {
    const { page, blocks } = this.payload;
    this.buffer = {
      endBlock: page.getNextBlock(blocks[blocks.length - 1]),
    };
    blocks.forEach((item) => {
      page.removeBlock(item.order);
    });
  }
  undo(): void {
    const { page, blocks } = this.payload;
    let cur = this.buffer.endBlock;
    blocks
      .slice()
      .reverse()
      .forEach((block) => {
        if (cur) {
          page.insertBlockAdjacent(block, "before", cur);
        } else {
          page.appendBlock(block);
        }
        cur = block;
      });
  }
}

export class BlockRemove extends Command<BlockRemovePayload> {
  declare buffer: {
    nextBlock: AnyBlock | null;
  };
  execute(): void {
    const { page, block } = this.payload;
    this.buffer = {
      nextBlock: page.getNextBlock(block),
    };
    page.removeBlock(block.order);
  }
  undo(): void {
    const { page, block } = this.payload;
    if (this.buffer.nextBlock) {
      page.insertBlockAdjacent(block, "before", this.buffer.nextBlock);
    } else {
      page.appendBlock(block);
    }
  }
}

export class BlockCreate extends Command<BlockCreatePayload> {
  onExecuteFn: CommandCallback<BlockCreatePayload> = ({ newBlock }) => {
    setLocation(newBlock.getLocation(0, 0)!);
  };
  onUndoFn: CommandCallback<BlockCreatePayload> = ({ block }) => {
    setLocation(block.getLocation(0, 0)!);
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
