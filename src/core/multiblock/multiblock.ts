import { BlockRemove, BlocksRemove } from "@/contrib/commands/block";
import { ListCommandBuilder } from "@/contrib/commands/concat";
import { ContainerRemove } from "@/contrib/commands/container";
import { FormatMultipleText } from "@/contrib/commands/format";
import { SetBlockRange } from "@/contrib/commands/select";
import { TextDeleteSelection } from "@/contrib/commands/text";
import { ValidNode } from "@/helper/element";
import { formatTags } from "@/system/format";
import {
  MultiBlockEventContext,
  Handler,
  dispatchKeyDown,
  KeyDispatchedHandler,
  EventContext,
} from "@/system/handler";
import {
  Offset,
  getTokenSize,
  locationToBias,
  rangeToOffset,
  setOffset,
} from "@/system/position";
import { defaultHandleArrowDown } from "../default/arrowDown";
import { TextInsert } from "@/contrib/commands";
import { getDefaultRange } from "@/helper/document";
import {
  createRange,
  normalizeContainer,
  normalizeRange,
  setRange,
} from "@/system/range";

function handleBeforeInputFormat(
  handler: Handler,
  e: TypedInputEvent,
  { blocks, page, range }: MultiBlockEventContext
) {
  const format = formatTags[e.inputType]!;
  const areas = blocks.flatMap((curBlock, blockIndex, arr) => {
    if (blockIndex === 0) {
      // 当前 Container 之后
      const container = curBlock.findContainer(range.startContainer)!;
      let cur = container;
      const containers = [container];
      const startIndex = curBlock.getIndexOfContainer(container);
      while ((cur = curBlock.nextContainer(cur!)!)) {
        containers.push(cur);
      }
      return containers.map((container, cindex) => {
        const start =
          cindex === 0
            ? locationToBias(
                container,
                range.startContainer as ValidNode,
                range.startOffset
              )
            : 0;
        return {
          block: curBlock,
          offset: {
            start,
            end: getTokenSize(container),
            index: cindex + startIndex,
          },
        };
      });
    } else if (blockIndex === arr.length - 1) {
      const container = curBlock.findContainer(range.endContainer)!;
      let cur = container;
      const containers = [container];
      while ((cur = curBlock.prevContainer(cur!)!)) {
        containers.unshift(cur);
      }
      return containers.map((container, cindex, arr) => {
        const end =
          cindex === arr.length - 1
            ? locationToBias(
                container,
                range.endContainer as ValidNode,
                range.endOffset
              )
            : getTokenSize(container);
        return {
          block: curBlock,
          offset: {
            start: 0,
            end,
            index: cindex,
          },
        };
      });
    } else {
      const container = curBlock.getContainer(0)!;
      let cur = container;
      const containers = [container];
      const startIndex = 0;
      while ((cur = curBlock.nextContainer(cur!)!)) {
        containers.unshift(cur);
      }
      return containers.map((container, cindex, arr) => {
        return {
          block: curBlock,
          offset: {
            start: 0,
            end: getTokenSize(container),
            index: cindex + startIndex,
          },
        };
      });
    }
  });

  const command = new FormatMultipleText({
    areas: areas, // TODO
    page,
    format,
  });
  return command;
}

function prepareDeleteMultiArea(
  handler: Handler,
  context: MultiBlockEventContext
) {
  const { page, range } = context;
  page.getNextBlock;
  const pageOffset = rangeToOffset(page.blockRoot!, range);
  // 最两边的 Container 删除文字 -> TextDelete
  // 第一个和最后一个 block 去除范围内 container -> ContainerRemove
  // 中间的 block 删除 -> BlockRemove
  // 第一个命令指定光标位置在 range start 位置
  // 最后一个命令不指定位置，默认还在初始位置，除了 Enter 定位到最后一个 Container 的初始位置
  const builder = new ListCommandBuilder<MultiBlockEventContext>(context)
    .withLazyCommand(({ block, page, range }, extra) => {
      const container = block.findContainer(range.startContainer)!;
      const startIndex = block.getIndexOfContainer(container);
      extra["startContainer"] = container;
      extra["startIndex"] = startIndex;
      const delOffset: Offset = {
        start: locationToBias(
          container!,
          range.startContainer as ValidNode,
          range.startOffset
        ),
        end: getTokenSize(container),
        index: startIndex,
      };
      extra["startPosition"] = { ...delOffset, end: undefined };

      return new TextDeleteSelection({ block, page, delOffset })
        .onExecute()
        .onUndo(({ page }) => {
          setOffset(page.blockRoot!, pageOffset);
        });
    })
    .withLazyCommand(({ endBlock, range, page }, extra) => {
      const container = endBlock.findContainer(range.endContainer)!;
      const endIndex = endBlock.getIndexOfContainer(container);
      extra["endContainer"] = container;
      extra["endIndex"] = endIndex;
      const delOffset: Offset = {
        start: 0,
        end: locationToBias(
          container!,
          range.endContainer as ValidNode,
          range.endOffset
        ),
        index: endIndex,
      };
      return new TextDeleteSelection({ block: endBlock, page, delOffset });
    })
    .withLazyCommand(({ block, page }, { startContainer, startIndex }) => {
      if (!block.multiContainer) {
        return;
      }
      if (startIndex === block.containers().length - 1) {
        return;
      }
      const index = Array.from(
        { length: block.containers().length - startIndex - 1 },
        (_, index) => index + startIndex + 1!
      );
      return new ContainerRemove({ block, page, index });
    })
    .withLazyCommand(({ endBlock, page }, { endContainer, endIndex }) => {
      if (!endBlock.multiContainer || endIndex === 0) {
        return;
      }
      // TODO 如果是要合并的话，就 endIndex + 1，否则是 endIndex
      const index = Array.from(Array(endIndex).fill(0).keys());
      return new ContainerRemove({ block: endBlock, page, index });
    })
    .withLazyCommand(({ blocks, page }) => {
      if (blocks.length > 2) {
        return new BlocksRemove({ page, blocks: blocks.slice(1, -1) });
      }
      return;
    })
    .withLazyCommand(({ block, page }, { startPosition }) => {
      return new SetBlockRange({
        page,
        block,
        offset: startPosition,
        newBlock: block,
        newOffset: startPosition,
      });
    });
  return builder;
}

export class MultiBlockHandler extends Handler implements KeyDispatchedHandler {
  handleCopy(
    e: ClipboardEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleCopy", e, context.block);
  }
  handlePaste(
    e: ClipboardEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handlePaste", e, context.block);
  }
  handleBlur(e: FocusEvent, context: MultiBlockEventContext): void | boolean {
    console.log("handleBlur", e, context.block);
  }
  handleFocus(e: FocusEvent, context: MultiBlockEventContext): void | boolean {
    const sel = document.getSelection();
    if (sel && sel.rangeCount > 0) {
      console.log("handleFocus", e, context.block);
    }
  }
  handleEnterDown(
    e: KeyboardEvent,
    context: MultiBlockEventContext
  ): boolean | void {
    const builder = prepareDeleteMultiArea(this, context);
    const command = builder.build();
    context.page.executeCommand(command);
    return true;
  }
  handleKeyDown(
    e: KeyboardEvent,
    context: MultiBlockEventContext
  ): boolean | void {
    if (dispatchKeyDown(this, e, context)) {
      return true;
    } else if (e.metaKey) {
      if (e.key === "z") {
        if (e.shiftKey) {
          context.page.history.redo();
        } else {
          context.page.history.undo();
        }
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  handleKeyPress(
    e: KeyboardEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleKeyPress", e, context.block);
  }
  handleKeyUp(
    e: KeyboardEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleKeyUp", e, context.block);
  }
  handleMouseDown(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleMouseDown", e, context.block);
  }
  handleMouseEnter(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleMouseEnter", e, context.block);
  }
  handleMouseMove(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleMouseMove", e, context.block);
  }
  handleArrowKeyDown(e: KeyboardEvent, context: EventContext): boolean | void {
    return defaultHandleArrowDown(this, e, context);
  }
  handleMouseLeave(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleMouseLeave", e, context.block);
  }
  handleMouseUp(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleMouseUp", e, context.block);
    const { block, endBlock, range, page } = context;
    const startRoot = block.findContainer(range.startContainer)!;
    const endRoot = endBlock.findContainer(range.endContainer)!;
    range.startOffset, range.endOffset;
    const [startContainer, startOffset] = normalizeContainer(
      startRoot,
      range.startContainer,
      range.startOffset,
      "left"
    );
    const [endContainer, endOffset] = normalizeContainer(
      endRoot,
      range.endContainer,
      range.endOffset,
      "right"
    );
    setRange(createRange(startContainer, startOffset, endContainer, endOffset));

    page.status.selectionDir = "next";
    return true;
  }
  handleClick(e: MouseEvent, context: MultiBlockEventContext): void | boolean {
    console.log("handleClick", e, context.block);
  }
  handleContextMenu(
    e: MouseEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleContextMenu", e, context.block);
  }
  handleInput(e: Event, context: MultiBlockEventContext): void | boolean {
    console.log("handleInput", e, context.block);
  }
  handleBeforeInput(
    e: TypedInputEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    const { block, blocks, range, page } = context;
    let command;
    if (
      e.inputType === "formatBold" ||
      e.inputType === "formatItalic" ||
      e.inputType === "formatUnderline"
    ) {
      command = handleBeforeInputFormat(this, e, context);
    } else {
      // 下面这些都是要先把选中内容删干净，即跨 Container 的删除
      const builder = prepareDeleteMultiArea(this, context);
      builder
        .withLazyCommand(({ endBlock, page }, extra) => {
          // 先存储 innerHTML
          // 如果是 multiblock ，则 remove container 或 remove Block
          // 否则直接 remove Block
          const { endContainer } = extra;
          extra["innerHTML"] = endContainer.innerHTML;
          if (endBlock.multiContainer && endBlock.nextContainer(endContainer)) {
            return new ContainerRemove({ block: endBlock, index: [0], page });
          }
          return new BlockRemove({ block: endBlock, page });
        })
        .withLazyCommand(({ block, page }, extra) => {
          const { startContainer, innerHTML } = extra;
          const insertOffset = {
            index: block.getIndexOfContainer(startContainer),
            start: getTokenSize(startContainer),
          };
          extra["insertOffset"] = insertOffset;

          return new TextInsert({
            block,
            innerHTML,
            page,
            insertOffset,
          }).onExecute(({ block, insertOffset }) => {
            block.setOffset(insertOffset);
          });
        });

      if (e.inputType === "insertText") {
        builder.withLazyCommand(({ block }, { insertOffset }) => {
          // const offset = block.getOffset(range);
          // if (range.startContainer instanceof HTMLLabelElement) {
          //   offset.start++;
          // }
          return new TextInsert({
            page: page,
            block: block,
            insertOffset,
            innerHTML: e.data as string,
          });
        });
        // builder.withLazyCommand(({ page, block }) => {
        //   return new TextInsert({
        //     page,
        //     block,
        //     innerHTML: e.data as string,
        //     insertOffset: { ...offsets[0], end: undefined },
        //   }).onExecute(({ insertOffset }) => {});
        // });
        command = builder.build();
      } else if (e.inputType === "insertFromPaste") {
        command = builder.build();
      } else if (
        e.inputType === "deleteContentBackward" ||
        e.inputType === "deleteWordBackward" ||
        e.inputType === "deleteContentForward" ||
        e.inputType === "deleteWordForward" ||
        e.inputType === "deleteSoftLineBackward"
      ) {
        command = builder.build();
      } else {
        console.log(e);
        return true;
      }
    }
    if (command) {
      page.executeCommand(command);
    }
    console.log(e);

    return true;
    return true;
  }
  handleCompositionEnd(
    e: CompositionEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    console.log("handleCompositionEnd", e, context.block);
  }
  handleCompositionStart(
    e: CompositionEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    const { page } = context;
    const builder = prepareDeleteMultiArea(this, context);
    builder
      .withLazyCommand(({ endBlock, page }, extra) => {
        // 先存储 innerHTML
        // 如果是 multiblock ，则 remove container 或 remove Block
        // 否则直接 remove Block
        const { endContainer } = extra;
        extra["innerHTML"] = endContainer.innerHTML;
        if (endBlock.multiContainer && endBlock.nextContainer(endContainer)) {
          return new ContainerRemove({ block: endBlock, index: [0], page });
        }
        return new BlockRemove({ block: endBlock, page });
      })
      .withLazyCommand(({ block, page }, extra) => {
        const { startContainer, innerHTML } = extra;
        const insertOffset = {
          index: block.getIndexOfContainer(startContainer),
          start: getTokenSize(startContainer),
        };
        extra["insertOffset"] = insertOffset;

        return new TextInsert({
          block,
          innerHTML,
          page,
          insertOffset,
        }).onExecute(({ block, insertOffset }) => {
          block.setOffset(insertOffset);
        });
      });
    const command = builder.build();
    page.executeCommand(command);
    return true;
  }
  handleCompositionUpdate(
    e: CompositionEvent,
    context: MultiBlockEventContext
  ): void | boolean {}
}
