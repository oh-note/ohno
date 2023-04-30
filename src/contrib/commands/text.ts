import {
  Offset,
  elementOffset,
  getTokenSize,
  offsetToRange,
} from "@/system/position";
import { AnyBlock } from "@/system/block";
import {
  Command,
  CommandBuffer,
  CommandCallback,
  Payload,
} from "@/system/history";
import { Page } from "@/system/page";
import { createRange, nodesOfRange, setRange } from "@/system/range";
import { addMarkdownHint } from "@/helper/markdown";
import { ValidNode, calcDepths } from "@/helper/element";
import {
  createElement,
  createFlagNode,
  createTextNode,
  innerHTMLToNodeList,
} from "@/helper/document";

export interface TextDeletePayload {
  page: Page;
  block: AnyBlock;
  // offset: Offset;

  index: number;
  start: number;
  end: number;

  // innerHTML: string;
  // intime?: {
  //   range: Range;
  // };
  undo_hint?: {
    token_number: number;
  };
}

export interface TextDeleteSelectionPayload extends Payload {
  page: Page;
  block: AnyBlock;
  beforeOffset?: Offset; // 删除前的位置，不指定，默认为选中所有 delOffset 的范围
  afterOffset?: Offset; // 删除后的位置，不指定，默认为 delOffset 删除后的范围
  delOffset: Offset;
  undo_hint?: {
    full_html: ValidNode[];
    trim_offset: Offset;
    full_offset: Offset;
  };
  intime?: {
    range: Range;
  };
}

export function makeNode({
  textContent,
  innerHTML,
}: {
  textContent?: string;
  innerHTML?: string;
}): ValidNode[] {
  if (textContent !== undefined && innerHTML !== undefined) {
    throw new Error("textContent and innerHTML can only have one");
  }
  if (innerHTML !== undefined) {
    return innerHTMLToNodeList(innerHTML) as ValidNode[];
  }
  return [createTextNode(textContent)];
}

export class TextDeleteBackward extends Command<TextDeletePayload> {
  declare buffer: {
    innerHTML: string;
  };
  execute(): void {
    const block = this.payload.block;
    const { start, end, index } = this.payload;
    const offset = { start, end, index };
    const range = offsetToRange(block.getContainer(offset.index!), offset)!;
    this.buffer = {
      innerHTML: range.cloneContents().textContent || "",
    };
    range.deleteContents();
    setRange(range);
  }
  undo(): void {
    // let range: Range;
    const { start, index, block } = this.payload;
    const tgt = block.getLocation(start, { index })!;
    const range = createRange(...tgt);
    const node = createTextNode(this.buffer.innerHTML);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    setRange(range);
  }
  public get label(): string {
    return `delete ${this.buffer.innerHTML}`;
  }

  tryMerge(command: TextDeleteBackward): boolean {
    if (!(command instanceof TextDeleteBackward)) {
      return false;
    }
    if (command.buffer.innerHTML.indexOf(" ") >= 0) {
      return false;
    }
    // 更早的左删除命令在的 offset 在右侧
    if (
      command.payload.block.equals(this.payload.block) &&
      command.payload.start + command.buffer.innerHTML.length ===
        this.payload.start
    ) {
      this.payload.start = command.payload.start;
      this.payload.end = command.payload.end;
      this.buffer.innerHTML = command.buffer.innerHTML + this.buffer.innerHTML;
      return true;
    }
    return false;
  }
}

export class TextDeleteSelection extends Command<TextDeleteSelectionPayload> {
  declare buffer: {
    full_html: ValidNode[];
    trim_offset: Offset;
    full_offset: Offset;
  };

  onExecuteFn?: CommandCallback<TextDeleteSelectionPayload> = ({
    block,
    delOffset,
  }) => {
    this.buffer.full_offset;
    block.setOffset({ ...delOffset, end: undefined });
  };
  onUndoFn?: CommandCallback<TextDeleteSelectionPayload> = ({
    block,
    delOffset,
  }) => {
    block.setOffset(delOffset);
  };

  execute(): void {
    let { block, page, delOffset } = this.payload;
    const container = block.getContainer(delOffset.index);
    const range = offsetToRange(container, delOffset)!;
    if (!this.payload.beforeOffset) {
      this.payload.beforeOffset = delOffset;
    }
    // if (!afterOffset) {
    //   this.payload.afterOffset = { ...delOffset, end: undefined };
    //   afterOffset = this.payload.afterOffset;
    // }

    const selectedTokenN = delOffset.end! - delOffset.start;
    const nodes = nodesOfRange(range, false);

    // 计算光标在 range.startContainer 在 nodes[0] 的深度
    // 在 <b>01[23</b>45]6 删除时，计算了 </b>，但实际上 </b> 会在之后被补全，没有实质上的删除
    // 所以需要额外的判断边界的富文本深度
    // 在选中范围中间的不需要，因为是真实删除了
    // 需要判断的只有左右两个边界
    const leftDepth = calcDepths(range.startContainer, nodes[0]);
    const rightDepth = calcDepths(range.endContainer, nodes[nodes.length - 1]);

    const fullOffset = elementOffset(
      container,
      nodes[0],
      nodes[nodes.length - 1]
    );
    this.buffer = {
      full_html: nodes.map((item) => {
        return item.cloneNode(true) as ValidNode;
      }),
      full_offset: {
        start: fullOffset.start,
        end: fullOffset.end,
      },
      trim_offset: {
        start: fullOffset.start,
        end: fullOffset.end! - selectedTokenN + leftDepth + rightDepth,
      },
    };
    range.deleteContents();
    nodes.forEach((item) => {
      addMarkdownHint(item);
    });
  }
  undo(): void {
    const { block, delOffset, beforeOffset } = this.payload;
    const buffer = this.buffer;
    // 删掉原来的 common 部分
    console.log(delOffset);
    const range = offsetToRange(
      block.getContainer(delOffset.index),
      buffer.trim_offset
    )!;
    range.deleteContents();
    const flag = createElement("span");
    range.insertNode(flag);
    flag.replaceWith(...buffer.full_html);

    const fullRange = offsetToRange(
      block.getContainer(beforeOffset?.index),
      buffer.full_offset
    )!;
    addMarkdownHint(...nodesOfRange(fullRange));

    if (beforeOffset) {
      const beforeRange = offsetToRange(
        block.getContainer(beforeOffset.index),
        beforeOffset
      )!;
      block.setRange(beforeRange);
    }
  }
}

export class TextDeleteForward extends Command<TextDeletePayload> {
  execute(): void {
    const block = this.payload.block;
    const offset = this.payload.offset;
    offset.end = offset.start + this.payload.innerHTML.length;
    const range = offsetToRange(block.getContainer(offset.index!), offset)!;
    range.deleteContents();
    setRange(range);
  }
  undo(): void {
    let range: Range;
    const block = this.payload.block;
    const offset = this.payload.offset;
    range = offsetToRange(block.getContainer(offset.index!), offset)!;
    const node = createTextNode(this.payload.innerHTML);
    range.insertNode(node);
    range.setStartBefore(node);
    range.setEndBefore(node);
    setRange(range);
  }
  public get label(): string {
    return `delete ${this.payload.innerHTML}`;
  }

  tryMerge(command: TextDeleteForward): boolean {
    if (!(command instanceof TextDeleteForward)) {
      return false;
    }
    if (command.payload.innerHTML.indexOf(" ") >= 0) {
      return false;
    }
    // 更早的右删除命令在的 offset 在左侧
    if (
      command.payload.block.equals(this.payload.block) &&
      command.payload.offset.start === this.payload.offset.start
    ) {
      // this.payload.offset.end = command.payload.offset.end;
      this.payload.innerHTML += command.payload.innerHTML;
      return true;
    }
    return false;
  }
}
