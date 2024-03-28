import {
  InnerHTMLExtra,
  RangedBlockEventContext,
  CommonPayLoad,
  AnyBlock,
  RefLocation,
} from "@ohno/core/system/types";
import { ContainerRemove, Empty, RichTextDelete } from "./";

import { ListCommandBuilder } from "@ohno/core/system/command/builder";
import { createRange, outerHTML } from "@ohno/core/system/functional";
import { LocationPayLoad } from "@ohno/core/system/block/command_set";

export function removeSelectionInEditable(
  builder: ListCommandBuilder<RangedBlockEventContext>
) {
  const { block, range } = builder.payload;
  if (range.collapsed) {
    // skip
    return;
  }

  if (!block.findEditable(range.commonAncestorContainer)) {
    throw new Error("should be handled by removeSelectionInEditables");
  }

  builder.addLazyCommand(({ block, page }) => {
    const start = block.getBias([range.startContainer, range.startOffset]);
    const token_number = block.selection.tokenBetweenRange(range);
    return new RichTextDelete({
      page,
      block,
      start,
      index: 0,
      token_number,
    }).onUndo(({ block, start, token_number }) => {
      page.setRange(
        block.getEditableRange({
          start,
          end: start + token_number,
          index: 0,
        })!
      );
    });
  });
}

/**
 * remove content selected, but keep the editable root
 * @param builder
 * @returns
 */
export function removeSelectionInEditables(
  builder: ListCommandBuilder<any>,
  payload: RangedBlockEventContext,
  removeEmpty?: boolean
) {
  // 1. 如果存在选中文本，则删除。
  const { block, range } = payload;
  if (range.collapsed) {
    // 没有选中文本，不需要删除
    return;
  }
  if (block.findEditable(range.commonAncestorContainer)) {
    throw new Error("should be handled by removeSelectionInEditable");
  }
  const startBias = block.getBias([range.startContainer, range.startOffset]);
  const startTokenNumber =
    block.selection.getTokenSize(block.findEditable(range.startContainer)!) -
    startBias;
  const startEditable = block.findEditable(range.startContainer)!;
  const startIndex = block.getEditableIndex(startEditable);

  const endBias = block.getBias([range.endContainer, range.endOffset]);
  const endIndex = block.findEditableIndex(range.endContainer);

  let start: number, token_number: number;
  builder
    .addLazyCommand(({ page, block }) => {
      return new RichTextDelete({
        page,
        block,
        start: startBias,
        index: startIndex,
        token_number: startTokenNumber,
      }).onUndo(({ block }) => {
        const startLoc = block.getLocation(startBias, startIndex)!;
        const endLoc = block.getLocation(endBias, endIndex)!;
        page.setRange(createRange(...startLoc, ...endLoc));
      });
    }, payload)
    .addLazyCommand(({ page, block }) => {
      return new RichTextDelete({
        page,
        block,
        start: 0,
        index: endIndex,
        token_number: endBias,
      });
    }, payload);
  if (removeEmpty) {
    builder.addLazyCommand(({ page, block }) => {
      return new ContainerRemove({
        page,
        block,
        indexs: Array(endIndex - startIndex - 1)
          .fill(null)
          .map((_, index) => index + startIndex + 1),
      });
    }, payload);
  } else {
    for (
      let cur = startIndex + 1,
        curEditable = block.getNextEditable(startEditable)!;
      cur < endIndex;
      cur++, curEditable = block.getNextEditable(curEditable)!
    ) {
      builder.addLazyCommand(({ block, page }) => {
        start = 0;
        token_number = block.selection.getTokenSize(curEditable);
        const command = new RichTextDelete({
          page,
          block,
          start,
          index: cur,
          token_number,
        });
        command.onUndo();
        return command;
      }, payload);
    }
  }
}

export function removeEditableContentAfterLocation<
  T extends AnyBlock = AnyBlock
>(builder: ListCommandBuilder<any, any>, payload: LocationPayLoad<T>): void {
  builder.addLazyCommandWithPayLoad(({ block, page, bias, index }, extra) => {
    const editable = block.getEditable(index);
    if (!editable) {
      return;
    }
    const token_number = block.selection.getTokenSize(editable);

    if (token_number === bias) {
      // at end
      extra.innerHTML = "";
      return new Empty({ block, bias }).onUndo(({ block, bias }) => {
        page.setLocation(block.getLocation(bias, index)!, block);
      });
    }

    const tailSelectedRange = block.getRange(
      {
        start: bias,
        end: token_number,
      },
      editable
    )!;
    const newContent = tailSelectedRange!.cloneContents();
    extra.innerHTML = outerHTML(newContent);
    return new RichTextDelete({
      page,
      block,
      index,
      start: token_number,
      token_number: bias - token_number,
    }).onUndo(({ block }) => {
      page.setLocation(block.getLocation(bias, index)!, block);
    });
  }, payload);
}

export function removeEditableContentBeforeLocation<
  T extends AnyBlock = AnyBlock
>(
  builder: ListCommandBuilder<any, InnerHTMLExtra>,
  payload: LocationPayLoad<T>
): void {
  builder.addLazyCommandWithPayLoad(({ block, page, bias, index }, extra) => {
    const editable = block.getEditable(index);
    if (!editable) {
      return;
    }

    if (bias === 0) {
      // at start
      extra.innerHTML = "";
      return new Empty({ block, bias }).onUndo(({ block, bias }) => {
        page.setLocation(block.getLocation(bias, 0)!, block);
      });
    }

    const tailSelectedRange = block.getRange(
      {
        start: 0,
        end: bias,
      },
      editable
    )!;
    const newContent = tailSelectedRange!.cloneContents();
    extra.innerHTML = outerHTML(newContent);
    return new RichTextDelete({
      page,
      block,
      index,
      start: 0,
      token_number: bias,
    }).onUndo(({ block }) => {
      page.setLocation(block.getLocation(bias, index)!, block);
    });
  }, payload);
}
