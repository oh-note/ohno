// 提供几个级别的 selection
import { EditableInterval } from "@ohno-editor/core/system/base";
import { AnyBlock } from "@ohno-editor/core/system/block";
import {
  Command,
  CommandBuffer,
  CommandCallback,
} from "@ohno-editor/core/system/history";
import { Page } from "@ohno-editor/core/system/page";
import { Offset } from "@ohno-editor/core/system/position";
import { setRange } from "@ohno-editor/core/system/range";

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
  page: Page;
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
