import { Command } from "../command";
import { AnyBlock } from "../types";
import { Page } from "./imp";

export interface PageEventInit {
  page: Page;
  undo?: boolean;
  from: string;
}
export class PageEvent implements PageEventInit {
  name: string;
  readonly from!: string;
  readonly type!: string;
  readonly page!: Page;
  constructor(name: string, init: PageEventInit) {
    this.name = name;
    Object.assign(this, init);
  }
  stopPropagation() {}
  preventDefault() {}
}

export interface BlockUpdateInit extends PageEventInit {
  block: AnyBlock;
  range?: Range;
}

export class BlockUpdateEvent extends PageEvent implements BlockUpdateInit {
  readonly block: AnyBlock;
  readonly range: Range | undefined;
  readonly from: string;
  constructor(init: BlockUpdateInit) {
    super("BlockUpdate", init);
    this.block = init.block;
    this.range = init.range;
    this.from = init.from;
  }
}

export interface BlockActiveInit extends PageEventInit {
  block: AnyBlock;
  range?: Range;
}

export class BlockActiveEvent extends PageEvent implements BlockActiveInit {
  readonly block: AnyBlock;
  readonly range?: Range | undefined;
  readonly from: string;
  constructor(init: BlockActiveInit) {
    super("BlockActive", init);
    this.block = init.block;
    this.range = init.range;
    this.from = init.from;
  }
}

export interface BlockDeActiveInit extends PageEventInit {
  block: AnyBlock;
  to?: AnyBlock;
  range?: Range;
}

export class BlockDeActiveEvent extends PageEvent implements BlockDeActiveInit {
  readonly block: AnyBlock;
  readonly range?: Range | undefined;
  readonly from: string;
  readonly to?: AnyBlock | undefined;
  constructor(init: BlockDeActiveInit) {
    super("BlockDeActive", init);
    this.block = init.block;
    this.to = init.to;
    this.range = init.range;
    this.from = init.from;
  }
}

export interface BlockSelectChangeInit extends PageEventInit {
  block: AnyBlock;
  endBlock?: AnyBlock;
  range: Range;
}

export class BlockSelectChangeEvent
  extends PageEvent
  implements BlockSelectChangeInit
{
  readonly block: AnyBlock;
  readonly endBlock?: AnyBlock;

  readonly range: Range;
  readonly from: string;

  constructor(init: BlockSelectChangeInit) {
    super("BlockSelectChange", init);
    this.block = init.block;
    this.range = init.range;
    this.endBlock = init.endBlock;
    this.from = init.from;
  }
}

export interface BlockInvalideLocationInit extends PageEventInit {
  block: AnyBlock;
  endBlock?: AnyBlock;
  range: Range;
}

export class BlockInvalideLocationEvent
  extends PageEvent
  implements BlockInvalideLocationInit
{
  readonly block: AnyBlock;

  readonly range: Range;
  readonly from: string;

  constructor(init: BlockInvalideLocationInit) {
    super("BlockInvalideLocation", init);
    this.block = init.block;
    this.range = init.range;
    this.from = init.from;
  }
}

export interface PageCommandInit extends PageEventInit {
  command: Command<any>;
  range?: Range | null;
  block: AnyBlock;
}

export class PageUndoEvent extends PageEvent implements PageCommandInit {
  readonly range?: Range | null;
  readonly from: string;
  readonly block: AnyBlock;
  command: Command<any>;

  constructor(init: PageCommandInit) {
    super("BlockInvalideLocation", init);
    this.command = init.command;
    this.block = init.block;
    this.range = init.range;
    this.from = init.from;
  }
}

export class PageRedoEvent extends PageEvent implements PageCommandInit {
  readonly command: Command<any>;
  readonly range?: Range | null;
  readonly from: string;
  readonly block: AnyBlock;

  constructor(init: PageCommandInit) {
    super("BlockInvalideLocation", init);
    this.command = init.command;
    this.block = init.block;
    this.range = init.range;
    this.from = init.from;
  }
}
