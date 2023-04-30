import { EventContext, Handler } from "@/system/handler";
import {
  TextDeleteSelection,
  TextDeleteBackward,
  TextDeleteForward,
} from "@/contrib/commands/text";
import { FormatText } from "@/contrib/commands/format";
import { HTMLElementTagName, getDefaultRange } from "@/helper/document";
import {
  createRange,
  getPrevRange,
  normalizeRange,
  tryGetBoundsRichNode,
  validateLocation,
  validateRange,
} from "@/system/range";
import { getTagName, parentElementWithTag } from "@/helper/element";
import { IBlockRemove } from "@/contrib/commands/inlineblock";

import {
  FIRST_POSITION,
  LAST_POSITION,
  elementOffset,
  rangeToOffset,
} from "@/system/position";
import { TextInsert } from "@/contrib/commands";
import { ListCommandBuilder } from "@/contrib/commands/concat";

export function defaultHandleBeforeInput(
  handler: Handler,
  e: TypedInputEvent,
  context: EventContext
): boolean | void {
  const { page, block, range } = context;
  e.preventDefault();
  e.stopPropagation();
  if (!range) {
    throw new NoRangeError();
  }
  // multiblock 的情况不会到这里
  validateRange(range);

  let command;
  const offset = block.getOffset(range);
  if (e.inputType === "insertText") {
    if (range.startContainer instanceof HTMLLabelElement) {
      offset.start++;
    }
    if (range.collapsed) {
      command = new TextInsert({
        page: page,
        block: block,
        insertOffset: offset,
        innerHTML: e.data as string,
      });
    } else {
      command = new ListCommandBuilder(context)
        .withLazyCommand(() => {
          return new TextDeleteSelection({
            delOffset: offset,
            page,
            block,
          });
        })
        .withLazyCommand(() => {
          return new TextInsert({
            page: page,
            block: block,
            insertOffset: { ...offset, end: undefined },
            innerHTML: e.data as string,
          });
        })
        .build();
      // 先删除选中内容
    }
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
    return false;
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
    });
  } else if (
    e.inputType === "deleteContentBackward" ||
    e.inputType === "deleteWordBackward"
  ) {
    let hint;

    // TODO 讨论在 label 边界出的删除行为应该是首次选中还是直接删除
    // if (range.startContainer instanceof HTMLLabelElement) {
    //   const offset = block.getOffset();
    //   command = new IBlockRemove({
    //     page,
    //     block,
    //     label: range.startContainer,
    //   })
    //     .onExecute(() => {
    //       block.setOffset({ ...offset, start: offset.start - 1 });
    //     })
    //     .onUndo(() => {
    //       block.setOffset(offset);
    //     });
    // } else
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
          })
          .onUndo(() => {
            block.setOffset(offset);
          });
      } else {
        command = new FormatText({
          block,
          page,
          format,
          offset: {
            ...elementOffset(block.currentContainer(), hint),
            index: offset.index,
          },
        });
      }
    } else {
      const prev =
        e.inputType === "deleteWordBackward"
          ? block.getPrevWordLocation(range.startContainer, range.startOffset)!
          : block.getPrevLocation(range.startContainer, range.startOffset)!;

      const prevRange = createRange(
        ...prev,
        range.startContainer,
        range.startOffset
      );
      const start = block.getLocalBias(...prev);
      const end = block.getLocalBias(range.startContainer, range.startOffset);
      const index = block.getIndexOfContainer(
        block.findContainer(range.startContainer)!
      );
      // const { start, end, index } = block.getOffset(prevRange);
      // prev.setEnd(range.startContainer, range.startOffset);
      command = new TextDeleteBackward({
        page: page,
        block: block,
        // offset: offset,
        start,
        end,
        index,
        // innerHTML: prevRange?.cloneContents().textContent as string,
      });
    }
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
        offset: offset,
        innerHTML: next?.cloneContents().textContent as string,
        intime: { range: range },
      }).onExecute(({ block, offset }) => {
        block.setOffset({ ...offset, end: undefined });
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
