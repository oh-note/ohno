import { createElement, getDefaultRange } from "@/helper/document";
import {
  EventContext,
  Handler,
  KeyDispatchedHandler,
  dispatchKeyDown,
} from "@/system/handler";
import {
  FIRST_POSITION,
  LAST_POSITION,
  Offset,
  getTokenSize,
  locationToBias,
  offsetToRange,
  rangeToOffset,
  setOffset,
} from "@/system/position";
import {
  BlockCreate,
  BlockRemove,
  BlockReplace,
} from "@/contrib/commands/block";
import { ValidNode, outerHTML, parentElementWithTag } from "@/helper/element";
import { ListCommandBuilder } from "@/contrib/commands/concat";
import { TextDeleteSelection } from "@/contrib/commands/text";

import { OrderedList } from "./block";
import { AnyBlock } from "@/system/block";
import { ContainerInsert, ContainerRemove } from "@/contrib/commands/container";
import { addMarkdownHint } from "@/helper/markdown";
import { Paragraph } from "../paragraph";
import { FormatMultipleText } from "@/contrib/commands/format";
import { formatTags } from "@/system/format";
import { TextInsert } from "@/contrib/commands";
import { ListHandler, ListInit } from "../list";

export class OrderedListHandler extends ListHandler {
  name: string = "ordered_list";

  public get ListBlockType(): new (init?: ListInit | undefined) => any {
    return OrderedList;
  }

  public get listStyleTypes(): string[] {
    return ["decimal", "lower-alpha", "lower-roman"];
  }
}
