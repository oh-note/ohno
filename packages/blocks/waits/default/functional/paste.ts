/**
 * there are three copy and three paste scenarios need to be considered:
 *
 * for copy, users can copy:
 * c1. multiple block with first and last is inline or block
 * c2. single full block
 * c3. copy inline
 *
 * for paste, users can paste with:
 * p1. multiple block selected
 * p2. have some selected in single block
 * p3. range collapsed
 *
 * finally we got 3*3 = 9 types need to be considered, however, there still have some space can be reduced:
 * 1. when paste single full block (c2), we just need to append block below current block (and after remove selection and make range collapsed)
 * 2. when paste multiple block with inline (c1), if current selected block is unmergeable, all data should be paste under this block (same as 1.)
 * 1. c1xp1: remove selection, but not merge, paste full block at middle, paste first in top block end, and last in bottom block head
 * 2. c1xp2: remove selection, then go 5.
 * 3. c1xp3: if mergeable -> commandSet.pasteSplit() else paste below this block, then paste
 * 4. c2xp1: paste below this block
 * 5. c2xp2: go 3.
 * 6. c2xp3: remove selection, then go
 * 7. c3xp1: remove selection -> try merge first and last -> paste inline at first
 * 8. c3xp2: remove selection -> try paste inline
 * 9. c3xp3: try paste inline
 */

import { PasteAll } from "../../../contrib";
import {
  removeEditableContentAfterLocation,
  removeSelectionInEditable,
} from "../../../contrib/commands";
import { BlockCreate } from "../../../contrib/commands/block";
import {
  PagesHandleMethods,
  RangedBlockEventContext,
  OhNoClipboardData,
  ListCommandBuilder,
  SplitExtra,
} from "../../../system/types";

/**
 * c1-3
 * p2, p3
 */
export function defaultHandlePaste(
  _: PagesHandleMethods,
  e: ClipboardEvent,
  context: RangedBlockEventContext
) {
  const { page, block, range } = context;

  const clipboardData = e.clipboardData;
  if (!clipboardData) {
    return true;
  }

  const jsonStr = clipboardData.getData("text/ohno") as any;
  let ohnoData: OhNoClipboardData;
  if (jsonStr) {
    // native data
    ohnoData = JSON.parse(jsonStr) as OhNoClipboardData;
  } else {
    // data from other source, need to be parsed
    const plugin = page.getPlugin<PasteAll>("pasteall");
    if (plugin) {
      ohnoData = plugin.parse(clipboardData, context);
    } else {
      return true;
    }
  }

  const builder = new ListCommandBuilder<RangedBlockEventContext, SplitExtra>(
    context
  );
  if (!range.collapsed) {
    // 1. remove selection
    if (block.findEditable(range.commonAncestorContainer)) {
      removeSelectionInEditable(builder);
    } else {
      block.commandSet.removeMultipleEditable?.(builder);
    }
  }
  if (block.mergeable) {
    const bias = block.getBias([range.startContainer, range.startOffset]);
    const index = block.findEditableIndex(range.startContainer);
    removeEditableContentAfterLocation(builder, { page, block, bias, index });
    block.commandSet.pasteSplit?.(builder as any);
  }

  const { data } = ohnoData;

  const isFullBlock = !data[0].head && !data[data.length - 1].tail;

  const createdBlocks = data.map((item, index) => {
    const newBlock = page.getBlockSerializer(item.type).deserialize(item);
    builder.addLazyCommandWithPayLoad(
      ({ page, block, newBlock }, extra) => {
        const refBlock = extra["block"] || block;
        extra["block"] = newBlock;
        const command = new BlockCreate({
          page,
          block: refBlock,
          newBlock,
          where: "after",
        });
        if (index === data.length - 1) {
          command.onExecute(({ page, newBlock }) => {
            page.setLocation(newBlock.getLocation(-1, -1)!);
          });
        }
        return command;
      },
      { page, block, newBlock }
    );
    return newBlock;
  });
  const command = builder.build();

  if (data[0].head && block.mergeable) {
    builder.addLazyCommand(() => {
      if (!createdBlocks[0].mergeable) {
        return;
      }
      const startBuilder = new ListCommandBuilder({
        ...context,
        nextBlock: createdBlocks[0],
      });
      createdBlocks[0].commandSet.deleteFromPrevBlockEnd?.(startBuilder);
      block.commandSet.deleteAtBlockEnd?.(startBuilder);
      return startBuilder.build();
    });
  }

  if (
    data[data.length - 1].tail &&
    createdBlocks[createdBlocks.length - 1].mergeable
  ) {
    builder.addLazyCommand(() => {
      const nextBlock = page.getNextBlock(
        createdBlocks[createdBlocks.length - 1]
      );
      if (!nextBlock || !nextBlock.mergeable) {
        return;
      }
      const endBuilder = new ListCommandBuilder({
        page,
        range,
        block: createdBlocks[createdBlocks.length - 1],
        nextBlock,
      });
      nextBlock.commandSet.deleteFromPrevBlockEnd?.(endBuilder);
      createdBlocks[createdBlocks.length - 1].commandSet.deleteAtBlockEnd?.(
        endBuilder
      );

      return endBuilder.build();
    });
  }

  page.executeCommand(command);

  return true;
}
