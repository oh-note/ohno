import { HTMLElementTagName } from "@helper/document";
import { createElement } from "@helper/document";
import { ValidNode, getTagName, outerHTML } from "@helper/element";
import { parentElementWithTag, validChildNodes } from "@helper/element";
import { addMarkdownHint } from "@helper/markdown";
import {
  FULL_BLOCK as FULL_SELECTED,
  Offset,
  elementOffset,
  offsetToRange,
} from "@system/position";
import { AnyBlock } from "@system/block";
import { Command } from "@system/history";
import { Page } from "@system/page";
import {
  getValidAdjacent,
  nodesOfRange,
  normalizeRange,
  setRange,
} from "@system/range";

export interface BlockCreatePayload {
  page: Page;
  block: AnyBlock;
  offset: Offset;
  where: "after" | "tail" | "head" | "before";
  newBlock: AnyBlock;
  newOffset: Offset;
}

export interface BlockRemovePayload {
  page: Page;
  block: AnyBlock;
  offset: Offset;
  undo_hint?: {
    nextBlock: AnyBlock | null;
  };
}

export interface BlockReplacePayload {
  page: Page;
  block: AnyBlock;
  offset: Offset;
  newBlock: AnyBlock;
  newOffset: Offset;
}

export interface BlockActivePayload {
  page: Page;
  block: AnyBlock;
  offset: Offset;
  newBlock?: AnyBlock;
  newOffset: Offset;
}
export class BlockReplace extends Command<BlockReplacePayload> {
  execute(): void {
    const { page, block, newBlock, newOffset } = this.payload;
    page.replaceBlock(block.order, newBlock);
    newBlock.setOffset(newOffset);
  }
  undo(): void {
    const { page, block, newBlock, offset } = this.payload;
    page.replaceBlock(newBlock.order, block);
    block.setOffset(offset);
  }
}

export class BlockRemove extends Command<BlockRemovePayload> {
  execute(): void {
    const { page, block } = this.payload;
    this.payload.undo_hint = {
      nextBlock: page.getNextBlock(block),
    };
    page.removeBlock(block.order);
  }
  undo(): void {
    const { page, block, offset } = this.payload;
    if (this.payload.undo_hint!.nextBlock) {
      page.insertBlockBefore(this.payload.undo_hint!.nextBlock.order, block);
    } else {
      page.appendBlock(block);
    }
    block.setOffset(offset);
  }
}

export class BlockActive extends Command<BlockActivePayload> {
  execute(): void {
    const { newBlock, newOffset } = this.payload;
    if (newBlock) {
      newBlock.setOffset(newOffset);
    } else {
      this.payload.newBlock = this.payload.block;
      this.payload.newBlock.setOffset(newOffset);
    }
  }
  undo(): void {
    this.payload.block.setOffset(this.payload.offset)
  }
}

export class BlockCreate extends Command<BlockCreatePayload> {
  execute(): void {
    const { where, page, block, newBlock, offset, newOffset } = this.payload;

    if (where === "after") {
      page.insertBlockAfter(block.order, newBlock);
    } else if (where === "before") {
      page.insertBlockBefore(block.order, newBlock);
    } else if (where === "head") {
      if (page.blocks.first) {
        page.insertBlockBefore(page.blocks.first.name!, newBlock);
      } else {
        page.appendBlock(newBlock);
      }
    } else if (where === "tail") {
      page.appendBlock(newBlock);
    }
    console.log(newBlock);
    const range = offsetToRange(
      newBlock.getContainer(offset.index!),
      newOffset
    )!;
    setRange(range);
    // normalizeRange(range.commonAncestorContainer as Node, range);
  }
  undo(): void {
    const { page, block, newBlock, offset } = this.payload;
    page.removeBlock(newBlock.order);
    console.log(newBlock);
    const range = offsetToRange(block.getContainer(offset.index!), offset)!;
    setRange(range);
  }
}
