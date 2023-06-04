import {
  ListCommandBuilder,
  BlocksCreate,
  BlockRemove,
  BlockMove,
} from "@ohno-editor/core/contrib";
import { outerHTML } from "@ohno-editor/core/helper";
import {
  HandlerMethods,
  InlineSerializedData,
  OhNoClipboardData,
  RangedBlockEventContext,
  createRange,
} from "@ohno-editor/core/system";

export function handleInsertFromDrop(
  handler: HandlerMethods,
  e: TypedInputEvent,
  context: RangedBlockEventContext
) {
  const { page, block, range } = context;
  if (e.dataTransfer) {
    let content: string;

    if ((content = e.dataTransfer.getData("text/ohno"))) {
      const { data, context } = JSON.parse(content) as OhNoClipboardData;

      if (context && context.dragFrom) {
        const srcBlock = page.retrieveBlock(context.dragFrom);
        // directly move
        const startGlobalBias = block.getGlobalBiasPair([
          range.startContainer,
          range.startOffset,
        ]);
        const endGlobalBias = block.getGlobalBiasPair([
          range.endContainer,
          range.endOffset,
        ]);
        const command = new BlockMove({
          page,
          ref: block,
          order: context.dragFrom,
          where: "after",
        })
          .onExecute(() => {
            page.setLocation(srcBlock.getLocation(0, 0)!);
          })
          .onUndo(() => {
            const startLoc = block.getLocation(...startGlobalBias)!;
            const endLoc = block.getLocation(...endGlobalBias)!;
            page.setRange(createRange(...startLoc, ...endLoc));
          });
        return command;
      }

      const builder = new ListCommandBuilder({
        page,
        block,
      });

      data.forEach((item) => {
        if (item.type === "inline") {
          builder.withLazyCommand(() => {
            const nodes = page.inlineSerializer.deserialize(
              item as InlineSerializedData
            );
            const html = outerHTML(...nodes);
            // insert
          });
        } else {
          builder.withLazyCommand((_, extra) => {
            const newBlock = page
              .getBlockSerializer(item.type)
              .deserialize(item);
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

      return builder.build();
    } else {
      // eslint-disable-next-line no-debugger
      debugger;
    }
  }
}
