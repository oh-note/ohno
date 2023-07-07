import { BlocksCreate, BlockMove } from "@ohno-editor/core/contrib";
import { createRange } from "@ohno-editor/core/system/functional";
import {
  HandlerMethods,
  OhNoClipboardData,
  RangedBlockEventContext,
  ListCommandBuilder,
} from "@ohno-editor/core/system/types";
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
        builder.addLazyCommand((_, extra) => {
          const newBlock = page.getBlockSerializer(item.type).deserialize(item);
          extra["block"] = newBlock;
          return new BlocksCreate({
            page,
            block,
            newBlocks: [newBlock],
            where: "after",
          });
        });
      });

      return builder.build();
    } else {
      // eslint-disable-next-line no-debugger
      debugger;
    }
  }
}
