import { Offset, offsetToRange } from "@/system/position";
import { AnyBlock } from "@/system/block";
import { Command, CommandCallback } from "@/system/history";
import { Page } from "@/system/page";
import { setRange } from "@/system/range";

export interface BlockCreatePayload {
  page: Page;
  block: AnyBlock;
  newBlock: AnyBlock;
  where: "after" | "tail" | "head" | "before";

  offset?: Offset;
  newOffset?: Offset;
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

  offset?: Offset;
  newOffset?: Offset;
}

export class BlockReplace extends Command<BlockReplacePayload> {
  onExecuteFn: CommandCallback<BlockReplacePayload> = ({
    newBlock,
    newOffset,
  }) => {
    if (newOffset) {
      newBlock.setOffset(newOffset);
    }
  };

  onUndoFn: CommandCallback<BlockReplacePayload> = ({ block, offset }) => {
    if (offset) {
      block.setOffset(offset);
    }
  };

  execute(): void {
    this.onExecuteFn;
    const { page, block, newBlock } = this.payload;
    page.replaceBlock(block.order, newBlock);
  }

  undo(): void {
    const { page, block, newBlock } = this.payload;
    page.replaceBlock(newBlock.order, block);
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
          page.insertBlockBefore(cur.order, block);
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
      page.insertBlockBefore(this.buffer.nextBlock.order, block);
    } else {
      page.appendBlock(block);
    }
  }
}

export class BlockCreate extends Command<BlockCreatePayload> {
  onExecuteFn: CommandCallback<BlockCreatePayload> = ({
    newBlock,
    newOffset,
  }) => {
    if (newOffset) {
      newBlock.setOffset(newOffset);
    }
  };
  onUndoFn: CommandCallback<BlockCreatePayload> = ({ block, offset }) => {
    if (offset) {
      block.setOffset(offset);
    }
  };
  execute(): void {
    const { where, page, block, newBlock } = this.payload;

    if (where === "after") {
      page.insertBlockAfter(block.order, newBlock);
    } else if (where === "before") {
      page.insertBlockBefore(block.order, newBlock);
    } else if (where === "head") {
      if (page.blockChain.first) {
        page.insertBlockBefore(page.blockChain.first.name!, newBlock);
      } else {
        page.appendBlock(newBlock);
      }
    } else if (where === "tail") {
      page.appendBlock(newBlock);
    }
  }
  undo(): void {
    const { page, block, newBlock, offset } = this.payload;
    page.removeBlock(newBlock.order);
  }
}
