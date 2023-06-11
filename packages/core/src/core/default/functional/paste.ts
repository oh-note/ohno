import { PasteAll } from "@ohno-editor/core/contrib";
import {
  ListCommandBuilder,
  RichTextDelete,
  TextInsert,
} from "@ohno-editor/core/contrib/commands";
import {
  BlockCreate,
  BlocksCreate,
} from "@ohno-editor/core/contrib/commands/block";
import { outerHTML } from "@ohno-editor/core/helper/element";
import {
  InlineSerializedData,
  tokenBetweenRange,
} from "@ohno-editor/core/system";
import { OhNoClipboardData } from "@ohno-editor/core/system/base";
import {
  PagesHandleMethods,
  RangedBlockEventContext,
} from "@ohno-editor/core/system/handler";

export function defaultHandlePaste(
  handler: PagesHandleMethods,
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
    // 是自家数据
    ohnoData = JSON.parse(jsonStr) as OhNoClipboardData;
  } else {
    // 是别家数据
    const plugin = page.getPlugin<PasteAll>("pasteall");
    ohnoData = plugin.parse(clipboardData, context);
  }
  const { data } = ohnoData;

  const builder = new ListCommandBuilder({
    page,
    block,
  });

  const index = block.findEditableIndex(range.startContainer);
  const start = block.getBias([range.startContainer, range.startOffset]);
  builder.withLazyCommand(() => {
    if (range.collapsed) {
      return;
    }
    const token_number = tokenBetweenRange(range);
    return new RichTextDelete({
      page,
      block,
      index,
      start,
      token_number,
    });
  });

  data.forEach((item, index) => {
    if (item.type === "inline") {
      builder.withLazyCommand(() => {
        const nodes = page.inlineSerializer.deserialize(
          item as InlineSerializedData
        );
        const innerHTML = outerHTML(...nodes);

        return new TextInsert({ page, block, innerHTML, start, index });
      });
    } else {
      builder.withLazyCommand((_, extra) => {
        const newBlock = page.getBlockSerializer(item.type).deserialize(item);
        // console.log(newBlock);

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
      });
    }
  });

  const command = builder.build();

  page.executeCommand(command);

  return true;
}
