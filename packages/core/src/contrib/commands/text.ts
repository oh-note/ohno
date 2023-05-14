import {
  createFlagNode,
  createTextNode,
  innerHTMLToNodeList,
} from "@ohno-editor/core/helper/document";
import {
  ElementFilter,
  ValidNode,
  calcDepths,
  mergeAroundLeft,
  mergeAroundRight,
} from "@ohno-editor/core/helper/element";
import { addMarkdownHint } from "@ohno-editor/core/helper/markdown";
import { AnyBlock } from "@ohno-editor/core/system/block";
import {
  Command,
  CommandCallback,
  CommandCallbackWithBuffer,
} from "@ohno-editor/core/system/history";
import { Page } from "@ohno-editor/core/system/page";
import { BlockUpdateEvent } from "@ohno-editor/core/system/pageevent";
import { getTokenSize } from "@ohno-editor/core/system/position";
import {
  createRange,
  getValidAdjacent,
  nodesOfRange,
  setLocation,
  setRange,
} from "@ohno-editor/core/system/range";

export interface TextInsertPayload {
  page: Page;
  block: AnyBlock;
  index: number;
  start: number;
  innerHTML: string;
  plain?: boolean;
  token_filter?: ElementFilter;
}

export interface TextDeletePayload {
  page: Page;
  block: AnyBlock;
  index: number;
  start: number;
  token_number: number;
  token_filter?: ElementFilter;
}

export class TextDelete extends Command<TextDeletePayload> {
  declare buffer: {
    innerHTML: string;
  };
  onExecuteFn?: CommandCallback<TextDeletePayload> = ({
    page,
    block,
    index,
    start,
    token_number,
    token_filter,
  }) => {
    page.setLocation(
      block.getLocation(start + token_number, index, token_filter)!,
      block
    );
  };
  onUndoFn?: CommandCallback<TextDeletePayload> = ({
    page,
    block,
    index,
    start,
    token_filter,
  }) => {
    page.setLocation(block.getLocation(start, index, token_filter)!, block);
  };
  execute(): void {
    const { block, index, start, token_number, token_filter } = this.payload;
    const startLoc = block.getLocation(start, index, token_filter)!;
    const endLoc = block.getLocation(
      start + token_number,
      index,
      token_filter
    )!;
    const range =
      token_number > 0
        ? createRange(...startLoc, ...endLoc)
        : createRange(...endLoc, ...startLoc);

    this.buffer = {
      innerHTML: range.cloneContents().textContent || "",
    };
    range.deleteContents();
  }
  undo(): void {
    const { start, index, block, token_number, token_filter } = this.payload;

    const tgt = block.getLocation(
      token_number > 0 ? start : start + token_number,
      index,
      token_filter
    )!;

    const range = createRange(...tgt);
    const node = createTextNode(this.buffer.innerHTML);
    range.insertNode(node);
  }

  tryMerge(command: Command<any>): boolean {
    if (!(command instanceof TextDelete)) {
      return false;
    }

    if (this.buffer.innerHTML.indexOf(" ") >= 0) {
      return false;
    }

    if (Math.abs(this.payload.token_number) > 10) {
      return false;
    }

    if (this.payload.token_number * command.payload.token_number < 0) {
      return false;
    }
    if (this.payload.token_number > 0) {
      this.buffer.innerHTML += command.buffer.innerHTML;
    } else {
      this.buffer.innerHTML = command.buffer.innerHTML + this.buffer.innerHTML;
    }

    this.payload.token_number += command.payload.token_number;

    return true;
  }

  notifyExecute(page: Page): void {
    const { block } = this.payload;
    page.dispatchPageEvent(
      new BlockUpdateEvent({ page, block, undo: false, from: "TextDelete" })
    );
  }
  notifyUndo(page: Page): void {
    const { block } = this.payload;
    page.dispatchPageEvent(
      new BlockUpdateEvent({ page, block, undo: true, from: "TextDelete" })
    );
  }
}

/**
 * 在 Editable 内删除一段文本，从 start 开始，删除 token_number 个 token
 * token_number < 0 时，为向前删除，否则向后删除
 */
export class RichTextDelete extends Command<TextDeletePayload> {
  declare buffer: {
    full_html: Node[];
    full_start: number;
    full_end: number;
    trimed_start: number;
    trimed_end: number;
  };
  onExecuteFn?: CommandCallback<TextDeletePayload> = ({
    page,
    block,
    index,
    start,
    token_number,
  }) => {
    page.setLocation(block.getLocation(start, index)!, block);
  };

  onUndoFn?: CommandCallback<TextDeletePayload> = ({
    block,
    index,
    start,
    token_number,
  }) => {
    const startLoc = block.getLocation(start, index)!;
    const endLoc = block.getLocation(start + token_number, index)!;
    setRange(createRange(...startLoc, ...endLoc));
  };

  execute(): void {
    const { block, index: query, start, token_number } = this.payload;
    const startLoc = block.getLocation(start, query)!;
    const endLoc = block.getLocation(start + token_number, query)!;
    const range =
      token_number > 0
        ? createRange(...startLoc, ...endLoc)
        : createRange(...endLoc, ...startLoc);

    const nodes = nodesOfRange(range, false);

    // 计算光标在 range.startContainer 在 nodes[0] 的深度
    // 在 <b>01[23</b>45]6 删除时，计算了 </b>，但实际上 </b> 会在之后被补全，没有实质上的删除
    // 所以需要额外的判断边界的富文本深度
    // 在选中范围中间的不需要，因为是真实删除了
    // 需要判断的只有左右两个边界
    const leftDepth = calcDepths(range.startContainer, nodes[0]);
    const rightDepth = calcDepths(range.endContainer, nodes[nodes.length - 1]);

    const fullStart = block.getBias(getValidAdjacent(nodes[0], "beforebegin"));
    const fullEnd = block.getBias(
      getValidAdjacent(nodes[nodes.length - 1], "afterend")
    );

    this.buffer = {
      full_html: nodes.map((item) => {
        return item.cloneNode(true) as ValidNode;
      }),
      full_start: token_number > 0 ? start : start + token_number,
      full_end: token_number > 0 ? start + token_number : start,
      trimed_start: fullStart,
      trimed_end: fullEnd - Math.abs(token_number) + leftDepth + rightDepth,
    };
    console.log(this.buffer);
    range.deleteContents();
    nodes.forEach((item) => {
      addMarkdownHint(item);
    });
    range.deleteContents();
  }
  undo(): void {
    const { block, index } = this.payload;
    const { trimed_start, trimed_end, full_html, full_start, full_end } =
      this.buffer;
    const trimedRange = createRange(
      ...block.getLocation(trimed_start, index)!,
      ...block.getLocation(trimed_end, index)!
    );
    trimedRange.deleteContents();
    const flag = createFlagNode();
    trimedRange.insertNode(flag);
    flag.replaceWith(...full_html);
    const fullRange = createRange(
      ...block.getLocation(full_start, index)!,
      ...block.getLocation(full_end, index)!
    );
    addMarkdownHint(...nodesOfRange(fullRange));
    // TODO  default set Range
  }

  notifyExecute(page: Page): void {
    const { block } = this.payload;
    page.dispatchPageEvent(
      new BlockUpdateEvent({ page, block, undo: false, from: "RichTextDelete" })
    );
  }
  notifyUndo(page: Page): void {
    const { block } = this.payload;
    page.dispatchPageEvent(
      new BlockUpdateEvent({ page, block, undo: true, from: "RichTextDelete" })
    );
  }
}

export class TextInsert extends Command<TextInsertPayload> {
  onExecuteFn: CommandCallbackWithBuffer<
    TextInsertPayload,
    TextInsert["buffer"]
  > = ({ page, block, index: query, token_filter }, { token_number, bias }) => {
    const loc = block.getLocation(bias + token_number, query, token_filter)!;
    // afterOffset = block.correctOffset(afterOffset);
    page.setLocation(loc, block);
  };
  onUndoFn: CommandCallbackWithBuffer<TextInsertPayload, TextInsert["buffer"]> =
    ({ page, block, index: query, start: bias, token_filter }) => {
      const loc = block.getLocation(bias, query, token_filter)!;
      page.setLocation(loc, block);
    };

  declare buffer: {
    bias: number;
    token_number: number;
  };

  constructor(p: TextInsertPayload) {
    super(p);
    const {
      block,
      plain,
      index: query,
      start: bias,
      token_filter,
    } = this.payload;
    const loc = block.getLocation(bias, query, token_filter)!;
    const posBias = bias < 0 ? block.getBias(loc, token_filter) : bias;
    const nodes = innerHTMLToNodeList(
      this.payload.innerHTML,
      plain
    ) as ValidNode[];
    addMarkdownHint(...nodes);
    const token_number = getTokenSize(nodes, undefined, token_filter);
    this.buffer = {
      bias: posBias,
      token_number: token_number,
    };
  }

  execute(): void {
    const {
      block,
      plain,
      index: query,
      start: bias,
      token_filter,
    } = this.payload;

    const loc = block.getLocation(bias, query, token_filter)!;
    const range = createRange(...loc);
    const nodes = innerHTMLToNodeList(
      this.payload.innerHTML,
      plain
    ) as ValidNode[];
    addMarkdownHint(...nodes);

    const node = createFlagNode();
    range.insertNode(node);
    node.replaceWith(...nodes);

    mergeAroundLeft(nodes[0]);
    mergeAroundRight(nodes[nodes.length - 1]);
  }

  undo(): void {
    const { block, index: query, token_filter } = this.payload;

    const startLoc = block.getLocation(this.buffer.bias, query, token_filter)!;
    const endLoc = block.getLocation(
      this.buffer.bias + this.buffer.token_number,
      query,
      token_filter
    )!;

    const range = createRange(...startLoc, ...endLoc);
    range.deleteContents();
  }

  public get label(): string {
    return `insert ${this.payload.innerHTML}`;
  }

  notifyExecute(page: Page): void {
    const { block } = this.payload;
    page.dispatchPageEvent(
      new BlockUpdateEvent({ page, block, undo: false, from: "TextInsert" })
    );
  }
  notifyUndo(page: Page): void {
    const { block } = this.payload;
    page.dispatchPageEvent(
      new BlockUpdateEvent({ page, block, undo: true, from: "TextInsert" })
    );
  }
}
