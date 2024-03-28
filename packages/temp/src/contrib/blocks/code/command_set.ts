import {
  CommandSet,
  Dict,
  ListCommandBuilder,
} from "@ohno/core/system/types";
import { Code } from "./block";
import {
  InnerHTMLExtra,
  CommonPayLoad,
  MultiBlockPayLoad,
  MultiBlockExtra,
  SplitExtra,
} from "@ohno/core/system/block/command_set";
import { BlockRemove, TextInsert } from "@ohno/core/contrib/commands";

export class CodeCommandSet implements CommandSet<Code> {
  collapsedEnter(
    builder: ListCommandBuilder<CommonPayLoad<Code>, InnerHTMLExtra>
  ): void {}

  multiblockMergeWhenIsLast(
    builder: ListCommandBuilder<MultiBlockPayLoad, MultiBlockExtra>
  ): void {
    builder.addLazyCommand(({ page, endBlock }, extra) => {
      extra.innerHTML = endBlock.getFirstEditable().innerHTML;
      return new BlockRemove({ page, block: endBlock });
    });
  }

  multiblockMergeWhenIsFirst(
    builder: ListCommandBuilder<MultiBlockPayLoad, MultiBlockExtra>
  ): void {
    builder.addLazyCommand(({ page, block }, { innerHTML, prevent }) => {
      if (prevent) {
        return;
      }
      return new TextInsert({ page, block, index: -1, innerHTML, start: -1 });
    });
  }

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
