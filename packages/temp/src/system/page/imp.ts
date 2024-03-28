import { createOrderString } from "../../helper";
import { DictNode, LinkedDict } from "../../struct";
import { ROOT_CLASS } from "../config";

import {
  BlockActiveEvent,
  BlockDeActiveEvent,
  BlockSelectChangeEvent,
  PageEvent,
  PageRedoEvent,
  PageUndoEvent,
} from "./events";
import {
  BlockComponent,
  Component,
  InlineComponent,
  PluginComponent,
} from "./component";
import { HandlerEntry, PageHandler } from "./handler";
import { IPage } from "./interface";

import {
  InlineSerializer,
  IShortcut,
  ShortCutManager,
  AnyBlock,
  Block,
  BlockData,
  BlockSerializer,
  History,
  Command,
  IPlugin,
  BlockQuery,
  RefLocation,
  Order,
  CommandSet,
} from "../types";

import {
  isActivate,
  markActivate,
  removeActivate,
  removeSelect,
} from "../status";

import {
  createElement,
  createRange,
  setLocation,
  setRange,
  tryGetDefaultRange,
  isParent,
  scrollIntoViewIfNeeded,
} from "../functional";

export interface PageInit {
  components?: {
    blocks?: BlockComponent<any>[];
    plugins?: PluginComponent[];
    inlines?: InlineComponent[];
    extraHandlers?: HandlerEntry[];
  };
  blocks?: AnyBlock[];
  config?: { [key: string]: any };
}

export class Page implements IPage {
  chain: LinkedDict<string, AnyBlock> = new LinkedDict();
  selected: Set<string>;
  active?: AnyBlock;
  // activeInline?: HTMLLabelElement;
  hover?: AnyBlock;
  outer: HTMLElement;
  inner: HTMLElement;
  pluginRoot: HTMLElement;
  pluginManagers: { [key: string]: IPlugin } = {};
  rangeDirection: "prev" | "next" | undefined;
  selectionMode: "block" | "text" = "text";
  supportedBlocks: { [key: string]: BlockComponent } = {};
  defaultBlockName!: string;
  supportedInlines: { [key: string]: InlineComponent } = {};
  pageHandler: PageHandler;
  history: History;

  shortcut: IShortcut;

  inlineSerializerV2: InlineSerializer;

  constructor(init?: PageInit) {
    this.selected = new Set();
    // this.active
    this.outer = createElement("div", { className: "oh-is-root" });
    this.inner = createElement("article", { className: ROOT_CLASS });
    this.inner.contentEditable = "true";
    this.pluginRoot = createElement("div", { className: "oh-is-plugins" });
    this.outer.append(this.pluginRoot, this.inner);
    this.pageHandler = new PageHandler(this);
    this.pageHandler.bindEventListener(this.inner);
    const { components, blocks } = init || {};
    this.history = new History(this, { max_history: 200 });

    this.inlineSerializerV2 = new InlineSerializer();
    const pageCreatedListener: Component["onPageCreated"][] = [];
    if (components) {
      const { blocks, plugins, inlines, extraHandlers } = components;
      if (blocks) {
        // blocks
        let hasDefaultBlock = false;
        blocks.forEach((item) => {
          this.pageHandler.registerHandlers(item.handlers || {});
          this.supportedBlocks[item.name] = item;
          item.serializer.setPage(this);
          if (item.isDefault) {
            this.defaultBlockName = item.name;
            hasDefaultBlock = true;
          }
          item.onPageCreated && pageCreatedListener.push(item.onPageCreated);
        });
        if (!hasDefaultBlock) {
          throw Error("Must have one block be default.");
        }
      }
      if (plugins) {
        plugins.forEach((item) => {
          item.manager.setParent(this);
          this.pluginManagers[item.manager.name] = item.manager;
          this.pluginRoot.appendChild(item.manager.root);
          this.pageHandler.registerHandlers(item.handlers || {});
          item.onPageCreated && pageCreatedListener.push(item.onPageCreated);
        });
      }
      if (inlines) {
        inlines.forEach((item) => {
          this.pageHandler.registerHandlers(item.handlers || {});
          this.supportedInlines[item.name] = item;
          this.inlineSerializerV2.registerLabelSerializer(
            item.name,
            item.serializer!
          );
          item.onPageCreated && pageCreatedListener.push(item.onPageCreated);
        });
      }
      if (extraHandlers) {
        extraHandlers.forEach((item) => {
          this.pageHandler.registerHandlers(item);
          item.onPageCreated && pageCreatedListener.push(item.onPageCreated);
        });
      }
    }
    this.shortcut = new ShortCutManager();
    if (blocks) {
      blocks.forEach((item) => {
        this.appendBlock(item);
      });
      this.setActivate(blocks[0]);
    } else {
      this.appendBlock(this.createDefaultBlock());
    }

    pageCreatedListener.forEach((item) => {
      item!(this);
    });
    new Event("PluginLoaded", { cancelable: false });
  }

  public get root(): HTMLElement {
    return this.outer;
  }

  public get blockRoot(): HTMLElement {
    return this.inner;
  }

  toggleSelectionMode(selectionMode: Page["selectionMode"]) {
    this.selectionMode = selectionMode;
    if (selectionMode === "block") {
      if (this.active) {
        this.toggleSelect(this.active);
      }
    } else {
      this.clearSelect();
    }
  }

  dispatchPageEvent(pageEvent: PageEvent) {
    this.pageHandler.dispatchPageEvent(pageEvent);
  }

  executeCommand(command: Command<any>, executed?: boolean | undefined): void {
    this.history.execute(command, executed);
  }

  undoCommand(): boolean {
    const res = this.history.undo();
    if (res) {
      const command = this.history.undo_commands.last!.value;
      this.dispatchPageEvent(
        new PageUndoEvent({
          command,
          page: this,
          block: this.active!,
          range: tryGetDefaultRange(),
          from: "Page",
        })
      );
    }
    return res;
  }

  redoCommand(): boolean {
    const res = this.history.redo();
    if (res) {
      const command = this.history.commands.last!.value;
      this.dispatchPageEvent(
        new PageRedoEvent({
          command,
          page: this,
          block: this.active!,
          range: tryGetDefaultRange(),
          from: "Page",
        })
      );
    }
    return res;
  }

  render(root: HTMLElement): void {
    root.innerHTML = "";
    root.appendChild(this.root);
  }
  reverseRender(callback: (root: HTMLElement) => void): void {
    callback(this.root);
  }

  setHover(block?: AnyBlock | undefined): void {
    if (this.hover === block) {
      return;
    }
    if (this.hover) {
      // TODO unhover;
    }
    if (block) {
      // TODO hover class;
      this.hover = block;
    }
  }

  /** activated 意味着光标（range）已经在对应的 HTMLElement 内了 */
  setActivate(block?: AnyBlock | undefined): void {
    // debugger;
    if (this.active !== undefined) {
      if (this.active === block && isActivate(this.active.root)) {
        return;
      }
    }
    if (this.active) {
      removeActivate(this.active.root);
      this.dispatchPageEvent(
        new BlockDeActiveEvent({
          block: this.active,
          page: this,
          from: "Page",
          to: block,
        })
      );
    }
    if (block) {
      markActivate(block.root);
      this.pageHandler.dispatchPageEvent(
        new BlockActiveEvent({ block, page: this, from: "Page" })
      );
    }
    this.active = block;
  }

  toggleSelect(flag: BlockQuery): void {
    let target;
    if ((target = this.query(flag))) {
      if (this.selected.has(target.order)) {
        removeActivate(target.root);
        this.selected.delete(target.order);
      } else {
        markActivate(target.root);
        this.selected.add(target.order);
      }
    }
    // this.pageHandler.handleBlockSelected
  }
  toggleAllSelect(): void {
    let node = this.chain.first!;
    while (node) {
      this.toggleSelect(node.value);
      node = node.next!;
    }
  }
  clearSelect(): void {
    this.selected.forEach((item) => {
      // TODO remove selection class attr
    });
    this.selected.clear();
  }

  query(flag: BlockQuery): AnyBlock | null {
    if (typeof flag === "string") {
      const res = this.chain.find(flag);
      if (res) {
        return res[0];
      }
    } else {
      const latest = this.chain.find(flag.order);
      if (latest) {
        return latest[0];
      }
    }
    return null;
  }
  private denode(
    res: [AnyBlock, DictNode<string, AnyBlock>] | null
  ): AnyBlock | null {
    if (!res) {
      return null;
    }
    return res[0];
  }

  createDefaultBlock<T = AnyBlock, I extends BlockData = BlockData>(data?: I) {
    return new this.supportedBlocks[this.defaultBlockName].blockType(data) as T;
  }
  createBlock<T = AnyBlock, I extends BlockData = BlockData>(
    type: string,
    data?: I
  ): T {
    return new this.supportedBlocks[type].blockType(data) as T;
  }

  getBlockSerializer<T extends Block = AnyBlock>(
    name: string
  ): BlockSerializer<T> {
    return this.supportedBlocks[name].serializer as BlockSerializer<T>;
  }
  getBlockCommandSet<T extends Block = AnyBlock>(name: string): CommandSet<T> {
    return this.supportedBlocks[name].commandSet! as unknown as CommandSet<T>;
  }

  getPlugin<T = IPlugin>(name: string): T {
    if (!this.pluginManagers[name]) {
      throw new Error(`plugin ${name} not found.`);
    }
    return this.pluginManagers[name] as T;
  }

  getNextBlock(flag: BlockQuery): AnyBlock | null {
    let target;
    if ((target = this.query(flag))) {
      return this.denode(this.chain.next(target.order));
    }
    return null;
  }
  getPrevBlock(flag: BlockQuery): AnyBlock | null {
    let target;
    if ((target = this.query(flag))) {
      return this.denode(this.chain.previous(target.order));
    }
    return null;
  }
  getFirstBlock(): AnyBlock {
    return this.chain.first!.value;
  }
  getLastBlock(): AnyBlock {
    return this.chain.getLast()[0];
  }
  private removeBlockStatus(block: AnyBlock) {
    removeActivate(block.root);
    removeSelect(block.root);
  }

  _initBlock(newBlock: AnyBlock) {
    newBlock.setParent(this);
    if (!newBlock.root) {
      newBlock.initialize();
    }
    this.removeBlockStatus(newBlock);
  }

  appendBlock(newBlock: AnyBlock): string {
    this._initBlock(newBlock);
    const oldLast = this.getLastBlock();
    if (oldLast) {
      newBlock.setOrder(createOrderString(oldLast.order));
    } else {
      newBlock.setOrder(createOrderString());
    }
    this.chain.append(newBlock.order, newBlock);
    this.blockRoot.appendChild(newBlock.root);
    // newBlock
    return newBlock.order;
  }

  insertBlockAdjacent(
    newBlock: AnyBlock,
    where: "after" | "before",
    flag?: BlockQuery | undefined
  ): string {
    let target;
    if (!flag) {
      if (where === "after") {
        // 默认如果 flag === undefined && where === 'after 为插入到最后面
        return this.appendBlock(newBlock);
      } else {
        target = this.getFirstBlock();
      }
    } else {
      target = this.query(flag);
    }

    if (target) {
      if (where === "after") {
        const next = this.getNextBlock(target);
        if (!next) {
          return this.appendBlock(newBlock);
        } else {
          this._initBlock(newBlock);
          newBlock.setOrder(createOrderString(target.order, next.order));
          target.root.insertAdjacentElement("afterend", newBlock.root);
          this.chain.insertAfter(target.order, newBlock.order, newBlock);
          return newBlock.order;
        }
      } else {
        const prev = this.getPrevBlock(target);
        const prevOrder = prev ? prev.order : "";
        this._initBlock(newBlock);
        newBlock.setOrder(createOrderString(prevOrder, target.order));
        target.root.insertAdjacentElement("beforebegin", newBlock.root);
        this.chain.insertBefore(target.order, newBlock.order, newBlock);
        return newBlock.order;
      }
    }

    throw new Error("Block not found.");
  }

  removeBlock(flag: BlockQuery): AnyBlock {
    if (typeof flag !== "string") {
      flag = flag.order;
    }
    const result = this.chain.pop(flag);
    if (!result) {
      throw new Error("Block not found.");
    }

    const [tgt, _] = result;
    this.removeBlockStatus(tgt);
    tgt.setOrder("");
    tgt.setParent();
    tgt.root.remove();
    return tgt;
  }

  replaceBlock(newBlock: AnyBlock, flag: BlockQuery): AnyBlock {
    if (typeof flag !== "string") {
      flag = flag.order;
    }
    const result = this.chain.find(flag);
    if (!result) {
      throw new Error("Block not found.");
    }

    const [tgt, node] = result;
    this._initBlock(newBlock);
    newBlock.setOrder(tgt.order);
    tgt.setParent();
    tgt.root.insertAdjacentElement("afterend", newBlock.root);
    tgt.root.remove();
    node.value = newBlock;
    return tgt;
  }

  focusEditable(callback?: (e: Event) => void) {
    if (callback) {
      this.blockRoot.addEventListener(
        "focus",
        (e) => {
          callback(e);
        },
        { once: true }
      );
    }
    this.blockRoot.focus({ preventScroll: true });
  }

  detach(): void {
    this.root.remove();
  }

  setMode(mode: "block" | "text"): void {
    this.selectionMode = mode;
  }
  setDirection(dir?: "prev" | "next"): void {
    this.rangeDirection = dir;
  }

  attach(ref: HTMLElement): void {
    throw new Error("Method not implemented.");
  }
  combine(start: string, end: string): void {
    throw new Error("Method not implemented.");
  }

  setLocation(loc: RefLocation, block?: AnyBlock) {
    setLocation(loc);
    if (!block) {
      block = this.findBlock(loc[0])!;
      if (!block) {
        throw new Error("Can not set location out of block");
      }
    }
    this.dispatchPageEvent(
      new BlockSelectChangeEvent({
        block,
        page: this,
        range: createRange(...loc),
        from: "Page",
      })
    );
    scrollIntoViewIfNeeded(loc[0], { block: "nearest" });
    this.setActivate(block);
  }

  setRange(range: Range, block?: AnyBlock) {
    setRange(range);
    scrollIntoViewIfNeeded(range.startContainer, {
      block: "nearest",
    });
    scrollIntoViewIfNeeded(range.endContainer, {
      block: "nearest",
    });
    const context = this.pageHandler.getContextFromRange(range);
    this.dispatchPageEvent(
      new BlockSelectChangeEvent({ ...context, from: "Page" })
    );
    block = block || context.block;
    if (block) {
      this.setActivate(block);
    }
  }

  retrieveBlock(order: Order): Block {
    return this.chain.find(order)![0];
  }
  findBlock(target: EventTarget | Node | null | undefined): AnyBlock | null {
    if (!target) {
      return null;
    }
    let el = target as HTMLElement;
    if (!isParent(el, this.blockRoot)) {
      return null;
    }
    while (el && (el.nodeType != 1 || !el.classList.contains("oh-is-block"))) {
      el = el.parentElement!;
    }
    if (el) {
      const block = this.chain.find(el.dataset["order"]!)![0];
      return block;
    }
    return null;
  }
}
