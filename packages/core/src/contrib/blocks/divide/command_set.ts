import {
  CommandSet,
  Dict,
  ListCommandBuilder,
} from "@ohno-editor/core/system/types";
import { Divide } from "./block";
import {
  BackspacePayLoad,
  InnerHTMLExtra,
  CommonPayLoad,
  DeletePayLoad,
  EditableExtra,
  MultiBlockPayLoad,
  MultiBlockExtra,
} from "@ohno-editor/core/system/block/command_set";
import {
  BlockCreate,
  BlockRemove,
  BlockReplace,
  TextInsert,
  removeEditableContentAfterLocation,
  removeEditableContentBeforeLocation,
} from "@ohno-editor/core/contrib/commands";
import { Paragraph } from "../paragraph";

export class DivideCommandSet implements CommandSet<Divide> {
  collapsedEnter(
    builder: ListCommandBuilder<CommonPayLoad<Divide>, InnerHTMLExtra>
  ): void {}
  deleteAtBlockEnd(
    builder: ListCommandBuilder<DeletePayLoad<Divide>, EditableExtra>
  ): void {}
  deleteAtEditableEnd?(
    builder: ListCommandBuilder<CommonPayLoad<Divide>, EditableExtra>
  ): void {}
  deleteFromPrevBlockEnd(
    builder: ListCommandBuilder<DeletePayLoad<Divide>, EditableExtra>
  ): void {}
  backspaceAtStart(
    builder: ListCommandBuilder<BackspacePayLoad<Divide>, EditableExtra>
  ): "connect" | "independent" {
    return "independent";
  }
  backspaceFromNextBlockStart(
    builder: ListCommandBuilder<BackspacePayLoad<Divide>, EditableExtra>
  ): void {}
  removeMultipleEditable(
    builder: ListCommandBuilder<CommonPayLoad<Divide>, any>
  ): void {}
  pasteSplit(builder: ListCommandBuilder<CommonPayLoad<Divide>, any>): void {}
  multiblockMergeWhenIsLast(
    builder: ListCommandBuilder<MultiBlockPayLoad, MultiBlockExtra>
  ): void {}
  multiblockMergeWhenIsFirst(
    builder: ListCommandBuilder<MultiBlockPayLoad, MultiBlockExtra>
  ): void {}
  multiblockPartSelectionRemove(
    builder: ListCommandBuilder<MultiBlockPayLoad, any>,
    option?: { isEnd?: boolean | undefined } | undefined
  ): void {}
}
