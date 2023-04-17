import {
  Offset,
  elementOffset,
  getTokenSize,
  offsetToRange,
} from "@system/position";
import { AnyBlock } from "@system/block";
import { Command, Payload } from "@system/history";
import { Page } from "@system/page";
import { nodesOfRange, setRange } from "@system/range";
import { addMarkdownHint } from "@helper/markdown";
import { ValidNode, calcDepths } from "@helper/element";
import {
  createElement,
  createFlagNode,
  createTextNode,
  innerHTMLToNodeList,
} from "@helper/document";

export interface TextInsertPayload {
  page: Page;
  block: AnyBlock;
  insertOffset: Offset;
  afterOffset?: Offset;
  innerHTML: string;
  intime?: {
    range: Range;
  };
  undo_hint?: {
    token_number: number;
  };
}

export interface TextDeletePayload {
  page: Page;
  block: AnyBlock;
  offset: Offset;
  innerHTML: string;
  intime?: {
    range: Range;
  };
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

export class TextInsert extends Command<TextInsertPayload> {
  execute(): void {
    let range: Range;

    let { insertOffset, block, afterOffset } = this.payload;
    range = offsetToRange(
      block.getContainer(insertOffset.index!),
      insertOffset
    )!;
    insertOffset = block.correctOffset(insertOffset);
    this.payload.insertOffset = insertOffset;
    // block.correctOffset()
    // 将 Offset 转换为正值的责任在 Command 而不是 handler
    // handler 调用时不需要考虑 -1 标识位置导致的 bug
    // 但是 block 可以提供默认行为来帮助 offset 的位置正确

    const nodes = innerHTMLToNodeList(this.payload.innerHTML) as ValidNode[];
    addMarkdownHint(...nodes);
    const token_number = getTokenSize(nodes);
    if (!this.payload.undo_hint) {
      this.payload.undo_hint = { token_number: token_number };
    }

    if (!afterOffset) {
      afterOffset = {
        ...insertOffset,
        start: token_number + insertOffset.start,
      };
    }
    afterOffset = block.correctOffset(afterOffset);
    this.payload.afterOffset = afterOffset;

    const node = createFlagNode();
    range.insertNode(node);
    node.replaceWith(...nodes);

    block.setOffset(afterOffset);
  }
  undo(): void {
    const { block, insertOffset } = this.payload;
    const deleteOffset = {
      ...insertOffset,
      end: insertOffset.start + this.payload.undo_hint!.token_number,
    };

    const range = offsetToRange(
      block.getContainer(deleteOffset.index!),
      deleteOffset
    )!;
    range.deleteContents();
    block.setOffset(insertOffset);
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
        command.payload.insertOffset.start
    ) {
      this.payload.innerHTML += command.payload.innerHTML;

      this.payload.undo_hint = {
        token_number:
          this.payload.undo_hint!.token_number +
          command.payload.undo_hint!.token_number,
      };
      return true;
    }
    return false;
  }
}

export class TextDeleteBackward extends Command<TextDeletePayload> {
  execute(): void {
    // TODO apply intime
    const block = this.payload.block;
    const offset = Object.assign({}, this.payload.offset);
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
    range.setStartAfter(node);
    range.setEndAfter(node);
    setRange(range);
  }
  public get label(): string {
    return `delete ${this.payload.innerHTML}`;
  }

  tryMerge(command: TextDeleteBackward): boolean {
    if (!(command instanceof TextDeleteBackward)) {
      return false;
    }
    if (command.payload.innerHTML.indexOf(" ") >= 0) {
      return false;
    }
    // 更早的左删除命令在的 offset 在右侧
    if (
      command.payload.block.equals(this.payload.block) &&
      command.payload.offset.start + command.payload.innerHTML.length ===
        this.payload.offset.start
    ) {
      this.payload.offset = command.payload.offset;
      this.payload.innerHTML =
        command.payload.innerHTML + this.payload.innerHTML;
      return true;
    }
    return false;
  }
}

export class TextDeleteSelection extends Command<TextDeleteSelectionPayload> {
  execute(): void {
    let { block, page, delOffset, afterOffset } = this.payload;
    const range = offsetToRange(
      block.getContainer(delOffset.index!),
      delOffset
    )!;
    if (!this.payload.beforeOffset) {
      this.payload.beforeOffset = delOffset;
    }
    if (!afterOffset) {
      this.payload.afterOffset = { ...delOffset, end: undefined };
      afterOffset = this.payload.afterOffset;
    }

    const selectedTokenN = delOffset.end! - delOffset.start;

    const container = block.currentContainer();
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
    this.payload.undo_hint = {
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

    const afterRange = offsetToRange(
      block.getContainer(afterOffset.index),
      afterOffset
    )!;
    block.setRange(afterRange);
  }
  undo(): void {
    const { undo_hint, block, delOffset, beforeOffset } = this.payload;
    // 删掉原来的 common 部分
    const range = offsetToRange(
      block.getContainer(delOffset.index),
      undo_hint!.trim_offset
    )!;
    range.deleteContents();

    const flag = createElement("span");
    range.insertNode(flag);
    flag.replaceWith(...undo_hint!.full_html);
    if (beforeOffset) {
      const beforeRange = offsetToRange(
        block.getContainer(beforeOffset.index),
        beforeOffset
      )!;
      block.setRange(beforeRange);
    }
    const fullRange = offsetToRange(
      block.getContainer(beforeOffset?.index),
      undo_hint!.full_offset
    )!;
    addMarkdownHint(...nodesOfRange(fullRange));
  }
}

export class TextDeleteForward extends Command<TextDeletePayload> {
  execute(): void {
    // TODO apply intime
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
