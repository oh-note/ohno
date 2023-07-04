// 事件系统可以处理的事件的定义
// import { IInline } from "./base";
import { AnyBlock, IInline } from "../types";
import { Page } from "../types";
import {
  BlockActiveEvent,
  BlockDeActiveEvent,
  BlockInvalideLocationEvent,
  BlockSelectChangeEvent,
  BlockUpdateEvent,
  PageRedoEvent,
  PageUndoEvent,
} from "../types";

export interface PageEventContext {
  page: Page;
}

export interface BlockEventContext {
  page: Page;
  block: AnyBlock;
  endBlock?: AnyBlock;
  range?: Range;
  isMultiBlock?: boolean;
}

export interface RangedBlockEventContext extends BlockEventContext {
  range: Range;
}

export interface InlineEventContext<T = IInline> extends BlockEventContext {
  inline: HTMLLabelElement;
  manager: T;
}
export interface InlineRangedEventContext<T = IInline>
  extends RangedBlockEventContext {
  inline: HTMLLabelElement;
  manager: T;
}

export interface MultiBlockEventContext extends BlockEventContext {
  // page: Page;
  // block: IBlock;
  isMultiBlock: boolean;
  endBlock: AnyBlock;
  range: Range;
  blocks: AnyBlock[];
}
