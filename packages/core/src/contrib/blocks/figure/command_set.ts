import {
  CommandSet,
  Dict,
  ListCommandBuilder,
} from "@ohno/core/system/types";
import { Figure } from "./block";
import {
  CommonPayLoad,
  MultiBlockPayLoad,
  MultiBlockExtra,
} from "@ohno/core/system/block/command_set";
import { BlockRemove } from "@ohno/core/contrib/commands";

export class FigureCommandSet implements CommandSet<Figure> {
  multiblockMergeWhenIsLast(
    builder: ListCommandBuilder<MultiBlockPayLoad, MultiBlockExtra>
  ): void {}

  multiblockMergeWhenIsFirst(
    builder: ListCommandBuilder<MultiBlockPayLoad, MultiBlockExtra>
  ): void {}

  multiblockPartSelectionRemove(
    builder: ListCommandBuilder<MultiBlockPayLoad, any>,
    option?: { isEnd?: boolean | undefined } | undefined
  ): void {
    const { isEnd } = option || {};
    builder.addLazyCommand(({ page, block, endBlock }) => {
      return new BlockRemove({ page, block: isEnd ? endBlock : block });
    });
  }
}