import {
  HandlerMethods,
  RangedBlockEventContext,
  HTMLElementTagName,
  ElementFilter,
  Command,
  ListCommandBuilder,
} from "@ohno-editor/core/system/types";

import { FormatText } from "@ohno-editor/core/contrib/commands/format";
import {
  createRange,
  tryGetBoundsRichNode,
  validateRange,
  getIntervalOfNodes,
  getTokenNumberInRange,
  getTagName,
} from "@ohno-editor/core/system/functional";
import { IBlockRemove } from "@ohno-editor/core/contrib/commands/inlineblock";

import {
  RichTextDelete,
  TextDelete,
  TextInsert,
} from "@ohno-editor/core/contrib/commands/text";
import { None } from "@ohno-editor/core/contrib";
import { handleInsertFromDrop } from "./drop";

export function prepareBeforeInputCommand(
  handler: HandlerMethods,
  e: TypedInputEvent,
  context: RangedBlockEventContext
): Command<any> | undefined {
  const { page, block, range } = context;
  let command;
  const editable = block.findEditable(range.startContainer)!;
  const index = block.getEditableIndex(editable);
  const start = block.getBias([range.startContainer, range.startOffset]);
  if (e.inputType === "insertText") {
    command = prepareInsertPlainTextCommand(context, e.data!);
  } else if (e.inputType === "insertFromPaste") {
    if (e.dataTransfer) {
      let content: string;
      if ((content = e.dataTransfer.getData("text/html"))) {
        command = prepareInsertPlainTextCommand(context, content);
      } else if ((content = e.dataTransfer.getData("text/plain"))) {
        command = prepareInsertPlainTextCommand(context, content);
      } else {
        // eslint-disable-next-line no-debugger
        debugger;
        return new None({});
      }
    }
  } else if (e.inputType === "insertFromDrop") {
    command = handleInsertFromDrop(handler, e, context);
  } else if (e.inputType === "insertCompositionText") {
    return new None({});
  } else if (
    !range.collapsed &&
    (e.inputType === "deleteContentBackward" ||
      e.inputType === "deleteContentForward")
  ) {
    // 所有的 multi block 应该被 multiblock handler 接受
    // 所有的 multi container 应该被 block handler 接受
    const token_number = block.selection.tokenBetweenRange(range);

    command = new TextDelete({
      page,
      block,
      start,
      index: 0,
      token_number,
    })
      .onExecute(({ block, start }) => {
        page.setLocation(block.getLocation(start, 0)!, block);
      })
      .onUndo(({ block, start, token_number }) => {
        page.setRange(block.getRange({ start, end: start + token_number }, 0)!);
      });
  } else if (
    e.inputType === "deleteContentBackward" ||
    e.inputType === "deleteWordBackward"
  ) {
    if (block.isLocationInLeft([range.startContainer, range.startOffset])) {
      return new None({});
    }

    // TODO 讨论在 label 边界出的删除行为应该是首次选中还是直接删除
    let token_number = -1;
    if (e.inputType === "deleteWordBackward") {
      const prev = block.getPrevWordLocation([
        range.startContainer,
        range.startOffset,
      ])!;
      const prevRange = createRange(
        prev[0],
        prev[1],
        range.startContainer,
        range.startOffset
      );
      token_number = -getTokenNumberInRange(prevRange);
    }

    command = new TextDelete({
      block,
      page,
      start,
      token_number,
      index,
    });
  } else if (
    e.inputType === "deleteContentForward" ||
    e.inputType === "deleteWordForward"
  ) {
    // 判断是否是格式字符边界，两种情况：
    // ?|<b>asd</b>
    // <b>asd|</b>?
    if (block.isLocationInRight([range.startContainer, range.startOffset])) {
      return new None({});
    }
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
      token_number = getTokenNumberInRange(nextRange);
    }
    command = new TextDelete({
      page,
      block,
      start: start,
      token_number: token_number,
      index,
    }).onExecute(({ token_filter }) => {
      page.setLocation(block.getLocation(start, index, token_filter)!, block);
    });
  }
  return command;
}

export function insertPlainText(
  context: RangedBlockEventContext,
  text: string
): boolean {
  const { page } = context;
  const command = prepareInsertPlainTextCommand(context, text);
  if (command) {
    page.executeCommand(command);
    return true;
  }
  return false;
}

export function prepareInsertPlainTextCommand(
  context: RangedBlockEventContext,
  text: string
): Command<any> {
  const { page, block, range } = context;
  const builder = new ListCommandBuilder({ page, block, range });

  const start = block.getBias([range.startContainer, range.startOffset]);
  if (!range.collapsed) {
    const token_number = block.selection.tokenBetweenRange(range);
    builder.addLazyCommand(() => {
      return new TextDelete({
        page,
        block,
        start,
        index: 0,
        token_number,
      }).onUndo(({ block, start, token_number }) => {
        page.setRange(block.getRange({ start, end: start + token_number }, 0)!);
      });
    });
    // const command =
  }
  builder.addLazyCommand(() => {
    return new TextInsert({
      page,
      block,
      start: start,
      index: 0,
      innerHTML: text,
      plain: true,
    })
      .onExecute(({ block, start }) => {
        page.setLocation(block.getLocation(start + text.length, 0)!, block);
      })
      .onUndo(({ block, start }) => {
        page.setLocation(block.getLocation(start, 0)!, block);
      });
  });

  const command = builder.build();
  return command;
  // page.executeCommand(command);
  // return true;
}

export function defaultHandleBeforeInputOfPlainText(
  handler: HandlerMethods,
  e: TypedInputEvent,
  context: RangedBlockEventContext
): boolean | void {
  const { page, block, range } = context;
  // multiblock 的情况不会到这里
  validateRange(range);

  const command = prepareBeforeInputCommand(handler, e, context);
  if (command) {
    page.executeCommand(command);
  }
  return true;
}

export function defaultHandleBeforeInput(
  handler: HandlerMethods,
  e: TypedInputEvent,
  context: RangedBlockEventContext,
  token_filter?: ElementFilter
): boolean | void {
  const { page, block, range } = context;
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
        .addLazyCommand(() => {
          const token_number = getTokenNumberInRange(range);
          return new RichTextDelete({
            page,
            block,
            start,
            index,
            token_number,
          });
        })
        .addLazyCommand(() => {
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
  } else if (e.inputType === "insertCompositionText") {
    return false;
  } else if (e.inputType === "insertFromDrop") {
    command = handleInsertFromDrop(handler, e, context);
  } else if (e.inputType === "insertFromPaste") {
    // 由 handlePaste 处理
    return false;
  } else if (
    !range.collapsed &&
    (e.inputType === "deleteContentBackward" ||
      e.inputType === "deleteContentForward")
  ) {
    // 所有的 multi block 应该被 multiblock handler 接受
    // 所有的 multi container 应该被 block handler 接受
    const token_number = getTokenNumberInRange(range);
    if (getTagName(range.commonAncestorContainer) === "#text") {
      command = new TextDelete({
        page,
        block,
        start: start + token_number,
        index,
        token_number: -token_number,
        token_filter,
      });
    } else {
      command = new RichTextDelete({
        page,
        block,
        start,
        index,
        token_number,
      }).onExecute(({ block, start, index }) => {
        page.setLocation(block.getLocation(start, index)!, block);
      });
    }
  } else if (
    e.inputType === "deleteContentBackward" ||
    e.inputType === "deleteWordBackward" ||
    e.inputType === "deleteSoftLineBackward"
  ) {
    // debugger;
    let hint;
    if (block.isLocationInLeft([range.startContainer, range.startOffset])) {
      return true;
    }
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
            page.setLocation(block.getLocation(start - 2, index)!, block);
          })
          .onUndo(() => {
            page.setLocation(block.getLocation(start, index)!, block);
          });
      } else {
        const bias = block.getBias([range.startContainer, range.startOffset]);
        command = new FormatText({
          block,
          page,
          format,
          interval: {
            ...getIntervalOfNodes(editable, hint),
            index,
          },
        }).onUndo(({ block, interval }) => {
          page.setLocation(block.getLocation(bias, interval.index)!, block);
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
          prev[0],
          prev[1],
          range.startContainer,
          range.startOffset
        );
        token_number = -getTokenNumberInRange(prevRange);
      } else if (e.inputType === "deleteSoftLineBackward") {
        const prev = block.getSoftLineHead([
          range.startContainer,
          range.startOffset,
        ])!;
        const prevRange = createRange(
          prev[0],
          prev[1],
          range.startContainer,
          range.startOffset
        );
        token_number = -getTokenNumberInRange(prevRange);
      }
      const commandCls =
        e.inputType === "deleteSoftLineBackward" ? RichTextDelete : TextDelete;
      command = new commandCls({
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
    e.inputType === "deleteWordForward" ||
    e.inputType === "deleteSoftLineForward"
  ) {
    // 判断是否是格式字符边界，两种情况：
    // ?|<b>asd</b>
    // <b>asd|</b>?
    if (block.isLocationInRight([range.startContainer, range.startOffset])) {
      return true;
    }

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
          interval: { ...getIntervalOfNodes(editable, hint), index },
        }).onUndo(({ block, interval }) => {
          page.setLocation(
            block.getLocation(interval.start, interval.index)!,
            block
          );
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
        token_number = getTokenNumberInRange(nextRange);
      } else if (e.inputType === "deleteSoftLineForward") {
        const next = block.getSoftLineTail([
          range.startContainer,
          range.startOffset,
        ])!;
        const nextRange = createRange(
          range.startContainer,
          range.startOffset,
          ...next
        );
        token_number = getTokenNumberInRange(nextRange);
      }

      command = new TextDelete({
        page,
        block,
        start,
        token_number,
        index,
        token_filter,
      }).onExecute(({ token_filter }) => {
        page.setLocation(block.getLocation(start, index, token_filter)!, block);
      });
    }
  } else if (e.inputType.startsWith("format")) {
  } else if (e.inputType === "deleteByCut") {
  }
  if (command) {
    page.executeCommand(command);
    return true;
  }
}
