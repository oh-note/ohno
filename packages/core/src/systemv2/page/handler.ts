import {
  BlockEventContext,
  PagesHandleMethods,
  HandlerMethod,
  HandlerMethods,
  MultiBlockEventContext,
  RangedBlockEventContext,
} from "../types";
import { AnyBlock, Block } from "../types";
import {
  getDefaultRange,
  tryGetDefaultRange,
} from "@ohno-editor/core/helper/document";
import {
  BlockActiveEvent,
  BlockDeActiveEvent,
  BlockInvalideLocationEvent,
  BlockSelectChangeEvent,
  BlockUpdateEvent,
  PageEvent,
  PageRedoEvent,
  PageUndoEvent,
} from "./events";
import { throttle } from "@ohno-editor/core/helper/lodash";
import { Page } from "./page";

export type HandlerFlag = PagesHandleMethods[] | PagesHandleMethods | undefined;

export interface HandlerEntry {
  plugins?: HandlerFlag;
  multiblock?: HandlerFlag;

  beforeBlock?: HandlerFlag;
  global?: HandlerFlag;
  blocks?: { [key: string]: HandlerFlag };
  inlines?: { [key: string]: HandlerFlag };
  onPageCreated?(page: Page): void;
}

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
    this.handleMouseMove = throttle(this.handleMouseMove, 10).bind(this);
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
    const rect = this.page.blockRoot.getBoundingClientRect();

    const middleX = rect.x + rect.width / 2;
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
      return this.dispatchEvent<PageUndoEvent>(context, e, "handlePageUndo");
    } else if (e instanceof PageRedoEvent) {
      return this.dispatchEvent<PageRedoEvent>(context, e, "handlePageRedo");
    }
  }
}
