import {
  EventContext,
  Handler,
  HandlerMethod,
  HandlerMethods,
  MultiBlockEventContext,
  MultiBlockHandlerMethod,
  RangedEventContext,
} from "./handler";
import { createOrderString } from "@/helper/string";
import { LinkedDict } from "@/struct/linkeddict";
import { AnyBlock, Order } from "./block";
import { Paragraph } from "@/contrib/blocks/paragraph";
import { Command, History, globalHistory } from "./history";
import { ROOT_CLASS } from "./config";
import { createElement, getDefaultRange } from "@/helper/document";
import { Inline, InlineHandler } from "./inline";

export class PageHandler {
  pluginHandlers: Handler[] = [];
  multiBlockHandlers: Handler[] = [];
  startHandlers: Handler[] = [];
  beforeHandlers: { [key: string]: Handler[] } = {};
  handlers: Handler[] = [];
  afterHandlers: { [key: string]: Handler[] } = {};
  inlineHandler: { [key: string]: Handler[] } = {};

  page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  registerHandler({
    startHandler,
    blockHandler: beforeHandler,
    pluginHandler,
    multiBlockHandler,
    globalHandler,
    afterHandler,
    inlineHandler,
  }: HandlerEntry) {
    if (startHandler) {
      this.startHandlers.push(startHandler);
    }
    if (beforeHandler) {
      if (!this.beforeHandlers[beforeHandler.name]) {
        this.beforeHandlers[beforeHandler.name] = [];
      }
      this.beforeHandlers[beforeHandler.name].push(beforeHandler);
    }
    if (pluginHandler) {
      this.pluginHandlers.push(pluginHandler);
    }
    if (multiBlockHandler) {
      this.multiBlockHandlers.push(multiBlockHandler);
    }
    if (globalHandler) {
      this.handlers.push(globalHandler);
    }
    if (afterHandler) {
      if (!this.afterHandlers[afterHandler.name]) {
        this.afterHandlers[afterHandler.name] = [];
      }
      this.afterHandlers[afterHandler.name].push(afterHandler);
    }
    if (inlineHandler) {
      if (!this.inlineHandler[inlineHandler.name]) {
        this.inlineHandler[inlineHandler.name] = [];
      }
      this.inlineHandler[inlineHandler.name].push(inlineHandler);
    }
  }

  removeEventListener(el: HTMLElement) {
    el.removeEventListener("copy", this.handleCopy.bind(this));
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

  bingEventListener(el: HTMLElement) {
    el.addEventListener("copy", this.handleCopy.bind(this));
    el.addEventListener("paste", this.handlePaste.bind(this));
    el.addEventListener("blur", this.handleBlur.bind(this));
    el.addEventListener("focus", this.handleFocus.bind(this));
    el.addEventListener("keydown", this.handleKeyDown.bind(this));
    el.addEventListener("keypress", this.handleKeyPress.bind(this));
    el.addEventListener("keyup", this.handleKeyUp.bind(this));
    el.addEventListener("mousedown", this.handleMouseDown.bind(this));

    // should be bind manully
    el.addEventListener("mousemove", this.handleMouseMove.bind(this));
    el.addEventListener("mouseenter", this.handleMouseEnter.bind(this));
    el.addEventListener("mouseleave", this.handleMouseLeave.bind(this));
    el.addEventListener("mouseup", this.handleMouseUp.bind(this));
    el.addEventListener("click", this.handleClick.bind(this));
    el.addEventListener("input", this.handleInput.bind(this));
    el.addEventListener("contextmenu", this.handleContextMenu.bind(this));

    el.addEventListener("beforeinput", this.handleBeforeInput.bind(this));

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

  getContextFromRange(range: Range): EventContext {
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
    return blockContext;
  }

  getContext(
    target: EventTarget | Node | null | undefined
  ): EventContext | null {
    if (!target) {
      return null;
    }
    let el = target as Element;
    while (el && (el.nodeType != 1 || !el.classList.contains("oh-is-block"))) {
      el = el.parentElement!;
    }
    if (el) {
      const block = this.page.blockChain.find(el.getAttribute("order")!)![0];
      return { block, page: this.page };
    }
    return null;
  }

  findBlock(target: EventTarget | Node | null | undefined): AnyBlock | null {
    if (!target) {
      return null;
    }
    let el = target as Element;
    while (el && (el.nodeType != 1 || !el.classList.contains("oh-is-block"))) {
      el = el.parentElement!;
    }
    if (el) {
      const block = this.page.blockChain.find(el.getAttribute("order")!)![0];
      return block;
    }
    return null;
  }

  _dispatchEvent<K extends Event>(
    handlers: Handler[],
    context: EventContext | RangedEventContext | MultiBlockEventContext,
    e: K,
    eventName: keyof HandlerMethods
  ) {
    for (let i = 0; i < handlers.length; i++) {
      const handler = handlers[i];
      const method = handler[eventName] as HandlerMethod<K>;
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

  dispatchEvent<K extends Event>(
    context: EventContext,
    e: K,
    eventName: keyof HandlerMethods
  ) {
    const { block, endBlock, range } = context;
    if (this._dispatchEvent(this.pluginHandlers, context, e, eventName)) {
      return;
    }

    if (endBlock && endBlock !== block) {
      const blocks = [block];
      let cur = block;
      while ((cur = this.page.getNextBlock(cur)!)) {
        blocks.push(cur);
        if (cur.order === endBlock.order) {
          break;
        }
      }
      if (!range) {
        throw new NoRangeError();
      }
      const mbContext = {
        block,
        endBlock,
        blocks: blocks, //TODO
        page: this.page,
        range,
      };
      this._dispatchEvent(this.multiBlockHandlers, mbContext, e, eventName);
      return;
    }

    if (this._dispatchEvent(this.startHandlers, context, e, eventName)) {
      return;
    }
    const beforeHandlers = this.beforeHandlers[block.type] || [];
    if (this._dispatchEvent(beforeHandlers, context, e, eventName)) {
      return;
    }
    if (this._dispatchEvent(this.handlers, context, e, eventName)) {
      return;
    }
    const afterHandlers = this.afterHandlers[block.type] || [];
    if (this._dispatchEvent(afterHandlers, context, e, eventName)) {
      return;
    }
  }

  handleCopy(e: ClipboardEvent): void | boolean {
    const blocks = this.getContextFromRange(getDefaultRange());
    if (!blocks.block) {
      return;
    }
    this.dispatchEvent<ClipboardEvent>(blocks, e, "handleCopy");
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
    this.dispatchEvent<FocusEvent>(blocks, e, "handleBlur");
  }

  handleFocus(e: FocusEvent): void | boolean {
    const sel = document.getSelection();
    if (sel && sel.rangeCount > 0) {
      const context = this.getContext(sel.getRangeAt(0).startContainer);
      if (!context) {
        return;
      }
      this.dispatchEvent<FocusEvent>(context, e, "handleFocus");
    }
  }

  handleKeyDown(e: KeyboardEvent): void | boolean {
    const context = this.getContextFromRange(getDefaultRange());
    if (!context.block) {
      return;
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
    const context = this.getContext(
      document.elementFromPoint(e.clientX, e.clientY)
    );
    if (!context) {
      return;
    }
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
  handleMouseMove(e: MouseEvent): void | boolean {
    const context =
      e.button === 1
        ? this.getContextFromRange(getDefaultRange())
        : this.getContext(document.elementFromPoint(e.clientX, e.clientY));
    if (!context) {
      return;
    }

    this.dispatchEvent<MouseEvent>(context, e, "handleMouseMove");
  }
  handleMouseLeave(e: MouseEvent): void | boolean {
    const context = this.getContext(e.target);
    if (!context) {
      return;
    }
    this.dispatchEvent<MouseEvent>(context, e, "handleMouseLeave");
  }
  handleMouseUp(e: MouseEvent): void | boolean {
    const context = this.getContextFromRange(getDefaultRange());
    if (!context.block) {
      return;
    }
    this.dispatchEvent<MouseEvent>(context, e, "handleMouseUp");
  }
  handleClick(e: MouseEvent): void | boolean {
    const context = this.getContextFromRange(getDefaultRange());
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
}

export interface HandlerEntry {
  pluginHandler?: Handler;
  multiBlockHandler?: Handler;
  startHandler?: Handler;
  blockHandler?: Handler;
  afterHandler?: Handler;
  //
  globalHandler?: Handler;
  // 不在 page 中调用，由 core 中的 GlobalInlineHandler 分发
  inlineHandler?: Handler;
}

export interface BlockEntry {
  name: string;
  handler: Handler;
  blockType: new () => AnyBlock;
}

export type PluginEntryFn = (init: any) => PluginEntry;
export type BlockEntryFn = (init: any) => BlockEntry;

export interface PluginEntry {
  name: string;
  instance: PagePluginInstance;
  handler: Handler;
}

export interface InlineEntry {
  name: string;
  instance: Inline<any>;
  handler: InlineHandler;
}

export interface PageInit {
  handlers?: HandlerEntry[];
  plugins?: PluginEntry[];
  blocks?: BlockEntry[];
  inlines?: InlineEntry[];
}

export interface PagePluginInstance {
  assignPage(page: Page): void;
}

const defaultPageInit: PageInit = {};

export interface PageStatus {
  activeInline?: HTMLElement;
  activeBlock?: AnyBlock;
  activeLabel?: HTMLLabelElement;
  selected?: AnyBlock[];
  selectionDir?: "prev" | "next";
  [key: string]: any;
}

export class Page {
  handler: PageHandler;
  blockChain: LinkedDict<string, AnyBlock> = new LinkedDict();
  root: HTMLElement;
  pluginRoot: HTMLElement;
  blockRoot: HTMLElement;
  init: PageInit;
  status: PageStatus = {};
  // 一个 Page 由 plugin、block、inline 三部分组成
  // plugin 指的是拖动、toolbar、dropdown 等，仅为了增加编辑体验的组件
  // block 指各种编辑类型的基本单位，如 Paragraph、List、Table
  // 每个 block 有 editable container 和 functional container，editable 和其他 editable 相连，可以由鼠标控制
  // functional container 用来放按钮、其他文本等
  // plugin、block、inline 可以看成是三种组件，每种组件都各自注册各自类型的 handlers
  // 每个组件都可以注册多个 handlers （比如 Headings 可以注册 Paragraph 的 Handler）
  // handler 的生命周期/调用流程为：
  // plugin -> multiblock ->  global -> block -> global -> block
  // inline 指block 中 editable container 的额外组成单位，除了默认的 text、b、i、code、em 之外的元素，由 label 包裹
  //
  // Dropdown、toolbar、侧边评论、block 的拖动条，都是 plugin
  // plugin 同样接收 page handler 分发的所有事件，事件分发的优先级大于所有 handler
  // 但 plugin 应该遵循非必要不处理、不强占 range、不另设焦点的要求
  private plugins: { [key: string]: PluginEntry } = {};
  private blocks: { [key: string]: BlockEntry } = {};
  private inlines: { [key: string]: InlineEntry } = {};
  namespace: { [key: string]: any } = {};

  history: History = globalHistory;
  constructor(init?: PageInit) {
    this.handler = new PageHandler(this);
    this.blockRoot = createElement("div");
    this.root = createElement("div", { className: "oh-is-root" });
    this.pluginRoot = createElement("div", { className: "oh-is-plugin" });
    this.root.append(this.pluginRoot, this.blockRoot);
    this.blockRoot.classList.add(ROOT_CLASS);
    this.blockRoot.contentEditable = "true";
    this.handler.bingEventListener(this.blockRoot);
    if (!this.blockRoot.hasChildNodes()) {
      this.appendBlock(new Paragraph());
    }

    this.init = Object.assign({}, defaultPageInit, init);
    // 初始化顺序：plugin -> block -> handler
    // block 初始化时，可以尝试向插件注册自己的组件
    this.init.plugins?.forEach((item) => {
      this.plugins[item.name] = item;
      if (item.handler) {
        this.handler.registerHandler({ pluginHandler: item.handler });
        item.instance.assignPage(this);
      }
    });

    this.init.blocks?.forEach((item) => {
      if (item.handler) {
        this.handler.registerHandler({ blockHandler: item.handler });
        this.blocks[item.name] = item;
      }
    });

    this.init.handlers?.forEach((item) => {
      this.handler.registerHandler(item);
    });

    this.init.inlines?.forEach((item) => {
      this.inlines[item.name] = item;
      if (item.handler) {
        this.handler.registerHandler({ inlineHandler: item.handler });
        item.instance.assignPage(this);
      }
    });
  }

  getPlugin(name: string): PluginEntry {
    // 这里不做空处理，理论上所有的 Plugin 都只由自己的 handler 调用，不存在空的情况
    // 特殊的 hack 处理碰到了再说
    return this.plugins[name];
  }

  executeCommand(command: Command<any>, executed?: boolean) {
    if (executed) {
      this.history.append(command);
    } else {
      this.history.execute(command);
    }
  }

  hover(name: Order) {
    const result = this.blockChain.find(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, _] = result;
    tgt.root.classList.add("oh-is-hover");
  }
  unhover(name: Order) {
    const result = this.blockChain.find(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, _] = result;
    tgt.root.classList.remove("oh-is-hover");
  }

  activateInline(node: HTMLElement) {
    if (this.status.activeInline === node) {
      return;
    }
    if (this.status.activeInline) {
      this.deactivateInline(this.status.activeInline);
    }
    this.status.activeInline = node;
    // node.contentEditable = "false";
    node.classList.add("active");
  }
  deactivateInline(node?: HTMLElement) {
    if (!node && this.status.activeInline) {
      node = this.status.activeInline;
    }
    if (this.status.activeInline === node) {
      this.status.activeInline = undefined;
    }
    if (node) {
      // node.removeAttribute("contenteditable");
      node.classList.remove("active");
    }
  }

  /**
   * 在 attribution 上进行改变，并在 page 的变量上进行记录
   * 在光标上不做任何处理，由 handler 内部消化
   * @param name
   */
  activate(name: Order) {
    const result = this.blockChain.find(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, _] = result;
    if (this.status.activeBlock) {
      this.status.activeBlock.deactivate();
    }
    this.status.activeBlock = tgt;
    tgt.activate();
  }

  deactivate(name: Order) {
    const result = this.blockChain.find(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, _] = result;
    this.status.activeBlock = undefined;
    tgt.deactivate();
  }

  findBlock(order: Order): AnyBlock | null {
    const results = this.blockChain.find(order);
    if (!results) {
      return null;
    }
    return results[0];
  }

  getPrevBlock(block: AnyBlock): AnyBlock | null {
    const results = this.blockChain.previous(block.order!);
    if (!results) {
      return null;
    }
    return results[0];
  }

  getNextBlock(block: AnyBlock): AnyBlock | null {
    let results = this.blockChain.next(block.order!);
    if (!results) {
      return null;
    }
    return results[0];
  }

  appendBlock(newBlock: AnyBlock) {
    const [tgt, _] = this.blockChain.getLast();

    if (tgt) {
      newBlock.assignOrder(createOrderString(tgt.order));
      this.blockChain.append(newBlock.order!, newBlock);
    } else {
      newBlock.assignOrder(createOrderString());
      this.blockChain.append(newBlock.order!, newBlock);
    }
    this.blockRoot?.appendChild(newBlock.root);
    newBlock.attached(this);
    return newBlock.order;
  }

  insertBlockBefore(name: Order, newBlock: AnyBlock) {
    const result = this.blockChain.find(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, node] = result;
    const prev = node.prev;
    const prevOrder = prev ? prev.value.order : "";

    newBlock.assignOrder(createOrderString(prevOrder, tgt.order));
    if (!this.blockChain.insertBefore(tgt.order!, newBlock.order!, newBlock)) {
      throw EvalError(`insert before ${tgt.order} failed!`);
    }
    newBlock.attached(this);
    tgt.root.insertAdjacentElement("beforebegin", newBlock.root);
  }
  insertBlockAfter(name: Order, newBlock: AnyBlock) {
    const result = this.blockChain.find(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, node] = result;
    const next = node.next;
    const nextOrder = next ? next.value.order : "";

    newBlock.assignOrder(createOrderString(tgt.order, nextOrder));
    if (!this.blockChain.insertAfter(tgt.order!, newBlock.order!, newBlock)) {
      throw EvalError(`insert before ${tgt.order} failed!`);
    }
    newBlock.attached(this);
    tgt.root.insertAdjacentElement("afterend", newBlock.root);
  }

  removeBlock(name: Order): any {
    const result = this.blockChain.pop(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, _] = result;
    tgt.detached();
    tgt.root.remove();
  }
  replaceBlock(name: Order, newBlock: AnyBlock) {
    const result = this.blockChain.find(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, node] = result;
    newBlock.assignOrder(tgt.order!);
    tgt.detached();
    newBlock.attached(this);

    node.value = newBlock;
    tgt.root.replaceWith(newBlock.root);
  }

  render(el: HTMLElement) {
    el.appendChild(this.root);
  }

  dismiss(removeElement?: boolean) {
    if (!this.blockRoot) {
      return;
    }
    this.handler.removeEventListener(this.blockRoot);
    if (removeElement) {
      this.blockRoot.remove();
    } else {
      this.blockRoot.classList.remove(ROOT_CLASS);
    }
  }
}
