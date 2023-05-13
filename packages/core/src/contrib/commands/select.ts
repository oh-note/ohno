// 提供几个级别的 selection
import { EditableInterval } from "@/system/base";
import { AnyBlock } from "@/system/block";
import { Command, CommandBuffer, CommandCallback } from "@/system/history";
import { Page } from "@/system/page";
import { Offset } from "@/system/position";
import { setRange } from "@/system/range";

export interface GlobalRangePayload {
  page: Page;
  startBlock: AnyBlock;
  startOffset: Offset;
  endBlock: AnyBlock;
  endOffset: Offset;
}

export interface BlockActivePayload {
  page: Page;
  block: AnyBlock;
  offset: Offset;
  newBlock?: AnyBlock;
  newOffset: Offset;
}

export class Empty<T> extends Command<T> {
  execute(): void {}
  undo(): void {}
}

export interface LocationPayload {
  block?: AnyBlock;
  offset?: EditableInterval;
  newBlock?: AnyBlock;
  newOffset?: EditableInterval;
}

export class SetLocation extends Command<LocationPayload> {
  onExecuteFn?: CommandCallback<LocationPayload> = ({
    newBlock,
    newOffset,
  }) => {
    if (newBlock && newOffset) {
      setRange(newBlock.getEditableRange(newOffset)!);
    }
  };
  onUndoFn?: CommandCallback<LocationPayload> = ({ block, offset }) => {
    if (block && offset) {
      setRange(block.getEditableRange(offset)!);
    }
  };
  execute(): void {}
  undo(): void {}
}

export class SetBlockRange extends Command<BlockActivePayload> {
  execute(): void {
    const { newBlock, newOffset } = this.payload;
    // debugger;
    if (newBlock) {
      newBlock.setOffset(newOffset);
    } else {
      this.payload.newBlock = this.payload.block;
      this.payload.newBlock.setOffset(newOffset);
    }
  }
  undo(): void {
    this.payload.block.setOffset(this.payload.offset);
  }
}
export class SetGlobalRange extends Command<GlobalRangePayload> {
  declare buffer: {
    startBlock: AnyBlock;
    startBias: number;
    endBlock: AnyBlock;
    endBias: number;
  };
  execute(): void {
    const { page, startBlock, startOffset, endOffset, endBlock } = this.payload;
    const startRange = startBlock.getRangeLegend(startOffset)!;
    const endRange = endBlock.getRangeLegend(endOffset)!;
    startRange.setEnd(endRange.startContainer, endRange.startOffset);
    setRange(startRange);
  }
  undo(): void {}
}
