import {
  dispatchKeyEvent,
  getTokenSize,
  locationToBias,
  parentElementWithTag,
  prevValidSibling,
  formatTags,
  createRange,
} from "@ohno/core/system/functional";
import {
  BlockEventContext,
  RangedBlockEventContext,
  PagesHandleMethods,
  ValidNode,
  EditableInterval,
  InlineSupport,
  ListCommandBuilder,
  BackspacePayLoad,
} from "@ohno/core/system/types";

import { BlockReplace } from "@ohno/core/contrib/commands/block";

import { ABCList, List } from "./block";

import { Paragraph } from "../paragraph";
import { FormatMultipleText } from "@ohno/core/contrib/commands/format";

import {
  NodeInsert,
  TextDelete,
  TextInsert,
  removeSelectionInEditable,
  removeEditableContentAfterLocation,
  removeSelectionInEditables,
} from "@ohno/core/contrib/commands";
import { Flag } from "../../inlines/flag/inline";
import { ListDentCommand } from "./command";

export class ListHandler implements PagesHandleMethods {
  handleKeyPress(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}

  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleCompositionStart(
    e: CompositionEvent,
    { range, page, block }: RangedBlockEventContext
  ): boolean | void {
    if (range.collapsed) {
      return;
    }

    const builder = new ListCommandBuilder({ page, block, range });
    if (block.findEditable(range.commonAncestorContainer)) {
      removeSelectionInEditable(builder);
    } else {
      block.commandSet.removeMultipleEditable?.(builder);
    }

    const command = builder.build();
    page.executeCommand(command);
    return true;
  }

  handleDeleteDown(
    e: KeyboardEvent,
    { page, block, range }: RangedBlockEventContext
  ): boolean | void {
    if (
      !range.collapsed ||
      !block.isLocationInRight([range.startContainer, range.startOffset])
    ) {
      // handled by beforeinput
      return;
    }
    const index = block.findEditableIndex(range.startContainer);
    if (index === block.getEditables().length - 1) {
      // last editable
      const nextBlock = page.getNextBlock(block);
      if (!nextBlock) {
        // do nothing
        return true;
      }

      if (!nextBlock.mergeable) {
        const newRange = createRange();
        newRange.selectNode(nextBlock.root);
        page.setRange(newRange);
        return true;
      }

      const builder = new ListCommandBuilder({ page, block, range, nextBlock });
      nextBlock.commandSet.deleteFromPrevBlockEnd?.(builder);
      block.commandSet.deleteAtBlockEnd?.(builder);
      const command = builder.build();
      page.executeCommand(command);
      return true;
    } else {
      const builder = new ListCommandBuilder({ page, block, range });
      block.commandSet.deleteAtEditableEnd?.(builder);
      const command = builder.build();
      page.executeCommand(command);
      return true;
    }
  }

  updateValue({ block }: BlockEventContext) {
    const containers = block.getEditables();
    const lvstack: number[] = [];
    containers.forEach((container, ind, arr) => {
      const level = parseFloat(container.dataset["level"] || "0");
      while (lvstack[level] === undefined) {
        lvstack.push(0);
      }
      while (level < lvstack.length - 1) {
        lvstack.pop();
      }
      lvstack[level]++;
      container.dataset["value"] = lvstack[level] + "";
      // this.updateLi(container, null, ind, lvstack[level]);
    });
  }

  indent(context: RangedBlockEventContext, add: boolean = true) {
    const { page, block, range } = context;
    const typedblock = block as List;
    const indexs = [];
    const startIndex = block.findEditableIndex(range.startContainer);
    if (range.collapsed) {
      indexs.push(startIndex);
    } else {
      const endIndex = block.findEditableIndex(range.endContainer);
      for (let i = startIndex; i <= endIndex; i++) {
        indexs.push(i);
      }
    }

    const command = new ListDentCommand({
      page,
      block: typedblock,
      indexs,
      bias: add ? 1 : -1,
    });

    page.executeCommand(command);
  }

  handleTabDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    this.indent(context, !e.shiftKey);
    return true;
  }

  handleBackspaceDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { block, page, range } = context;
    if (
      !range.collapsed ||
      !block.isLocationInLeft([range.startContainer, range.startOffset])
    ) {
      return;
    }
    //  - |text
    // 1. try to de-indent
    const typedBlock = block as ABCList;
    const container = block.findEditable(range.startContainer)!;
    const level = typedBlock.getIndentLevel(container);
    if (level > 0) {
      this.indent(context, false);
      return true;
    }
    // 2. split
    const builder = new ListCommandBuilder({
      page,
      block,
      range,
    } as BackspacePayLoad);
    block.commandSet.backspaceAtStart!(builder);
    const command = builder.build();
    page.executeCommand(command);
    return true;
  }

  handleEnterDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page, block, range } = context;

    if (block.findEditable(range.commonAncestorContainer)) {
      // if range in single list item.
      const builder = new ListCommandBuilder(context);
      removeSelectionInEditable(builder);
      const bias = block.getBias([range.startContainer, range.startOffset]);
      const index = block.findEditableIndex(range.startContainer);
      removeEditableContentAfterLocation(builder, { page, block, bias, index });

      block.commandSet.collapsedEnter?.(builder);
      const command = builder.build();
      page.executeCommand(command);
      return true;
    } else {
      // if range covered multiple list items.
      const builder = new ListCommandBuilder(context);
      // delete content of first and last item, and remove empty(middle) list item
      removeSelectionInEditables(builder, builder.payload, true);
      const command = builder.build();
      page.executeCommand(command);
      return true;
    }
  }

  handleBeforeInput(
    e: TypedInputEvent,
    context: BlockEventContext
  ): boolean | void {
    const { block, page, range } = context;
    if (!range) {
      throw new NoRangeError();
    }

    // 检测是否跨 Container
    if (block.findEditable(range.commonAncestorContainer)) {
      // 1. try insert TODO flag
      if (
        e.inputType === "insertText" &&
        range.collapsed &&
        range.startOffset == 1 &&
        block.getBias([range.startContainer, range.startOffset]) === 1 &&
        range.startContainer.textContent![0].match(/[[【]/) &&
        e.data!.match(/[】\]]/) &&
        !prevValidSibling(range.startContainer)
      ) {
        const plugin = page.getPlugin<InlineSupport>("inlinesupport");
        const manager = plugin.getInlineManager<Flag>("flag");
        const node = manager.create({
          first: "TODO",
          constrain: ["DONE", "TODO"],
        });
        const index = block.findEditableIndex(range.startContainer);
        const command = new ListCommandBuilder({
          block,
          page,
          node,
          bias: 1,
          index,
        })
          .addLazyCommand(({ page, block, index }) => {
            return new TextDelete({
              page,
              block,
              start: 1,
              index,
              token_number: -1,
            });
          })
          .addLazyCommand(({ page, block, index, node }) => {
            return new NodeInsert({
              page,
              block,
              index,
              start: 0,
              node,
            }).onExecute(({ page }, { current }) => {
              page.setLocation(block.getLocation(2, index)!);
            });
          })
          .build();
        page.executeCommand(command);
        // 删除 [ 并插入 Flag
        return true;
      }

      return;
    }

    const startLi = block.findEditable(range.startContainer);
    const endLi = block.findEditable(range.endContainer);
    if (!startLi || !endLi) {
      const newBlock = new Paragraph();
      const command = new BlockReplace({ page, block, newBlock });
      page.executeCommand(command);
      return true;
    }

    const offsets: EditableInterval[] = [];

    let offset: EditableInterval;
    for (
      let i = block.getEditableIndex(startLi), li = startLi;
      ;
      i++, li = li.nextElementSibling as HTMLElement
    ) {
      if (li === startLi) {
        offset = {
          start: locationToBias(
            li,
            range.startContainer as ValidNode,
            range.startOffset
          ),
          end: getTokenSize(li),
          index: i,
        };
      } else if (li === endLi) {
        offset = {
          start: 0,
          end: locationToBias(
            li,
            range.endContainer as ValidNode,
            range.endOffset
          ),
          index: i,
        };
      } else {
        offset = {
          start: 0,
          end: getTokenSize(li),
          index: i,
        };
      }
      offsets.push(offset);
      if (li === endLi) {
        break;
      }
    }

    let command;
    const globalStart = block.getGlobalBiasPair([
      range.startContainer,
      range.startOffset,
    ]);
    const globalEnd = block.getGlobalBiasPair([
      range.endContainer,
      range.endOffset,
    ]);
    // const blockOffset = block.getGlobalOffset(range);
    if (
      e.inputType === "formatBold" ||
      e.inputType === "formatItalic" ||
      e.inputType === "formatUnderline"
    ) {
      const format = formatTags[e.inputType]!;
      command = new FormatMultipleText({
        areas: offsets.map((item) => {
          return {
            block: block,
            offset: item,
          };
        }),
        page,
        format,
      })
        .onExecute(
          ({ areas }, { areas: _, op }: FormatMultipleText["buffer"]) => {
            let { block, offset } = areas[0];
            const startLoc = block.getLocation(offset.start, offset.index)!;
            block = areas[areas.length - 1].block;
            offset = areas[areas.length - 1].offset;

            let endLoc = block.getLocation(
              offset.end + (op === "removeFormat" ? -1 : 0),
              offset.index
            )!;
            if (!endLoc) {
              endLoc = block.getLocation(-1, offset.index)!;
            }

            page.setRange(createRange(...startLoc, ...endLoc));
          }
        )
        .onUndo(() => {
          const startLoc = block.getLocation(...globalStart)!;
          const endLoc = block.getLocation(...globalEnd)!;
          const range = createRange(...startLoc, ...endLoc);
          page.setRange(range);
        });
    } else {
      // 下面这些都是要先把选中内容删干净，即跨 Container 的删除

      const builder = new ListCommandBuilder({ page, block, range });
      block.commandSet.removeMultipleEditable?.(builder);

      if (e.inputType === "insertText") {
        builder.addLazyCommand(({ page, block }) => {
          // insertOffset: { ...offsets[0], end: undefined },
          const { start, index } = offsets[0];
          return new TextInsert({
            page,
            block,
            innerHTML: e.data as string,
            start,
            index,
          });
        });

        command = builder.build();
      } else if (e.inputType === "insertFromPaste") {
        command = builder.build();
      } else if (
        e.inputType === "deleteContentBackward" ||
        e.inputType === "deleteContentForward" ||
        e.inputType === "deleteSoftLineBackward" ||
        e.inputType === "deleteWordBackward" ||
        e.inputType === "deleteWordForward"
      ) {
        command = builder.build();
      } else {
        return true;
      }
    }
    if (command) {
      page.executeCommand(command);
    }

    return true;
  }

  handleCopy(
    e: ClipboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
}
