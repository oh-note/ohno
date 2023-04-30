import { ValidNode, mergeAroundLeft, mergeAroundRight } from "@/helper/element";
import { addMarkdownHint } from "@/helper/markdown";
import { AnyBlock } from "@/system/block";
import { Command } from "@/system/history";
import { Page } from "@/system/page";
import { Offset, getTokenSize, offsetToRange } from "@/system/position";

export interface InsertNodePayload {
  block: AnyBlock;
  page: Page;
  insertOffset: Offset;
  node: ValidNode;
}
export class NodeInsert extends Command<InsertNodePayload> {
  declare buffer: {
    token_number: number;
  };
  execute(): void {
    const { block, node } = this.payload;

    let { insertOffset } = this.payload;
    const container = block.getContainer(insertOffset.index);
    const range = offsetToRange(container, insertOffset)!;
    insertOffset = block.correctOffset(insertOffset);
    this.payload.insertOffset = insertOffset;

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
    const { block, insertOffset } = this.payload;
    // this.ensureBuffer();
    const deleteOffset = {
      ...insertOffset,
      end: insertOffset.start + this.buffer.token_number,
    };

    const container = block.getContainer(insertOffset.index);
    const range = offsetToRange(container, deleteOffset)!;
    range.deleteContents();
  }
}
