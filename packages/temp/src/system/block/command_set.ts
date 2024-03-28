import { AnyBlock, Page, ListCommandBuilder, Dict } from "../types";

export interface CommonPayLoad<T extends AnyBlock = AnyBlock> {
  page: Page;
  block: T;
  range: Range;
}

export interface LocationPayLoad<T extends AnyBlock = AnyBlock> {
  page: Page;
  block: T;
  bias: number;
  index: number;
}

export interface MultiBlockPayLoad {
  page: Page;
  block: AnyBlock;
  endBlock: AnyBlock;
  range: Range;
  blocks: AnyBlock[];
}

export interface MultiBlockExtra extends Dict {
  innerHTML: string;
  prevent?: boolean;
}

export interface DeletePayLoad<T extends AnyBlock = AnyBlock>
  extends CommonPayLoad<T> {
  nextBlock: AnyBlock;
}

export interface BackspacePayLoad<T extends AnyBlock = AnyBlock>
  extends CommonPayLoad<T> {
  prevBlock: AnyBlock;
}

export interface IndependentBackspacePayLoad<T extends AnyBlock = AnyBlock>
  extends CommonPayLoad<T> {}

export interface InnerHTMLExtra extends Dict {
  innerHTML: string;
}

export interface SplitExtra extends Dict {
  innerHTML: string;
  block: AnyBlock;
  endBlock: AnyBlock;
}

export interface EditableExtra extends Dict {
  editables: HTMLElement[];
}

/**
 * each pass should be called out of instance in handler or some other place.
 */
export interface CommandSet<T extends AnyBlock = AnyBlock> {
  /**
   * be called when range collpased and enter keydown event triggered at anywhere
   */
  collapsedEnter?(
    builder: ListCommandBuilder<CommonPayLoad<T>, InnerHTMLExtra>
  ): void;

  /**
   * be called when range collpased and paste event triggered.
   * block should be splited into two blocks, the upper part will insert start inline data at last, the second part will insert end inline data at first.
   *
   */
  pasteSplit?(
    builder: ListCommandBuilder<CommonPayLoad<T>, InnerHTMLExtra>
  ): void;

  /**
   * be called when range collpased and delete keydown event triggered at editable end
   */
  deleteAtBlockEnd?(
    builder: ListCommandBuilder<DeletePayLoad<T>, EditableExtra>
  ): void;

  /**
   * be called when range collpased and delete keydown event triggered at editable end
   */
  deleteAtEditableEnd?(
    builder: ListCommandBuilder<CommonPayLoad<T>, EditableExtra>
  ): void;

  /**
   * be called when range collpased and delete keydown event triggered at prev block end
   * should use prevBlock as the currrent block
   *
   *       nextBlock.deleteFromPrevEnd(builder)
   *
   * block|
   * nextBlock
   */
  deleteFromPrevBlockEnd?(
    builder: ListCommandBuilder<DeletePayLoad<T>, EditableExtra>
  ): void;

  /**
   * be called when range collpased and backspace keydown event triggered at editable start
   */
  backspaceAtStart?(
    builder: ListCommandBuilder<BackspacePayLoad<T>, EditableExtra>
  ): "connect" | "independent";

  /**
   * be called when range collpased and backspace keydown event triggered at next block start
   * should use nextBlock as the currrent block
   *       prevBlock.backspaceFromNextStart(builder)
   */
  backspaceFromNextBlockStart?(
    builder: ListCommandBuilder<BackspacePayLoad<T>, EditableExtra>
  ): void;

  /**
   * be called when selection covers multiple editable area
   */
  removeMultipleEditable?(builder: ListCommandBuilder<CommonPayLoad<T>>): void;

  /**
   * see doc of multiblockPartSelectionRemove
   */
  multiblockMergeWhenIsLast(
    builder: ListCommandBuilder<MultiBlockPayLoad, MultiBlockExtra>
  ): void;

  /**
   * see doc of multiblockPartSelectionRemove
   */
  multiblockMergeWhenIsFirst(
    builder: ListCommandBuilder<MultiBlockPayLoad, MultiBlockExtra>
  ): void;

  /**
   * be called in multiblock scene
   *
   * te[xt  <- multiblockPartSelectionRemove
   * text   <- Remove Block
   * te]xt  <- multiblockPartSelectionRemove (isEnd = true)
   *
   * after block/endBlock multiblockPartSelectionRemove function executed,
   * multiblockMergeWhenIsLast and multiblockMergeWhenIsFirst will be called in order.
   *
   * 1. block.multiblockPartSelectionRemove
   * 2. endBlock.multiblockPartSelectionRemove (isEnd = true)
   * 3. endBlock.multiblockMergeWhenIsLast  (prepare extra data or prevent merge)
   * 4. block.multiblockMergeWhenIsFirst (insert content from first block)
   */
  multiblockPartSelectionRemove(
    builder: ListCommandBuilder<MultiBlockPayLoad>,
    option?: { isEnd?: boolean }
  ): void;
}
