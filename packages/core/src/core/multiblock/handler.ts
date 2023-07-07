import {
  BlockRemove,
  BlockReplace,
  BlocksRemove,
} from "@ohno-editor/core/contrib/commands/block";
import { FormatMultipleText } from "@ohno-editor/core/contrib/commands/format";
import { Empty } from "@ohno-editor/core/contrib/commands/select";
import {
  ValidNode,
  MultiBlockEventContext,
  RangedBlockEventContext,
  PagesHandleMethods,
  OhNoClipboardData,
  ListCommandBuilder,
} from "@ohno-editor/core/system/types";
import {
  dispatchKeyEvent,
  formatTags,
  getTokenSize,
  locationToBias,
  createRange,
  setRange,
  copyMultiBlock,
} from "@ohno-editor/core/system/functional";
import { defaultHandleArrowDown } from "../default/functional/arrowDown";
import { TextInsert } from "@ohno-editor/core/contrib/commands/text";
import { defaultHandlePaste } from "../default/functional/paste";
import { MultiBlockPayLoad } from "../..";
import { defaultHandleMouseUp } from "../default/functional/mouse";

function handleBeforeInputFormat(
  handler: PagesHandleMethods,
  e: TypedInputEvent,
  { blocks, page, range }: MultiBlockEventContext
) {
  const format = formatTags[e.inputType]!;
  const areas = blocks.flatMap((curBlock, blockIndex, arr) => {
    if (blockIndex === 0) {
      // 当前 Container 之后
      const container = curBlock.findEditable(range.startContainer)!;
      let cur = container;
      const containers = [container];
      const startIndex = curBlock.getEditableIndex(container);
      while ((cur = curBlock.getNextEditable(cur!)!)) {
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
      const container = curBlock.findEditable(range.endContainer)!;
      let cur = container;
      const containers = [container];
      while ((cur = curBlock.getPrevEditable(cur!)!)) {
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
      const container = curBlock.getEditable(0)!;
      let cur = container;
      const containers = [container];
      const startIndex = 0;
      while ((cur = curBlock.getNextEditable(cur!)!)) {
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

function deleteMultiBlockSelection(
  handler: PagesHandleMethods,
  context: MultiBlockEventContext
) {
  const { page, range, block, endBlock, blocks } = context;
  const startGlobalBias: [number, number] = block.findEditable(
    range.startContainer
  )
    ? block.getGlobalBiasPair([range.startContainer, range.startOffset])
    : [0, 0];
  // todo find editable first
  const endGlobalBias: [number, number] = endBlock.findEditable(
    range.endContainer
  )
    ? endBlock.getGlobalBiasPair([range.endContainer, range.endOffset])
    : [-1, -1];

  const builder = new ListCommandBuilder<MultiBlockPayLoad>(context);
  builder.addLazyCommand(({ page }) => {
    return new Empty({ page, block }).onUndo(({ block }) => {
      const startLoc = block.getLocation(...startGlobalBias)!;
      const endLoc = endBlock.getLocation(...endGlobalBias)!;

      page.setRange(createRange(...startLoc, ...endLoc));
    });
  });

  let startRemove = false,
    endRemove = false;
  if (block.selection.isNodeInRange(block.root, range) || !block.mergeable) {
    builder.addLazyCommand(({ page, block }) => {
      const newBlock = page.createDefaultBlock();
      return new BlockReplace({ page, block, newBlock });
    });
    startRemove = true;
  } else {
    block.commandSet.multiblockPartSelectionRemove(builder, { isEnd: false });
  }

  if (endBlock.selection.isNodeInRange(endBlock.root, range)) {
    endRemove = true;
  } else {
    endBlock.commandSet.multiblockPartSelectionRemove(builder, { isEnd: true });
  }
  if (block.mergeable && endBlock.mergeable && !startRemove && !endRemove) {
    endBlock.commandSet.multiblockMergeWhenIsLast(builder);
    block.commandSet.multiblockMergeWhenIsFirst(builder);
  }
  builder
    .addLazyCommand(({ blocks, page }) => {
      if (endRemove) {
        return new BlocksRemove({ page, blocks: blocks.slice(1) });
      } else if (blocks.length > 2) {
        return new BlocksRemove({ page, blocks: blocks.slice(1, -1) });
      }
      return;
    })
    .addLazyCommand(({ page }, extra) => {
      extra["start"] = startGlobalBias[0];
      extra["index"] = startGlobalBias[1];
      return new Empty({ page, block }).onExecute(({ block }) => {
        if (block.detached) {
          block = page.query(block.order)!;
          page.setLocation(block.getLocation(0, 0)!, block);
        } else {
          page.setLocation(
            block.getLocation(startGlobalBias[0], startGlobalBias[1])!,
            block
          );
        }
      });
    });

  return builder;
}

export class MultiBlockHandler implements PagesHandleMethods {
  handleCopy(
    e: ClipboardEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    copyMultiBlock(e.clipboardData!, context);
    return true;
  }

  handleCut(
    e: ClipboardEvent,
    context: MultiBlockEventContext
  ): boolean | void {
    this.handleCopy(e, context);
    const builder = deleteMultiBlockSelection(this, context);
    const command = builder.build();
    context.page.executeCommand(command);
    return true;
  }
  handlePaste(
    e: ClipboardEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    const command = deleteMultiBlockSelection(this, context).build();
    context.page.executeCommand(command);
    return defaultHandlePaste(this, e, context);
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
    const builder = deleteMultiBlockSelection(this, context).addLazyCommand(
      ({ block, page, endBlock }) => {
        return new Empty({ page, block, endBlock }).onExecute(
          ({ endBlock }) => {
            page.setLocation(endBlock.getLocation(0, 0)!, endBlock);
          }
        );
      }
    );
    const command = builder.build();
    context.page.executeCommand(command);
    return true;
  }

  handleKeyDown(
    e: KeyboardEvent,
    context: MultiBlockEventContext
  ): boolean | void {
    if (dispatchKeyEvent(this, e, context)) {
      return true;
    } else if (e.metaKey) {
      if (e.key === "z") {
        if (e.shiftKey) {
          context.page.history.redo();
        } else {
          context.page.history.undo();
        }
        return true;
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
  handleArrowKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
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
    defaultHandleMouseUp(this, e, context);
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
    const { page } = context;
    let command;
    if (
      e.inputType === "formatBold" ||
      e.inputType === "formatItalic" ||
      e.inputType === "formatUnderline"
    ) {
      command = handleBeforeInputFormat(this, e, context);
    } else {
      // 下面这些都是要先把选中内容删干净，即跨 Container 的删除

      const builder = deleteMultiBlockSelection(this, context);

      if (e.inputType === "insertText") {
        builder.addLazyCommand(({ block }, { start, index }) => {
          return new TextInsert({
            page,
            block,
            innerHTML: e.data!,
            plain: true,
            start,
            index,
          });
        });

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
  }

  handleCompositionStart(
    e: CompositionEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    const { page } = context;
    const builder = deleteMultiBlockSelection(this, context);
    const command = builder.build();
    page.executeCommand(command);
    return true;
  }

  handleCompositionUpdate(
    e: CompositionEvent,
    context: MultiBlockEventContext
  ): void | boolean {}
}
