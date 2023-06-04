import {
  ListCommandBuilder,
  RichTextDelete,
  TextInsert,
} from "@ohno-editor/core/contrib/commands";
import { BlocksCreate } from "@ohno-editor/core/contrib/commands/block";
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
  if (jsonStr) {
    // 是自家数据
    const { data } = JSON.parse(jsonStr) as OhNoClipboardData;
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

    data.forEach((item) => {
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
          extra["block"] = newBlock;
          return new BlocksCreate({
            page,
            block,
            newBlocks: [newBlock],
            where: "after",
          });
        });
      }
    });

    const command = builder.build();

    page.executeCommand(command);
  } else {
    // 是别家数据
  }

  return true;
}
