import { createFlagNode, innerHTMLToNodeList } from "@/helper/document";
import { ValidNode, mergeAroundLeft, mergeAroundRight } from "@/helper/element";
import { addMarkdownHint } from "@/helper/markdown";
import { AnyBlock } from "@/system/block";
import {
  Command,
  CommandBuffer,
  CommandCallback,
  CommandCallbackWithBuffer,
} from "@/system/history";
import { Page } from "@/system/page";
import { Offset, getTokenSize, offsetToRange } from "@/system/position";

export interface TextInsertPayload {
  page: Page;
  block: AnyBlock;
  insertOffset: Offset;
  innerHTML: string;
  plain?: boolean;
}

export interface TextInsertBuffer extends CommandBuffer {
  token_number: number;
}

export class TextInsert extends Command<TextInsertPayload> {
  onExecuteFn: CommandCallbackWithBuffer<TextInsertPayload, TextInsertBuffer> =
    ({ block, insertOffset }, { token_number }) => {
      let afterOffset = {
        ...insertOffset,
        start: token_number + insertOffset.start,
      };
      afterOffset = block.correctOffset(afterOffset);
      block.setOffset(afterOffset);
    };
  onUndoFn: CommandCallbackWithBuffer<TextInsertPayload, TextInsertBuffer> = ({
    block,
    insertOffset,
  }) => {
    block.setOffset(insertOffset);
  };

  declare buffer: {
    token_number: number;
  };
  execute(): void {
    const { block, plain } = this.payload;
    let { insertOffset } = this.payload;
    const container = block.getContainer(insertOffset.index);
    const range = offsetToRange(container, insertOffset)!;
    insertOffset = block.correctOffset(insertOffset);
    this.payload.insertOffset = insertOffset;

    const nodes = innerHTMLToNodeList(
      this.payload.innerHTML,
      plain
    ) as ValidNode[];
    addMarkdownHint(...nodes);
    const token_number = getTokenSize(nodes);

    const node = createFlagNode();
    range.insertNode(node);
    node.replaceWith(...nodes);

    mergeAroundLeft(nodes[0]);
    mergeAroundRight(nodes[nodes.length - 1]);
    this.buffer = {
      token_number: token_number,
    };
  }
  ensureBuffer() {
    if (!this.buffer.token_number) {
      const nodes = innerHTMLToNodeList(
        this.payload.innerHTML,
        this.payload.plain
      ) as ValidNode[];
      addMarkdownHint(...nodes);
      this.buffer.token_number = getTokenSize(nodes);
    }
  }

  undo(): void {
    const { block, insertOffset } = this.payload;
    this.ensureBuffer();
    const deleteOffset = {
      ...insertOffset,
      end: insertOffset.start + this.buffer.token_number,
    };

    const container = block.getContainer(insertOffset.index);
    const range = offsetToRange(container, deleteOffset)!;
    range.deleteContents();
  }

  public get label(): string {
    return `insert ${this.payload.innerHTML}`;
  }

  tryMerge(command: TextInsert): boolean {
    if (!(command instanceof TextInsert)) {
      return false;
    }
    if (command.payload.innerHTML.indexOf(" ") >= 0) {
      return false;
    }
    if (
      command.payload.block.equals(this.payload.block) &&
      this.payload.insertOffset.start + this.payload.innerHTML.length ===
        command.payload.insertOffset.start &&
      this.buffer.token_number < 10 // 不要过长，防止太多内容不好分割
    ) {
      this.payload.innerHTML += command.payload.innerHTML;

      this.buffer = {
        token_number: this.buffer.token_number + command.buffer.token_number,
      };
      return true;
    }
    return false;
  }
}
