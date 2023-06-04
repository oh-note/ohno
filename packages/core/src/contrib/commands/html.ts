import {
  ValidNode,
  mergeAroundLeft,
  mergeAroundRight,
} from "@ohno-editor/core/helper/element";
import { addMarkdownHint } from "@ohno-editor/core/helper/markdown";
import { AnyBlock } from "@ohno-editor/core/system/block";
import { Command } from "@ohno-editor/core/system/history";
import { Page } from "@ohno-editor/core/system/page";
import { getTokenSize } from "@ohno-editor/core/system/position";
import { createRange } from "@ohno-editor/core/system/range";

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
    current: ValidNode;
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
      current: node,
      token_number: token_number,
    };
  }
  undo(): void {
    const { block, start, index } = this.payload;
    const loc = block.getLocation(start + 1, index)![0] as HTMLLabelElement;
    loc.remove();
  }
}
