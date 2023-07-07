import { AnyBlock, IInline } from "../types";
import { Page } from "../types";

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
  isMultiBlock: boolean;
  endBlock: AnyBlock;
  range: Range;
  blocks: AnyBlock[];
}
