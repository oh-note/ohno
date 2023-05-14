import { RichTextDelete, TextInsert } from "@ohno-editor/core/contrib/commands";
import { BlocksCreate } from "@ohno-editor/core/contrib/commands/block";
import { outerHTML } from "@ohno-editor/core/helper/element";
import { OhNoClipboardData } from "@ohno-editor/core/system/base";
import { Handler, RangedEventContext } from "@ohno-editor/core/system/handler";

export function defaultHandlePaste(
  handler: Handler,
  e: ClipboardEvent,
  context: RangedEventContext
) {
  const { page, block, range } = context;
  const clipboardData = e.clipboardData;
  if (!clipboardData) {
    return true;
  }
  const jsonStr = clipboardData.getData("text/ohno") as any;
  if (jsonStr) {
    // 是自家数据
    const { data, head, tail, inline } = JSON.parse(
      jsonStr
    ) as OhNoClipboardData;

    if (inline) {
      const inlineNodes = page.inlineSerializer.deserialize(data);
      const innerHTML = outerHTML(...inlineNodes);
      const index = block.findEditableIndex(range.startContainer);
      const start = block.getBias([range.startContainer, range.startOffset]);
      const command = new TextInsert({ page, block, innerHTML, start, index });
      page.executeCommand(command);
      return true;
    }

    if (head) {
    }
    if (tail) {
    }

    const newBlocks = data.map((item) => {
      return page.createBlock(item.type as string, item.init);
    });
    const command = new BlocksCreate({
      page,
      block,
      newBlocks,
      where: "after",
    });

    page.executeCommand(command);
  } else {
    // 是别家数据
  }

  return true;
}
