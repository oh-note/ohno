import {
  BlockEventContext,
  Handler,
  HandlerMethod,
  HandlerMethods,
  RangedBlockEventContext,
} from "@ohno-editor/core/system/handler";

import { FormatText } from "@ohno-editor/core/contrib/commands/format";
import { HTMLElementTagName } from "@ohno-editor/core/helper/document";
import {
  createRange,
  setLocation,
  setRange,
  tryGetBoundsRichNode,
  validateRange,
} from "@ohno-editor/core/system/range";
import { ElementFilter, getTagName } from "@ohno-editor/core/helper/element";
import { IBlockRemove } from "@ohno-editor/core/contrib/commands/inlineblock";

import {
  elementOffset,
  tokenBetweenRange,
} from "@ohno-editor/core/system/position";
import { ListCommandBuilder } from "@ohno-editor/core/contrib/commands/concat";
import {
  RichTextDelete,
  TextDelete,
  TextInsert,
} from "@ohno-editor/core/contrib/commands/text";
import { OhNoClipboardData } from "@ohno-editor/core/system";
import { BlockRemove, BlocksCreate } from "@ohno-editor/core/contrib";

export function insertPlainText(
  context: RangedBlockEventContext,
  text: string
) {
  const { page, block, range } = context;
  const command = new TextInsert({
    page,
    block,
    start: block.getBias([range.startContainer, range.startOffset]),
    index: 0,
    innerHTML: text,
    plain: true,
  })
    .onExecute(({ block, start }) => {
      page.setLocation(block.getLocation(start + 1, 0)!, block);
    })
    .onUndo(({ block, start }) => {
      page.setLocation(block.getLocation(start, 0)!, block);
    });
  page.executeCommand(command);
  return true;
}

export function defaultHandleBeforeInputOfPlainText(
  handler: HandlerMethods,
  e: TypedInputEvent,
  context: RangedBlockEventContext
): boolean | void {
  const { page, block, range } = context;
  // multiblock 的情况不会到这里
  validateRange(range);

  let command;
  const editable = block.findEditable(range.startContainer)!;
  const index = block.getEditableIndex(editable);
  let start = block.getBias([range.startContainer, range.startOffset]);
  if (e.inputType === "insertText") {
    return insertPlainText(context, e.data!);
  } else if (e.inputType === "insertFromPaste") {
    if (e.dataTransfer) {
      let content: string;
      if ((content = e.dataTransfer.getData("text/html"))) {
        insertPlainText(context, content);
      } else if ((content = e.dataTransfer.getData("text/plain"))) {
        insertPlainText(context, content);
      } else {
        // eslint-disable-next-line no-debugger
        debugger;
        return true;
      }
    }
  } else if (e.inputType === "insertFromDrop") {
    if (e.dataTransfer) {
      let content: string;
      if ((content = e.dataTransfer.getData("text/ohno"))) {
        const { data, head, tail, inline, context } = JSON.parse(
          content
        ) as OhNoClipboardData;

        const newBlocks = data.map((item) => {
          return page.createBlock(item.type as string, item.init);
        });

        command = new BlocksCreate({
          page,
          block,
          newBlocks,
          where: "after",
        });

        if (context && context.dragFrom) {
          command = new ListCommandBuilder({
            page,
            block,
            newBlocks,
            drag: context.dragFrom,
          })
            .withCommand(command)
            .withLazyCommand(({ drag, page, block }) => {
              return new BlockRemove({ page, block: drag });
            })
            .build();
        }
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
    const token_number = tokenBetweenRange(range);

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
        setRange(block.getRange({ start, end: start + token_number }, 0)!);
      });
  } else if (
    e.inputType === "deleteContentBackward" ||
    e.inputType === "deleteWordBackward"
  ) {
    let hint;
    if (block.isLocationInLeft([range.startContainer, range.startOffset])) {
      return true;
    }

    // TODO 讨论在 label 边界出的删除行为应该是首次选中还是直接删除
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
    });
  } else if (
    e.inputType === "deleteContentForward" ||
    e.inputType === "deleteWordForward"
  ) {
    // 判断是否是格式字符边界，两种情况：
    // ?|<b>asd</b>
    // <b>asd|</b>?
    if (block.isLocationInRight([range.startContainer, range.startOffset])) {
      return true;
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
      token_number = tokenBetweenRange(nextRange);
    }
    command = new TextDelete({
      page,
      block,
      start,
      token_number,
      index,
    });
  }
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
  } else if (e.inputType === "insertCompositionText") {
    return false;
  } else if (e.inputType === "insertFromDrop") {
    if (e.dataTransfer) {
      let content: string;
      if ((content = e.dataTransfer.getData("text/ohno"))) {
        const { data, head, tail, inline, context } = JSON.parse(
          content
        ) as OhNoClipboardData;

        const newBlocks = data.map((item) => {
          return page.createBlock(item.type as string, item.init);
        });

        command = new BlocksCreate({
          page,
          block,
          newBlocks,
          where: "after",
        });

        if (context && context.dragFrom) {
          command = new ListCommandBuilder({
            page,
            block,
            newBlocks,
            drag: context.dragFrom,
          })
            .withCommand(command)
            .withLazyCommand(({ drag, page, block }) => {
              return new BlockRemove({ page, block: drag });
            })
            .build();
        }
      } else {
        // eslint-disable-next-line no-debugger
        debugger;
        return true;
      }
    }
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
    const token_number = tokenBetweenRange(range);
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
    e.inputType === "deleteWordBackward"
  ) {
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
            page.setLocation(block.getLocation(start - 2, editable)!, block);
          })
          .onUndo(() => {
            page.setLocation(block.getLocation(start, editable)!, block);
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
          interval: { ...elementOffset(editable, hint), index },
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
