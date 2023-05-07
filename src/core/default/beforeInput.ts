import {
  EventContext,
  Handler,
  HandlerMethod,
  HandlerMethods,
} from "@/system/handler";

import { FormatText } from "@/contrib/commands/format";
import { HTMLElementTagName } from "@/helper/document";
import {
  createRange,
  setLocation,
  tryGetBoundsRichNode,
  validateRange,
} from "@/system/range";
import { ElementFilter, getTagName } from "@/helper/element";
import { IBlockRemove } from "@/contrib/commands/inlineblock";

import { elementOffset, tokenBetweenRange } from "@/system/position";
import { ListCommandBuilder } from "@/contrib/commands/concat";
import {
  RichTextDelete,
  TextDelete,
  TextInsert,
} from "@/contrib/commands/text";

export function defaultHandleBeforeInput(
  handler: HandlerMethods,
  e: TypedInputEvent,
  context: EventContext,
  token_filter?: ElementFilter
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
  const editable = block.findEditable(range.startContainer)!;
  const index = block.getEditableIndex(editable);
  let start = block.getBias(
    [range.startContainer, range.startOffset],
    token_filter
  );
  if (e.inputType === "insertText") {
    if (range.startContainer instanceof HTMLLabelElement) {
      start++;
    }
    if (range.collapsed) {
      command = new TextInsert({
        page,
        block,
        innerHTML: e.data!,
        plain: true,
        start,
        index,
        token_filter,
      });
    } else {
      command = new ListCommandBuilder(context)
        .withLazyCommand(() => {
          const token_number = tokenBetweenRange(range);
          return new RichTextDelete({
            page,
            block,
            start,
            index,
            token_number,
          });
        })
        .withLazyCommand(() => {
          return new TextInsert({
            page,
            block,
            innerHTML: e.data!,
            plain: true,
            start,
            index,
            token_filter,
          });
        })
        .build();
      // 先删除选中内容
    }
  } else if (e.inputType === "insertFromPaste") {
    if (e.dataTransfer) {
      let innerHTML: string;
      if ((innerHTML = e.dataTransfer.getData("text/html"))) {
        console.log(innerHTML);
        command = new TextInsert({
          page,
          block,
          start,
          index,
          innerHTML,
        });
      } else if ((innerHTML = e.dataTransfer.getData("text/plain"))) {
        command = new TextInsert({
          page,
          block,
          innerHTML,
          plain: true,
          start,
          index,
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
    const token_number = tokenBetweenRange(range);
    command = new RichTextDelete({
      page,
      block,
      start,
      index,
      token_number,
    }).onExecute(({ block, start, index }) => {
      setLocation(block.getLocation(start, index)!);
    });
  } else if (
    e.inputType === "deleteContentBackward" ||
    e.inputType === "deleteWordBackward"
  ) {
    let hint;
    // TODO 讨论在 label 边界出的删除行为应该是首次选中还是直接删除
    if (
      (hint = tryGetBoundsRichNode(
        range.startContainer,
        range.startOffset,
        "left"
      ))
    ) {
      const format = getTagName(hint) as HTMLElementTagName;
      if (format === "label") {
        command = new IBlockRemove({
          page,
          block,
          label: hint as HTMLLabelElement,
        })
          .onExecute(() => {
            setLocation(block.getLocation(start - 2, editable)!);
          })
          .onUndo(() => {
            setLocation(block.getLocation(start, editable)!);
          });
      } else {
        const bias = block.getBias([range.startContainer, range.startOffset]);
        command = new FormatText({
          block,
          page,
          format,
          interval: {
            ...elementOffset(editable, hint),
            index,
          },
        }).onUndo(({ block, interval }) => {
          setLocation(block.getLocation(bias, interval.index)!);
        });
      }
    } else {
      let token_number = -1;
      if (e.inputType === "deleteWordBackward") {
        const prev = block.getPrevWordLocation([
          range.startContainer,
          range.startOffset,
        ])!;
        const prevRange = createRange(
          ...prev,
          range.startContainer,
          range.startOffset
        );
        token_number = -tokenBetweenRange(prevRange);
      }

      command = new TextDelete({
        block,
        page,
        start,
        token_number,
        index,
        token_filter,
      });
    }
  } else if (
    e.inputType === "deleteContentForward" ||
    e.inputType === "deleteWordForward"
  ) {
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
          interval: { ...elementOffset(editable, hint), index },
        }).onUndo(({ block, interval }) => {
          setLocation(block.getLocation(interval.start, interval.index)!);
        });
      }
    } else {
      let token_number = 1;
      if (e.inputType === "deleteWordForward") {
        const next = block.getNextWordLocation([
          range.startContainer,
          range.startOffset,
        ])!;
        const nextRange = createRange(
          range.startContainer,
          range.startOffset,
          ...next
        );
        token_number = tokenBetweenRange(nextRange);
      }
      command = new TextDelete({
        page,
        block,
        start,
        token_number,
        index,
        token_filter,
      });
    }
  } else if (e.inputType === "formatBold" || e.inputType === "formatItalic") {
    const end = block.getBias([range.endContainer, range.endOffset]);
    command = new FormatText({
      page: page,
      block: block,
      format: e.inputType === "formatBold" ? "b" : "i",
      interval: {
        start,
        end,
        index,
      },
    });
  }

  if (command) {
    page.executeCommand(command);
    return true;
  }
}
