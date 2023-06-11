import {
  BlockEventContext,
  PagesHandleMethods,
  HandlerMethod,
  HandlerMethods,
  MultiBlockEventContext,
  RangedBlockEventContext,
} from "./handler";
import { createOrderString } from "@ohno-editor/core/helper/string";
import { DictNode, LinkedDict } from "@ohno-editor/core/struct/linkeddict";
import { AnyBlock, Block, BlockData, BlockSerializer } from "./block";
import { ROOT_CLASS } from "./config";
import {
  createElement,
  getDefaultRange,
  scrollIntoViewIfNeeded,
  tryGetDefaultRange,
} from "@ohno-editor/core/helper/document";
import {
  BlockQuery,
  IComponent,
  IContainer,
  IInline,
  IPage,
  IPlugin,
  Order,
} from "./base";
import { History, Command } from "./history";
import { Paragraph } from "@ohno-editor/core/contrib/blocks";
import {
  BlockActiveEvent,
  BlockDeActiveEvent,
  BlockInvalideLocationEvent,
  BlockSelectChangeEvent,
  BlockUpdateEvent,
  PageEvent,
  PageRedoEvent,
  PageUndoEvent,
} from "./pageevent";
import {
  RefLocation,
  createRange,
  getValidAdjacent,
  setLocation,
  setRange,
} from "./range";
import { throttle } from "@ohno-editor/core/helper/lodash";
import { isParent } from "../helper";
import { IShortcut, ShortCutManager } from "./shortcut";
import {
  isActivate,
  markActivate,
  removeActivate,
  removeSelect,
} from "../helper/status";
import { InlineSerializer } from "./inline";

export class PageHandler {
  pluginHandlers: PagesHandleMethods[] = [];
  multiBlockHandlers: PagesHandleMethods[] = [];
  beforeBlockHandlers: PagesHandleMethods[] = [];
  blockHandlers: { [key: string]: PagesHandleMethods[] } = {};
  globalHandlers: PagesHandleMethods[] = [];
  inlineHandler: { [key: string]: PagesHandleMethods[] } = {};
  // handlers: Handler[] = [];
  // afterHandlers: { [key: string]: Handler[] } = {};

  mouseEnteredBlock?: AnyBlock;
  page: Page;
  constructor(page: Page) {
    this.page = page;
    this.handleMouseMove = throttle(this.handleMouseMove, 100).bind(this);
  }

  private deflag(entry: HandlerFlag): PagesHandleMethods[] {
    if (entry === undefined) {
      return [];
    }
    if (Array.isArray(entry)) {
      return entry;
    }
    return [entry];
  }

  registerHandlers({
    plugins,
    multiblock,
    inlines,
    beforeBlock,
    global,
    blocks,
  }: HandlerEntry) {
    if (plugins) {
      this.deflag(plugins).forEach((item) => {
        this.pluginHandlers.push(item);
      });
    }
    if (multiblock) {
      this.deflag(multiblock).forEach((item) => {
        this.multiBlockHandlers.push(item);
      });
    }
    if (inlines) {
      for (const key in inlines) {
        this.inlineHandler[key] = this.inlineHandler[key] || [];
        this.deflag(inlines[key]).forEach((item) => {
          this.inlineHandler[key].push(item);
        });
      }
    }

    if (beforeBlock) {
      this.deflag(beforeBlock).forEach((item) => {
        this.beforeBlockHandlers.push(item);
      });
    }
    if (blocks) {
      for (const key in blocks) {
        this.blockHandlers[key] = this.blockHandlers[key] || [];
        this.deflag(blocks[key]).forEach((item) => {
          this.blockHandlers[key].push(item);
        });
      }
    }

    if (global) {
      this.deflag(global).forEach((item) => {
        this.globalHandlers.push(item);
      });
    }
  }

  removeEventListener(el: HTMLElement) {
    el.removeEventListener("copy", this.handleCopy.bind(this));
    el.removeEventListener("cut", this.handleCut.bind(this));
    el.removeEventListener("paste", this.handlePaste.bind(this));
    el.removeEventListener("blur", this.handleBlur.bind(this));
    el.removeEventListener("focus", this.handleFocus.bind(this));
    el.removeEventListener("keydown", this.handleKeyDown.bind(this));
    el.removeEventListener("keypress", this.handleKeyPress.bind(this));
    el.removeEventListener("keyup", this.handleKeyUp.bind(this));
    el.removeEventListener("mousedown", this.handleMouseDown.bind(this));

    // should be bind manully

    el.removeEventListener("mousemove", this.handleMouseMove.bind(this));
    el.removeEventListener("mouseenter", this.handleMouseEnter.bind(this));
    el.removeEventListener("mouseleave", this.handleMouseLeave.bind(this));
    el.removeEventListener("mouseup", this.handleMouseUp.bind(this));
    el.removeEventListener("click", this.handleClick.bind(this));
    el.removeEventListener("input", this.handleInput.bind(this));
    el.removeEventListener("contextmenu", this.handleContextMenu.bind(this));

    el.removeEventListener("beforeinput", this.handleBeforeInput.bind(this));

    el.removeEventListener(
      "compositionstart",
      this.handleCompositionStart.bind(this)
    );
    el.removeEventListener(
      "compositionupdate",
      this.handleCompositionUpdate.bind(this)
    );
    el.removeEventListener(
      "compositionend",
      this.handleCompositionEnd.bind(this)
    );
    return el;
  }

  bindEventListener(el: HTMLElement) {
    el.addEventListener("copy", this.handleCopy.bind(this));
    el.addEventListener("cut", this.handleCut.bind(this));
    el.addEventListener("paste", this.handlePaste.bind(this));
    el.addEventListener("blur", this.handleBlur.bind(this));
    el.addEventListener("focus", this.handleFocus.bind(this));
    el.addEventListener("keydown", this.handleKeyDown.bind(this));
    el.addEventListener("keypress", this.handleKeyPress.bind(this));
    el.addEventListener("keyup", this.handleKeyUp.bind(this));
    el.addEventListener("mousedown", this.handleMouseDown.bind(this));

    el.addEventListener("mousemove", this.handleMouseMove.bind(this));
    el.addEventListener("mouseenter", this.handleMouseEnter.bind(this));
    el.addEventListener("mouseleave", this.handleMouseLeave.bind(this));
    el.addEventListener("mouseup", this.handleMouseUp.bind(this));
    el.addEventListener("click", this.handleClick.bind(this));
    el.addEventListener("input", this.handleInput.bind(this));
    el.addEventListener("contextmenu", this.handleContextMenu.bind(this));
    el.addEventListener("beforeinput", this.handleBeforeInput.bind(this));
    el.addEventListener("drop", this.handleDrop.bind(this));

    el.addEventListener(
      "selectionchange",
      this.handleSelectionChange.bind(this)
    );
    el.addEventListener("select", this.handleSelect.bind(this));
    el.addEventListener("selectstart", this.handleSelectStart.bind(this));

    el.addEventListener(
      "compositionstart",
      this.handleCompositionStart.bind(this)
    );
    el.addEventListener(
      "compositionupdate",
      this.handleCompositionUpdate.bind(this)
    );
    el.addEventListener("compositionend", this.handleCompositionEnd.bind(this));
    return el;
  }

  _checkRangeInsideBlock(range: Range) {
    const neraestBlock = (
      container: Node,
      offset: number,
      end?: boolean
    ): AnyBlock => {
      if (
        container !== this.page.blockRoot &&
        !this.page.findBlock(container)
      ) {
        throw new Error("Not implemented.");
      }

      if (container.childNodes[offset]) {
        if (end) {
          return this.page.findBlock(container.childNodes[offset - 1])!;
        }
        return this.page.findBlock(container.childNodes[offset])!;
      } else {
        return this.page.getLastBlock();
      }
    };

    let block = this.page.findBlock(range.startContainer);
    if (!block) {
      const startBlock = neraestBlock(range.startContainer, range.startOffset);
      range.setStart(
        ...startBlock.selection.getValidAdjacent(startBlock.root, "afterbegin")
      );
    }

    block = this.page.findBlock(range.endContainer);
    if (!block) {
      const endBlock = neraestBlock(range.endContainer, range.endOffset, true);
      range.setEnd(
        ...endBlock.selection.getValidAdjacent(endBlock.root, "beforeend")
      );
    }
  }
  getContextFromRange(
    range: Range
  ): RangedBlockEventContext | MultiBlockEventContext {
    this._checkRangeInsideBlock(range);
    let blockContext = this.getContext(range.startContainer);

    if (!blockContext) {
      if (range.startContainer === this.page.blockRoot) {
        const blockEl = range.startContainer.childNodes[range.startOffset];
        blockContext = this.getContext(blockEl);
        if (blockContext) {
          range.setStart(blockEl, 0);
        }
      }
      if (!blockContext) {
        throw new Error("sanity check");
      }
    }
    const endBlock = range.collapsed
      ? undefined
      : this.findBlock(range.endContainer)!;

    blockContext.endBlock = endBlock;
    blockContext.range = range;

    if (endBlock && endBlock !== blockContext.block) {
      blockContext.isMultiBlock = true;
      const blocks = [blockContext.block];
      let cur = blockContext.block;
      while ((cur = this.page.getNextBlock(cur)!)) {
        blocks.push(cur);
        if (cur.order === endBlock.order) {
          break;
        }
      }
      // blockContext.blocks = blocks;
      return {
        ...blockContext,
        blocks,
      } as MultiBlockEventContext;
    }

    return blockContext as RangedBlockEventContext;
  }

  getContext(
    target: EventTarget | Node | null | undefined
  ): BlockEventContext | null {
    const block = this.page.findBlock(target);
    if (block) {
      return { block, page: this.page };
    }
    return null;
  }

  findBlock(target: EventTarget | Node | null | undefined): AnyBlock | null {
    return this.page.findBlock(target);
  }

  _dispatchEvent<K extends Event | PageEvent>(
    handlers: PagesHandleMethods[],
    context:
      | BlockEventContext
      | RangedBlockEventContext
      | MultiBlockEventContext,
    e: K,
    eventName: keyof HandlerMethods
  ) {
    for (let i = 0; i < handlers.length; i++) {
      const handler = handlers[i] as any;
      const method = handler[eventName] as HandlerMethod<K>;
      if (!method) {
        continue;
      }
      const res = method.call(handler, e, context);
      if (res) {
        console.log("Stoped", handler, eventName);
        e.stopPropagation();
        e.preventDefault();
        return true;
      }
    }
    return false;
  }

  dispatchEvent<K extends Event | PageEvent>(
    context: BlockEventContext,
    e: K,
    eventName: keyof HandlerMethods
  ): boolean {
    const { block, endBlock, range, isMultiBlock } = context;
    if (this._dispatchEvent(this.pluginHandlers, context, e, eventName)) {
      return true;
    }

    if (isMultiBlock) {
      if (!range || !endBlock) {
        throw new Error("Saniti check");
      }
      this._dispatchEvent(this.multiBlockHandlers, context, e, eventName);
      return true;
    }

    // Composition Enter down 的事件需要由 global Composition 阻塞
    if (this._dispatchEvent(this.beforeBlockHandlers, context, e, eventName)) {
      return true;
    }

    // Table 需要更早一步的接受 Arrow 事件
    if (block) {
      const blockHandlers = this.blockHandlers[block.type] || [];
      if (this._dispatchEvent(blockHandlers, context, e, eventName)) {
        return true;
      }
    }

    // beforeinput/copy 应该由 Block 优先，default / multiblock 兜底
    if (this._dispatchEvent(this.globalHandlers, context, e, eventName)) {
      return true;
    }

    return false;
  }

  handleCopy(e: ClipboardEvent): void | boolean {
    const blocks = this.getContextFromRange(getDefaultRange());
    if (!blocks.block) {
      return;
    }
    this.dispatchEvent<ClipboardEvent>(blocks, e, "handleCopy");
  }
  handleCut(e: ClipboardEvent): void | boolean {
    const blocks = this.getContextFromRange(getDefaultRange());
    if (!blocks.block) {
      return;
    }
    this.dispatchEvent<ClipboardEvent>(blocks, e, "handleCut");
  }

  handlePaste(e: ClipboardEvent): void | boolean {
    const blocks = this.getContextFromRange(getDefaultRange());
    if (!blocks.block) {
      return;
    }

    this.dispatchEvent<ClipboardEvent>(blocks, e, "handlePaste");
  }

  handleBlur(e: FocusEvent): void | boolean {
    const blocks = this.getContextFromRange(getDefaultRange());
    if (!blocks.block) {
      return;
    }
    console.log(e);
    this.dispatchEvent<FocusEvent>(blocks, e, "handleBlur");
  }

  handleFocus(e: FocusEvent): void | boolean {
    // TODO focus 从一个Page 移动到另一个 Page 时，selection 还是原来 Page 的，可能会出错
    // Focus 事件中应该去掉和 range、block 相关的信息，只保留 page
    const sel = document.getSelection();
    if (sel && sel.rangeCount > 0 && sel.anchorNode) {
      const range = sel.getRangeAt(0);
      const retrieve = this.retriveBlockFromRange(range);
      if (!retrieve) {
        // set default location
        return;
      }
      const context = this.getContextFromRange(range);
      const { block, focusNode: node } = retrieve;
      if (!block.findEditable(node)) {
        if (
          this.dispatchPageEvent(
            new BlockInvalideLocationEvent({
              page: this.page,
              block,
              range: context.range!,
              from: "mouseUp",
            }),
            context
          )
        ) {
          return;
        }
      }

      this.dispatchPageEvent(
        new BlockSelectChangeEvent({
          page: this.page,
          block,
          range: context.range!,
          from: "mouseUp",
        })
      );

      if (context) {
        this.dispatchEvent<FocusEvent>(context, e, "handleFocus");
      }
    }
  }

  handleKeyDown(e: KeyboardEvent): void | boolean {
    const context = this.getContextFromRange(getDefaultRange());
    if (!context.block) {
      return;
    }
    const { range, block } = context;
    if (range && range.collapsed) {
      if (!block.findEditable(range.commonAncestorContainer)) {
        if (
          this.dispatchPageEvent(
            new BlockInvalideLocationEvent({
              page: this.page,
              block,
              range: context.range!,
              from: "KeyDown",
            }),
            context
          )
        ) {
          return;
        }
      }
    }

    this.dispatchEvent<KeyboardEvent>(context, e, "handleKeyDown");
  }
  handleKeyPress(e: KeyboardEvent): void | boolean {
    const context = this.getContextFromRange(getDefaultRange());
    if (!context.block) {
      return;
    }
    this.dispatchEvent<KeyboardEvent>(context, e, "handleKeyPress");
  }
  handleKeyUp(e: KeyboardEvent): void | boolean {
    const context = this.getContextFromRange(getDefaultRange());
    if (!context.block) {
      return;
    }
    this.dispatchEvent<KeyboardEvent>(context, e, "handleKeyUp");
  }
  handleMouseDown(e: MouseEvent): void | boolean {
    const retrieve = this.retriveBlockFromMouse(e);

    if (!retrieve) {
      return;
    }
    const context: BlockEventContext = {
      block: retrieve.block,
      page: this.page,
      range: tryGetDefaultRange(),
    };

    this.dispatchEvent<MouseEvent>(context, e, "handleMouseDown");
  }
  handleMouseEnter(e: MouseEvent): void | boolean {
    const context = this.getContext(
      document.elementFromPoint(e.clientX, e.clientY)
    );
    if (!context) {
      return;
    }
    this.dispatchEvent<MouseEvent>(context, e, "handleMouseEnter");
  }
  handleMouseLeave(e: MouseEvent): void | boolean {
    const context = this.getContext(e.target);
    if (!context) {
      return;
    }
    this.dispatchEvent<MouseEvent>(context, e, "handleMouseLeave");
  }
  handleMouseMove(e: MouseEvent): void | boolean {
    const context =
      e.button === 1
        ? this.getContextFromRange(getDefaultRange())
        : this.getContext(document.elementFromPoint(e.clientX, e.clientY));
    if (!context) {
      return;
    }

    this.dispatchEvent<MouseEvent>(context, e, "handleMouseMove");

    const pointContext = this.getContext(
      document.elementFromPoint(e.clientX, e.clientY)
    );
    if (pointContext) {
      if (pointContext.block !== this.mouseEnteredBlock) {
        if (this.mouseEnteredBlock) {
          pointContext.endBlock = this.mouseEnteredBlock;

          this.dispatchEvent<MouseEvent>(
            {
              ...pointContext,
              block: pointContext.endBlock,
              endBlock: pointContext.block,
            },
            e,
            "handleMouseLeave"
          );
        }

        this.mouseEnteredBlock = pointContext.block;
        this.dispatchEvent<MouseEvent>(pointContext, e, "handleMouseEnter");
      }
    }
  }

  retriveBlockFromMouse(
    e: MouseEvent
  ): { block: Block; focusNode: Node } | null {
    const middleX =
      this.page.blockRoot.clientLeft + this.page.blockRoot.clientWidth / 2;
    const node = document.elementFromPoint(middleX, e.clientY);
    if (node) {
      const block = this.findBlock(node);
      if (block) {
        return { block, focusNode: node };
      }
    }
    return null;
  }

  retriveBlockFromRange(
    range: Range
  ): { block: Block; focusNode: Node } | null {
    let block, node;

    if ((block = this.findBlock(range.commonAncestorContainer))) {
      node = range.commonAncestorContainer;
    } else if ((block = this.findBlock(range.startContainer))) {
      node = range.startContainer;
    } else if (
      (block = this.findBlock(
        range.startContainer.childNodes[range.startOffset]
      ))
    ) {
      node = range.startContainer.childNodes[range.startOffset];
    } else if (
      (block = this.findBlock(
        range.startContainer.childNodes[range.startOffset - 1]
      ))
    ) {
      node = range.startContainer.childNodes[range.startOffset - 1];
    } else {
      return null;
    }
    return { block, focusNode: node };
  }

  handleMouseUp(e: MouseEvent): void | boolean {
    // MouseDown will ensure the activated block
    // MouseUp should check range and send selectionChange/invalideLocation event

    const range = tryGetDefaultRange();

    let context;
    let retrive;
    // 如果是多选，就判断 multiblock
    if ((retrive = this.retriveBlockFromMouse(e))) {
      context = {
        block: retrive.block,
        page: this.page,
        range,
      } as BlockEventContext;
    } else {
      return;
    }

    if (!retrive) {
      throw new Error("Sanity check");
    }

    this.dispatchEvent<MouseEvent>(context, e, "handleMouseUp");

    const block = retrive.block;
    // find Block from range or e
    // find editable, if can't, dispatch invalidLocation
    // send selectionChange
    // debugger;
    if (range && range.collapsed) {
      if (!block.findEditable(range.commonAncestorContainer)) {
        if (
          this.dispatchPageEvent(
            new BlockInvalideLocationEvent({
              page: this.page,
              block,
              range: context.range!,
              from: "mouseUp",
            }),
            context
          )
        ) {
          return;
        }
      }
    }

    this.dispatchPageEvent(
      new BlockSelectChangeEvent({
        page: this.page,
        block,
        range: context.range!,
        from: "mouseUp",
      })
    );
  }
  handleClick(e: MouseEvent): void | boolean {
    const range = tryGetDefaultRange();
    const context =
      range && this.findBlock(range.startContainer)
        ? this.getContextFromRange(range)
        : this.getContext(document.elementFromPoint(e.clientX, e.clientY));

    if (!context) {
      return;
    }
    this.dispatchEvent<MouseEvent>(context, e, "handleClick");
  }
  handleContextMenu(e: MouseEvent): void | boolean {
    const blocks = this.getContextFromRange(getDefaultRange());
    if (!blocks.block) {
      return;
    }
    this.dispatchEvent<MouseEvent>(blocks, e, "handleContextMenu");
  }
  handleInput(e: Event): void | boolean {
    const blocks = this.getContextFromRange(getDefaultRange());
    if (!blocks.block) {
      return;
    }
    this.dispatchEvent<Event>(blocks, e, "handleInput");
  }
  handleBeforeInput(e: InputEvent): void | boolean {
    const blocks = this.getContextFromRange(getDefaultRange());
    if (!blocks.block) {
      return;
    }
    this.dispatchEvent<InputEvent>(blocks, e, "handleBeforeInput");
  }
  handleDrop(e: DragEvent): void | boolean {
    console.log(e);
  }
  handleSelectStart(e: Event): void | boolean {
    console.log(e);
    return;
    // const block = this.getContext(
    //   document.getSelection()?.getRangeAt(0).startContainer
    // );
    // if (!block) {
    //   return;
    // }
    // this.sendEventV2<Event>({block}, e, "handleSelectStart");
  }
  handleSelectionChange(e: Event): void | boolean {
    console.log(e);
    return;
    // const block = this.getContext(
    //   document.getSelection()?.getRangeAt(0).startContainer
    // );
    // if (!block) {
    //   return;
    // }
    // this.sendEventV2<Event>({block}, e, "handleSelectionChange");
  }
  handleSelect(e: Event): void | boolean {
    console.log(e);
    return;
    // const block = this.getContext(
    //   document.getSelection()?.getRangeAt(0).startContainer
    // );
    // if (!block) {
    //   return;
    // }
    // this.sendEventV2<Event>({block}, e, "handleSelect");
  }

  handleCompositionEnd(e: CompositionEvent): void | boolean {
    const blocks = this.getContextFromRange(getDefaultRange());
    if (!blocks.block) {
      return;
    }
    this.dispatchEvent<CompositionEvent>(blocks, e, "handleCompositionEnd");
  }
  handleCompositionStart(e: CompositionEvent): void | boolean {
    const blocks = this.getContextFromRange(getDefaultRange());
    if (!blocks.block) {
      return;
    }
    this.dispatchEvent<CompositionEvent>(blocks, e, "handleCompositionStart");
  }
  handleCompositionUpdate(e: CompositionEvent): void | boolean {
    const blocks = this.getContextFromRange(getDefaultRange());
    if (!blocks.block) {
      return;
    }
    this.dispatchEvent<CompositionEvent>(blocks, e, "handleCompositionUpdate");
  }

  dispatchPageEvent(e: PageEvent, context?: any): boolean | void {
    context = context || e;
    // 要解决一些问题
    // 1. pageevent 发给谁
    // 论证：如果 code 内的更改要通过 code handler 来 update 的话，
    // 那 multiblock 很明显也会导致 code 的更改，但不会通知到 code
    // 所以更改不能发生在自身的 handler ，要将该事件重新通知出去
    //
    if (e instanceof BlockUpdateEvent) {
      return this.dispatchEvent<BlockUpdateEvent>(
        e,
        context,
        "handleBlockUpdated"
      );
    } else if (e instanceof BlockActiveEvent) {
      return this.dispatchEvent<BlockActiveEvent>(
        e,
        context,
        "handleBlockActivated"
      );
    } else if (e instanceof BlockDeActiveEvent) {
      return this.dispatchEvent<BlockDeActiveEvent>(
        e,
        context,
        "handleBlockDeActivated"
      );
    } else if (e instanceof BlockSelectChangeEvent) {
      return this.dispatchEvent<BlockSelectChangeEvent>(
        e,
        context,
        "handleBlockSelectChange"
      );
    } else if (e instanceof BlockInvalideLocationEvent) {
      return this.dispatchEvent<BlockInvalideLocationEvent>(
        e,
        context,
        "handleBlockInvalideLocation"
      );
    } else if (e instanceof PageUndoEvent) {
      return this.dispatchEvent<PageUndoEvent>(e, context, "handlePageUndo");
    } else if (e instanceof PageRedoEvent) {
      return this.dispatchEvent<PageRedoEvent>(e, context, "handlePageRedo");
    }
  }
}

export type HandlerFlag = PagesHandleMethods[] | PagesHandleMethods | undefined;

export interface HandlerEntry {
  plugins?: HandlerFlag;
  multiblock?: HandlerFlag;
  // 只需要 global / blocks 两种，在前面都没有通过的情况下，下面两种情况二选一 consume
  beforeBlock?: HandlerFlag;
  global?: HandlerFlag;
  blocks?: { [key: string]: HandlerFlag };
  inlines?: { [key: string]: HandlerFlag };
  onPageCreated?(page: Page): void;
}

export interface Component {
  handlers?: HandlerEntry;
  onPageCreated?(page: Page): void;
}

export interface BlockComponent extends Component {
  name: string;
  blockType: new (data?: any) => AnyBlock;
  serializer: BlockSerializer<AnyBlock>;
  // Block Manager 负责创建、序列化、反序列化 Block
}
export interface PluginComponent extends Component {
  // 负责维护一个可选的 HTMLElement，并可以通过 handler 调用该 Manager 显示在必要位置上
  manager: IPlugin;
}

export interface InlineComponent extends Component {
  // 负责维护一个可选的 HTMLElement，用于在 inline 被激活时提供必要的操作
  manager: IInline;
}

export type ComponentEntryFn = (init: any) => Component;

export interface PageInit {
  components?: {
    blocks?: BlockComponent[];
    plugins?: PluginComponent[];
    inlines?: InlineComponent[];
    extraHandlers?: HandlerEntry[];
  };
  blocks?: AnyBlock[];
  config?: { [key: string]: any };
}

export class Page implements IPage {
  parent?: IComponent;
  chain: LinkedDict<string, AnyBlock> = new LinkedDict();
  selected: Set<string>;
  active?: AnyBlock;
  // activeInline?: HTMLLabelElement;
  hover?: AnyBlock | undefined;
  outer: HTMLElement;
  inner: HTMLElement;
  pluginRoot: HTMLElement;
  pluginManagers: { [key: string]: IPlugin } = {};
  rangeDirection: "prev" | "next" | undefined;
  selectionMode: "block" | "text" = "text";
  supportedBlocks: { [key: string]: BlockComponent } = {};
  pageHandler: PageHandler;
  history: History;

  shortcut: IShortcut;
  inlineSerializer: InlineSerializer;

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
    this.inlineSerializer = new InlineSerializer();
    const pageCreatedListener: Component["onPageCreated"][] = [];
    if (components) {
      const { blocks, plugins, inlines, extraHandlers } = components;
      if (blocks) {
        // blocks
        blocks.forEach((item) => {
          this.pageHandler.registerHandlers(item.handlers || {});
          this.supportedBlocks[item.name] = item;

          item.onPageCreated && pageCreatedListener.push(item.onPageCreated);
        });
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
      this.appendBlock(new Paragraph());
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

  createBlock<T = AnyBlock, I extends BlockData = BlockData>(
    name: string,
    data?: I
  ): T {
    return new this.supportedBlocks[name].blockType(data) as T;
  }

  getBlockSerializer<T extends Block = AnyBlock>(
    name: string
  ): BlockSerializer<T> {
    return this.supportedBlocks[name].serializer as BlockSerializer<T>;
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
  appendBlock(newBlock: AnyBlock): string {
    this.removeBlockStatus(newBlock);
    const oldLast = this.getLastBlock();
    if (oldLast) {
      newBlock.setOrder(createOrderString(oldLast.order));
    } else {
      newBlock.setOrder(createOrderString());
    }
    this.chain.append(newBlock.order, newBlock);
    this.blockRoot.appendChild(newBlock.root);
    newBlock.setParent(this);
    // newBlock
    return newBlock.order;
  }

  insertBlockAdjacent(
    newBlock: AnyBlock,
    where: "after" | "before",
    flag?: BlockQuery | undefined
  ): string {
    this.removeBlockStatus(newBlock);
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
          newBlock.setOrder(createOrderString(target.order, next.order));
          target.root.insertAdjacentElement("afterend", newBlock.root);
          this.chain.insertAfter(target.order, newBlock.order, newBlock);
          newBlock.setParent(this);
          return newBlock.order;
        }
      } else {
        const prev = this.getPrevBlock(target);
        const prevOrder = prev ? prev.order : "";
        newBlock.setOrder(createOrderString(prevOrder, target.order));
        target.root.insertAdjacentElement("beforebegin", newBlock.root);
        this.chain.insertBefore(target.order, newBlock.order, newBlock);
        newBlock.setParent(this);
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
    this.removeBlockStatus(newBlock);
    const result = this.chain.find(flag);
    if (!result) {
      throw new Error("Block not found.");
    }

    const [tgt, node] = result;
    newBlock.setOrder(tgt.order);
    tgt.setParent();
    tgt.root.insertAdjacentElement("afterend", newBlock.root);
    tgt.root.remove();
    node.value = newBlock;
    return tgt;
  }

  setParent(parent?: IContainer): void {
    this.parent = parent;
  }

  serialize(el: IComponent, option?: any): { [key: string]: any } {
    throw new Error("Method not implemented.");
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

  deserialize(): IComponent {
    throw new Error("Method not implemented.");
  }
  equals(component?: IComponent): boolean {
    return component !== undefined && this.root === component.root;
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
