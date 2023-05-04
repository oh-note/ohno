import { ValidNode, mergeAroundLeft, mergeAroundRight } from "@/helper/element";
import { addMarkdownHint } from "@/helper/markdown";
import { AnyBlock } from "@/system/block";
import { Command } from "@/system/history";
import { Page } from "@/system/page";
import { Offset, getTokenSize, intervalToRange } from "@/system/position";
import { createRange } from "@/system/range";

export interface InsertNodePayload {
  block: AnyBlock;
  page: Page;
  start: number;
  index: number;
  node: ValidNode;
}
export class NodeInsert extends Command<InsertNodePayload> {
  declare buffer: {
    token_number: number;
  };
  execute(): void {
    const { block, node, start, index } = this.payload;

    // let { insertOffset } = this.payload;
    // const container = block.getEditable(index);
    const range = createRange(...block.getLocation(start, index)!);
    // insertOffset = block.correctOffset(insertOffset);
    // this.payload.insertOffset = insertOffset;

    addMarkdownHint(node);
    const token_number = getTokenSize(node, true);

    // const node = createFlagNode();
    range.insertNode(node);

    mergeAroundLeft(node);
    mergeAroundRight(node);
    this.buffer = {
      token_number: token_number,
    };
  }
  undo(): void {
    const { block, start, index } = this.payload;
    const range = block.getRange(
      { start: start, end: start + this.buffer.token_number },
      index
    )!;
    range.deleteContents();
  }
}
