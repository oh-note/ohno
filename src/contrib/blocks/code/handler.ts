import { HTMLElementTagName } from "@/helper/document";
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  RangedEventContext,
  dispatchKeyDown,
} from "@/system/handler";
import {
  elementOffset,
  getTokenSize,
  locationToBias,
  offsetToRange,
  rangeToOffset,
} from "@/system/position";
import { BlocksRemove } from "@/contrib/commands/block";
import { ValidNode, getTagName, outerHTML } from "@/helper/element";
import { ListCommandBuilder } from "@/contrib/commands/concat";
import {
  TextDeleteBackward,
  TextDeleteForward,
  TextDeleteSelection,
} from "@/contrib/commands/text";
import { Code } from "./block";
import { AnyBlock } from "@/system/block";
import { tryGetBoundsRichNode, validateRange } from "@/system/range";
import { TextInsert } from "@/contrib/commands";
import { FormatText } from "@/contrib/commands/format";
import { IBlockRemove } from "@/contrib/commands/inlineblock";

export interface DeleteContext extends EventContext {
  nextBlock: AnyBlock;
}

export function defaultHandleBeforeInput(
  handler: Handler,
  e: TypedInputEvent,
  { page, block, range }: EventContext
): boolean | void {
  e.preventDefault();
  e.stopPropagation();
  if (!range) {
    throw new NoRangeError();
  }

  validateRange(range);

  let command;
  if (e.inputType === "insertText") {
    const offset = block.getOffset(range);
    if (range.startContainer instanceof HTMLLabelElement) {
      offset.start++;
    }
    command = new TextInsert({
      page: page,
      block: block,
      insertOffset: offset,
      innerHTML: e.data as string,
    })
      .onExecute(({ block, insertOffset }) => {
        block.setOffset({ ...insertOffset, start: insertOffset.start + 1 });
        (block as Code).updateRender();
      })
      .onUndo(({ block, insertOffset }) => {
        block.setOffset(insertOffset);
        (block as Code).updateRender();
      });
  } else if (e.inputType === "insertFromPaste") {
    if (e.dataTransfer) {
      let content: string;
      if ((content = e.dataTransfer.getData("text/html"))) {
        console.log(content);
        command = new TextInsert({
          page,
          block,
          insertOffset: block.getOffset(range),
          innerHTML: content,
        });
      } else if ((content = e.dataTransfer.getData("text/plain"))) {
        command = new TextInsert({
          page,
          block,
          insertOffset: block.getOffset(range),
          innerHTML: content,
        });
      } else {
        // eslint-disable-next-line no-debugger
        debugger;
        return true;
      }
    }
  } else if (e.inputType === "insertCompositionText") {
    return true;
  } else if (
    !range.collapsed &&
    (e.inputType === "deleteContentBackward" ||
      e.inputType === "deleteContentForward")
  ) {
    // 所有的 multi block 应该被 multiblock handler 接受
    // 所有的 multi container 应该被 block handler 接受

    const offset = block.getOffset();
    command = new TextDeleteSelection({
      delOffset: offset,
      page,
      block,
    }).onExecute(({ block, delOffset }) => {
      block.setOffset({ ...delOffset, end: undefined });
      (block as Code).updateRender();
    });
  } else if (e.inputType === "deleteContentBackward") {
    let hint;
    if (
      (hint = tryGetBoundsRichNode(
        range.startContainer,
        range.startOffset,
        "left"
      ))
    ) {
      const format = getTagName(hint) as HTMLElementTagName;
      if (format === "label") {
        const offset = block.getOffset();
        command = new IBlockRemove({
          page,
          block,
          label: hint as HTMLLabelElement,
        })
          .onExecute(() => {
            block.setOffset({ ...offset, start: offset.start - 2 });
            (block as Code).updateRender();
          })
          .onUndo(() => {
            block.setOffset(offset);
            (block as Code).updateRender();
          });
      } else {
        command = new FormatText({
          block,
          page,
          format,
          offset: elementOffset(block.currentContainer(), hint),
        });
      }
    } else {
      const prev = block.getPrevRange(range)!;
      prev.setEnd(range.startContainer, range.startOffset);
      const offset = block.getOffset(prev);
      command = new TextDeleteBackward({
        page: page,
        block: block,
        start: offset.start,
        end: offset.end!,
        index: offset.index!,
      })
        .onExecute(() => {
          (block as Code).updateRender();
        })
        .onUndo(() => {
          (block as Code).updateRender();
        });
    }
  } else if (e.inputType === "deleteWordBackward") {
  } else if (e.inputType === "deleteContentForward") {
    // 判断是否是格式字符边界，两种情况：
    // ?|<b>asd</b>
    // <b>asd|</b>?
    console.log("deleteForward");
    let hint;
    if (
      (hint = tryGetBoundsRichNode(
        range.startContainer,
        range.startOffset,
        "right"
      ))
    ) {
      const format = getTagName(hint) as HTMLElementTagName;
      if (format === "label") {
        // Delete 删除不需要改 range，或者为了保证 range 的有效性 set 原来的 offset
        // const offset = block.getOffset();
        command = new IBlockRemove({
          page,
          block,
          label: hint as HTMLLabelElement,
        });
      } else {
        command = new FormatText({
          block,
          page,
          format,
          offset: elementOffset(block.currentContainer(), hint),
        });
      }
    } else {
      const next = block.getNextRange(range)!;
      const offset = block.getOffset(range);
      next.setStart(range.startContainer, range.startOffset);
      command = new TextDeleteForward({
        page: page,
        block: block,
        start: offset.start,
        end: offset.end!,
        index: offset.index!,
      }).onExecute(({ block, start, index }) => {
        block.setOffset({ start, index, end: undefined });
        (block as Code).updateRender();
      });
    }
  } else if (e.inputType === "formatBold" || e.inputType === "formatItalic") {
    command = new FormatText({
      page: page,
      block: block,
      format: e.inputType === "formatBold" ? "b" : "i",
      offset: block.getOffset(range),
    });
  }

  if (command) {
    page.executeCommand(command);
    return true;
  }
}

export function prepareDeleteCommand({
  page,
  block,
  nextBlock,
}: DeleteContext) {
  const builder = new ListCommandBuilder({ page, block, nextBlock })
    .withLazyCommand(({ page, block, nextBlock }, extra, status) => {
      if (nextBlock.root.innerHTML.length > 0) {
        const token_number = getTokenSize(block.root);
        const offset = { index: -1, start: token_number };
        return new TextInsert({
          block: block,
          insertOffset: offset,
          page: page,
          innerHTML: nextBlock.root.innerHTML,
        }).onExecute(({ block, insertOffset }) => {
          block.setOffset(insertOffset);
          (block as Code).updateRender();
        });
      }
      return null;
    })
    .withLazyCommand(() => {
      return new BlocksRemove({ page, blocks: [nextBlock] });
    });
  return builder;
}

export function prepareEnterCommand({ page, block, range }: EventContext) {
  if (!range) {
    throw new NoRangeError();
  }
  const builder = new ListCommandBuilder({ page, block, range })
    .withLazyCommand(({ block, page, range }, _, status) => {
      if (range.collapsed) {
        // 没有选中文本，不需要删除
        return;
      }
      const offset = rangeToOffset(block.root, range);
      return new TextDeleteSelection({
        block: block,
        page: page,
        delOffset: offset,
      }).onUndo(({ block, page, delOffset }) => {
        block.setOffset(delOffset);
        (block as Code).updateRender();
      });
    })
    .withLazyCommand(({ block, page, range }, extra, status) => {
      const bias = locationToBias(
        block.root,
        range.startContainer as ValidNode,
        range.startOffset
      );
      const token_number = getTokenSize(block.root);

      if (block.isRight(range)) {
        // 已经在最右侧了，直接返回并新建 Block
        status.skip();
        extra["innerHTML"] = "";
        extra["offset"] = { start: bias };
        return;
      }
      // 获取光标到右侧的文本，删除并将其作为新建 Block 的参数
      // const offset = rangeToOffset(block.el, range);
      // offset.end = -1;

      const delOffset = {
        start: bias,
        end: token_number,
      };
      const tailSelectedRange = offsetToRange(block.root, delOffset);
      const newContent = tailSelectedRange!.cloneContents();

      extra["innerHTML"] = outerHTML(newContent);
      extra["offset"] = { start: bias };
      return new TextDeleteSelection({
        block: block,
        page: page,
        delOffset,
      }).onUndo(({ block, delOffset }) => {
        block.setOffset({ ...delOffset, end: undefined });
        (block as Code).updateRender();
      });
    });

  return builder;
}

export class CodeHandler extends Handler implements KeyDispatchedHandler {
  name: string = "code";
  handleKeyPress(e: KeyboardEvent, context: EventContext): boolean | void {}
  handleKeyDown(e: KeyboardEvent, context: RangedEventContext): boolean | void {
    return dispatchKeyDown(this, e, context);
  }

  handleMouseDown(e: MouseEvent, context: EventContext): boolean | void {}

  handleDeleteDown(e: KeyboardEvent, context: EventContext): boolean | void {
    // return true;
  }

  handleBackspaceDown(e: KeyboardEvent, context: EventContext): boolean | void {
    const { page, block, range } = context;
    if (!range) {
      throw new NoRangeError();
    }
    if (block.isLeft(range)) {
      return true;
    }
  }
  handleTabDown(e: KeyboardEvent, context: EventContext): boolean | void {
    const { page, block, range } = context;
    const offset = block.getOffset(range);
    const command = new TextInsert({
      page,
      block,
      innerHTML: "\t",
      plain: true,
      insertOffset: offset,
    })
      .onExecute(({ block, insertOffset }) => {
        block.setOffset({ ...insertOffset, start: insertOffset.start + 1 });
        (block as Code).updateRender();
      })
      .onUndo(({ block, insertOffset }) => {
        block.setOffset(insertOffset);
        (block as Code).updateRender();
      });
    page.executeCommand(command);
    return true;
  }
  handleEnterDown(e: KeyboardEvent, context: EventContext): boolean | void {
    e.stopPropagation();
    e.preventDefault();

    const { page, block, range } = context;
    if (!range) {
      throw new NoRangeError();
    }

    const offset = block.getOffset(range);
    const command = new TextInsert({
      page,
      block,
      innerHTML: block.isRight(range) ? "\n " : "\n",
      plain: true,
      insertOffset: offset,
    })
      .onExecute(({ block, insertOffset }) => {
        block.setOffset({ ...insertOffset, start: insertOffset.start + 1 });
        (block as Code).updateRender();
      })
      .onUndo(({ block, insertOffset }) => {
        block.setOffset(insertOffset);
        (block as Code).updateRender();
      });
    page.executeCommand(command);
    return true;
  }
  handleSpaceDown(e: KeyboardEvent, context: EventContext): boolean | void {}

  handleBeforeInput(e: TypedInputEvent, context: EventContext): boolean | void {
    if (
      e.inputType === "insertText" ||
      e.inputType === "deleteContentBackward" ||
      e.inputType === "deleteContentForward"
    ) {
      defaultHandleBeforeInput(this, e, context);

      return true;
    }
    return true;
  }
}
