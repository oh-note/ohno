import {
  BlockRemove,
  BlocksRemove,
} from "@ohno-editor/core/contrib/commands/block";
import { ListCommandBuilder } from "@ohno-editor/core/contrib/commands/concat";
import { ContainerRemove } from "@ohno-editor/core/contrib/commands/container";
import { FormatMultipleText } from "@ohno-editor/core/contrib/commands/format";
import { Empty } from "@ohno-editor/core/contrib/commands/select";
import { ValidNode } from "@ohno-editor/core/helper/element";
import { formatTags } from "@ohno-editor/core/system/format";
import {
  MultiBlockEventContext,
  dispatchKeyEvent,
  RangedBlockEventContext,
  PagesHandleMethods,
} from "@ohno-editor/core/system/handler";
import {
  getTokenSize,
  locationToBias,
  rangeToInterval,
} from "@ohno-editor/core/system/position";
import { defaultHandleArrowDown } from "../default/functional/arrowDown";
import {
  createRange,
  normalizeContainer,
  setRange,
} from "@ohno-editor/core/system/range";
import {
  RichTextDelete,
  TextInsert,
} from "@ohno-editor/core/contrib/commands/text";
import { OhNoClipboardData } from "@ohno-editor/core/system/base";
import { defaultHandlePaste } from "../default/functional/paste";

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

function prepareDeleteMultiArea(
  handler: PagesHandleMethods,
  context: MultiBlockEventContext
) {
  const { page, range, block, endBlock, blocks } = context;
  page.getNextBlock;
  const pageOffset = rangeToInterval(page.blockRoot!, range);
  // todo find editable first

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

  const builder = new ListCommandBuilder<MultiBlockEventContext>(context)
    .withLazyCommand(({ block, page, range }, extra) => {
      // 始终保留第一个 block
      const container = block.findEditable(range.startContainer)!;
      const startIndex = block.getEditableIndex(container);
      extra["startContainer"] = container;
      extra["startIndex"] = startIndex;
      const start = locationToBias(
        container!,
        range.startContainer as ValidNode,
        range.startOffset
      );
      const token_number = getTokenSize(container) - start;
      extra["startPosition"] = start;

      return new RichTextDelete({
        page,
        block,
        index: startIndex,
        start,
        token_number,
      })
        .onExecute()
        .onUndo(() => {
          const startLoc = block.getLocation(...startGlobalBias)!;
          const endLoc = endBlock.getLocation(...endGlobalBias)!;
          const range = createRange(...startLoc, ...endLoc);
          page.setRange(range);
        });
    })
    .withLazyCommand(({ endBlock, range, page }, extra) => {
      if (!endBlock.mergeable) {
        return;
      }
      const container = endBlock.findEditable(range.endContainer)!;
      const endIndex = endBlock.getEditableIndex(container);
      extra["endContainer"] = container;
      extra["endIndex"] = endIndex;
      const token_number = locationToBias(
        container!,
        range.endContainer as ValidNode,
        range.endOffset
      );
      // const delOffset: Offset = {
      //   start: 0,
      //   end: locationToBias(
      //     container!,
      //     range.endContainer as ValidNode,
      //     range.endOffset
      //   ),
      //   index: endIndex,
      // };
      return new RichTextDelete({
        page,
        block: endBlock,
        index: endIndex,
        start: 0,
        token_number,
      });
      // return new TextDeleteSelection({ block: endBlock, page, delOffset });
    })
    .withLazyCommand(({ block, page }, { startContainer, startIndex }) => {
      // 删第一个的 container
      // debugger;
      if (!block.isMultiEditable) {
        return;
      }
      if (startIndex === block.getEditables().length - 1) {
        return;
      }
      if (!block.mergeable) {
        // TODO 只删文字
        return;
      }
      const index = Array.from(
        { length: block.getEditables().length - startIndex - 1 },
        (_, index) => index + startIndex + 1!
      );
      return new ContainerRemove({ block, page, indexs: index });
    })
    .withLazyCommand(({ endBlock, page }, { endContainer, endIndex }) => {
      if (!endBlock.isMultiEditable || endIndex === 0) {
        return;
      }
      if (!endBlock.mergeable) {
        // TODO 只删文字
        return;
      }
      // TODO 如果是要合并的话，就 endIndex + 1，否则是 endIndex
      const index = Array.from(Array(endIndex).fill(0).keys());
      return new ContainerRemove({ block: endBlock, page, indexs: index });
    })
    .withLazyCommand(({ blocks, page }) => {
      if (blocks.length > 2) {
        return new BlocksRemove({ page, blocks: blocks.slice(1, -1) });
      }
      return;
    })
    .withLazyCommand(({ block, page }, { startPosition, startIndex }) => {
      return new Empty({ page, block }).onExecute(({ block }) => {
        page.setLocation(block.getLocation(startPosition, startIndex)!, block);
      });
    });
  return builder;
}

export class MultiBlockHandler implements PagesHandleMethods {
  handleCopy(
    e: ClipboardEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    const { page, blocks, block, endBlock, range } = context;
    const data = blocks.map((curBlock, index) => {
      let text, html, json;

      const blockser = page.getBlockSerializer(block.type);

      if (curBlock === block || curBlock == endBlock) {
        if (!curBlock.isMultiEditable && curBlock.mergeable) {
          // paragraph/quoteblock
          const editable = curBlock.findEditable(
            index === 0 ? range.startContainer : range.endContainer
          );
          if (editable) {
            const inlineRange = block.selection.clipRange(editable, range);
            if (inlineRange) {
              json = page.inlineSerializer.serialize(inlineRange);
              html = page.inlineSerializer.toHTML(inlineRange);
              text = page.inlineSerializer.toMarkdown(inlineRange);
            } else {
              text = blockser.serialize(curBlock, "markdown");
              html = blockser.serialize(curBlock, "html");
              json = blockser.serialize(curBlock, "json");
            }
          } else {
            text = blockser.serialize(curBlock, "markdown");
            html = blockser.serialize(curBlock, "html");
            json = blockser.serialize(curBlock, "json");
          }
        } else {
          text = blockser.serialize(curBlock, "markdown");
          html = blockser.serialize(curBlock, "html");
          json = blockser.serialize(curBlock, "json");
        }
      } else {
        text = blockser.serialize(curBlock, "markdown");
        html = blockser.serialize(curBlock, "html");
        json = blockser.serialize(curBlock, "json");
      }
      // single editable: copy inline content

      // multiple editable, mergable: copy editable with bound inline content

      // unmergeable: copy all
      return { text: text, html: html, json: json };
    });
    const markdown = data.map((item) => item.text).join("\n");
    const html = data.map((item) => item.html).join("");
    const json: OhNoClipboardData = {
      data: data.flatMap((item) => item.json),
    };

    e.clipboardData!.setData("text/plain", markdown);
    e.clipboardData!.setData("text/html", html);
    e.clipboardData!.setData("text/ohno", JSON.stringify(json));

    return true;
  }

  handlePaste(
    e: ClipboardEvent,
    context: MultiBlockEventContext
  ): void | boolean {
    const command = prepareDeleteMultiArea(this, context).build();
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
    const builder = prepareDeleteMultiArea(this, context).withLazyCommand(
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
    console.log("handleMouseUp", e, context.block);
    const { block, endBlock, range, page } = context;
    const startRoot = block.findEditable(range.startContainer)!;
    const endRoot = endBlock.findEditable(range.endContainer)!;
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

    page.rangeDirection = "next";
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
          if (!endBlock.mergeable) {
            extra["innerHTML"] = "";
            return;
          }
          const { endContainer } = extra;
          extra["innerHTML"] = endContainer.innerHTML;
          if (
            endBlock.isMultiEditable &&
            endBlock.getNextEditable(endContainer)
          ) {
            if (endBlock.mergeable) {
              return new ContainerRemove({
                block: endBlock,
                indexs: [0],
                page,
              });
            } else {
              return;
            }
          }
          return new BlockRemove({ block: endBlock, page });
        })
        .withLazyCommand(({ block, page }, extra) => {
          const { startContainer, innerHTML } = extra;
          const start = getTokenSize(startContainer);
          const index = block.getEditableIndex(startContainer);
          extra["start"] = start;
          extra["index"] = index;
          return new TextInsert({
            page,
            block,
            innerHTML,
            start,
            index,
          }).onExecute(({ block, start, index }) => {
            page.setLocation(block.getLocation(start, index)!, block);
          });
        });

      if (e.inputType === "insertText") {
        builder.withLazyCommand(({ block }, { start, index }) => {
          // const offset = block.getOffset(range);
          // if (range.startContainer instanceof HTMLLabelElement) {
          //   offset.start++;
          // }
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
        if (
          endBlock.isMultiEditable &&
          endBlock.getNextEditable(endContainer)
        ) {
          return new ContainerRemove({ block: endBlock, indexs: [0], page });
        }
        return new BlockRemove({ block: endBlock, page });
      })
      .withLazyCommand(({ block, page }, extra) => {
        const { startContainer, innerHTML } = extra;
        const insertOffset = {
          index: block.getEditableIndex(startContainer),
          start: getTokenSize(startContainer),
        };
        const start = getTokenSize(startContainer);
        const index = block.getEditableIndex(startContainer);
        extra["insertOffset"] = insertOffset;

        return new TextInsert({
          block,
          innerHTML,
          page,
          start,
          index,
        }).onExecute(({ block, start, index }) => {
          page.setLocation(block.getLocation(start, index)!, block);
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
