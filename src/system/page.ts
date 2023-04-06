/**
 * 事件类型：
 *
 * dom event:
 *  - key event
 *  - mouse event
 *  - input/copy/paste event
 *  - other event
 *
 * editor event:
 *  - key enter -> new block event (by page/block)
 *  - key backspace/delete -> delete/merge block event (by block-extra-handler)
 *  - key backspace/space -> change block event (by block-extra-handler)
 *  - key enter/backspace -> inner edit event (list/orderedlist, by block)
 *  - key arrow -> move cursor event (by page/block)
 *  - drag/drop event -> move block event (by page)
 *  - click event -> delete block event (by page)
 *  - click event -> format event (by general)
 *
 * global handler:
 *
 *  - beforeHandler[blockType].handleX(e)
 *  - pageHandler.handleX(e)
 *  - afterHandler[blockType].handleX(e)
 *
 * operation Handler:
 *  - handleOperation(name)
 *  -
 */

import {
  EventContext,
  Handler,
  HandlerMethod,
  HandlerMethods,
  defaultAfterHandlers,
  defaultBeforeHandlers,
  defaultGlobalHandlers,
} from "./handler";
import { createOrder } from "../helper/order";
import { LinkedDict } from "../struct/linkeddict";
import { AnyBlock, Block, Order } from "./block";
import { OperationHandlerFn } from "./operation";
import { Paragraph } from "../contrib/handlers/paragraph";
import { Command, History, globalHistory } from "./history";

export class PageDispatch {
  beforeHandlerd: { [key: string]: Handler[] } = defaultBeforeHandlers;
  afterHandlerd: { [key: string]: Handler[] } = defaultAfterHandlers;
  handlers: Handler[] = defaultGlobalHandlers;
  page: Page;
  constructor(page: Page) {
    this.page = page;
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
  registerBeforeHandler(name: string, handler: Handler) {
    if (!this.beforeHandlerd[name]) {
      this.beforeHandlerd[name] = [];
    }
    this.beforeHandlerd[name].push(handler);
  }
  registerHandler(handler: Handler) {
    this.handlers.push(handler);
  }
  registerAfterHandler(name: string, handler: Handler) {
    if (!this.afterHandlerd[name]) {
      this.afterHandlerd[name] = [];
    }
    this.afterHandlerd[name].push(handler);
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
      return this.page.blocks.find(el.getAttribute("order")!)![0];
    }
    return el;
  }
  makeContext(block: AnyBlock): EventContext {
    return { block: block, page: this.page };
  }

  sendEvent<K extends Event>(
    block: AnyBlock,
    e: K,
    eventName: keyof HandlerMethods
  ) {
    // console.log(block, eventName);
    if (this.beforeHandlerd[block.type]) {
      for (let i = 0; i < this.beforeHandlerd[block.type].length; i++) {
        const handler = this.beforeHandlerd[block.type][i];
        const method = handler[eventName] as HandlerMethod<K>;
        if (method.call(handler, e, this.makeContext(block))) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
      }
    }

    for (let i = 0; i < this.handlers.length; i++) {
      const handler = this.handlers[i];
      const method = handler[eventName] as HandlerMethod<K>;
      const res = method.call(handler, e, this.makeContext(block));
      // console.log([method, res]);
      if (res) {
        e.stopPropagation();
        e.preventDefault();
        return;
      }
    }
    if (this.afterHandlerd[block.type]) {
      for (let i = 0; i < this.afterHandlerd[block.type].length; i++) {
        const handler = this.afterHandlerd[block.type][i];
        const method = handler[eventName] as HandlerMethod<K>;
        if (method.call(handler, e, this.makeContext(block))) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
      }
    }
  }

  handleCopy(e: ClipboardEvent): void | boolean {
    const block = this.findBlock(e.target);
    if (!block) {
      return;
    }
    this.sendEvent<ClipboardEvent>(block, e, "handleCopy");
  }
  handlePaste(e: ClipboardEvent): void | boolean {
    const block = this.findBlock(e.target);
    if (!block) {
      return;
    }
    this.sendEvent<ClipboardEvent>(block, e, "handlePaste");
  }
  handleBlur(e: FocusEvent): void | boolean {
    const block = this.findBlock(
      document.getSelection()?.getRangeAt(0).startContainer
    );
    if (!block) {
      return;
    }
    this.sendEvent<FocusEvent>(block, e, "handleBlur");
  }
  handleFocus(e: FocusEvent): void | boolean {
    const sel = document.getSelection();
    if (sel && sel.rangeCount > 0) {
      const block = this.findBlock(sel.getRangeAt(0).startContainer);
      if (!block) {
        return;
      }
      this.sendEvent<FocusEvent>(block, e, "handleFocus");
    }
  }
  handleKeyDown(e: KeyboardEvent): void | boolean {
    const block = this.findBlock(
      document.getSelection()?.getRangeAt(0).startContainer
    );

    if (!block) {
      return;
    }
    this.sendEvent<KeyboardEvent>(block, e, "handleKeyDown");
  }
  handleKeyPress(e: KeyboardEvent): void | boolean {
    const block = this.findBlock(
      document.getSelection()?.getRangeAt(0).startContainer
    );
    if (!block) {
      return;
    }
    this.sendEvent<KeyboardEvent>(block, e, "handleKeyPress");
  }
  handleKeyUp(e: KeyboardEvent): void | boolean {
    const block = this.findBlock(
      document.getSelection()?.getRangeAt(0).startContainer
    );

    if (!block) {
      return;
    }
    this.sendEvent<KeyboardEvent>(block, e, "handleKeyUp");
  }
  handleMouseDown(e: MouseEvent): void | boolean {
    const block = this.findBlock(
      document.elementFromPoint(e.clientX, e.clientY)
    );
    if (!block) {
      return;
    }
    this.sendEvent<MouseEvent>(block, e, "handleMouseDown");
  }
  handleMouseEnter(e: MouseEvent): void | boolean {
    const block = this.findBlock(
      document.elementFromPoint(e.clientX, e.clientY)
    );
    if (!block) {
      return;
    }
    this.sendEvent<MouseEvent>(block, e, "handleMouseEnter");
  }
  handleMouseMove(e: MouseEvent): void | boolean {
    const block = this.findBlock(
      document.elementFromPoint(e.clientX, e.clientY)
    );
    if (!block) {
      return;
    }
    this.sendEvent<MouseEvent>(block, e, "handleMouseMove");
  }
  handleMouseLeave(e: MouseEvent): void | boolean {
    const block = this.findBlock(e.target);
    if (!block) {
      return;
    }
    this.sendEvent<MouseEvent>(block, e, "handleMouseLeave");
  }
  handleMouseUp(e: MouseEvent): void | boolean {
    const block = this.findBlock(e.target);
    if (!block) {
      return;
    }
    this.sendEvent<MouseEvent>(block, e, "handleMouseUp");
  }
  handleClick(e: MouseEvent): void | boolean {
    const block = this.findBlock(e.target);
    if (!block) {
      return;
    }
    this.sendEvent<MouseEvent>(block, e, "handleClick");
  }
  handleContextMenu(e: MouseEvent): void | boolean {
    const block = this.findBlock(e.target);
    if (!block) {
      return;
    }
    this.sendEvent<MouseEvent>(block, e, "handleContextMenu");
  }
  handleInput(e: Event): void | boolean {
    const block = this.findBlock(
      document.getSelection()?.getRangeAt(0).startContainer
    );

    if (!block) {
      return;
    }
    this.sendEvent<Event>(block, e, "handleInput");
  }
  handleBeforeInput(e: InputEvent): void | boolean {
    const block = this.findBlock(
      document.getSelection()?.getRangeAt(0).startContainer
    );
    if (!block) {
      return;
    }
    this.sendEvent<InputEvent>(block, e, "handleBeforeInput");
  }
  handleSelectStart(e: Event): void | boolean {
    console.log(e);
    return;
    const block = this.findBlock(
      document.getSelection()?.getRangeAt(0).startContainer
    );
    if (!block) {
      return;
    }
    this.sendEvent<Event>(block, e, "handleSelectStart");
  }
  handleSelectionChange(e: Event): void | boolean {
    console.log(e);
    return;
    const block = this.findBlock(
      document.getSelection()?.getRangeAt(0).startContainer
    );
    if (!block) {
      return;
    }
    this.sendEvent<Event>(block, e, "handleSelectionChange");
  }
  handleSelect(e: Event): void | boolean {
    console.log(e);
    return;
    const block = this.findBlock(
      document.getSelection()?.getRangeAt(0).startContainer
    );
    if (!block) {
      return;
    }
    this.sendEvent<Event>(block, e, "handleSelect");
  }

  handleCompositionEnd(e: CompositionEvent): void | boolean {
    const block = this.findBlock(e.target);
    if (!block) {
      return;
    }
    this.sendEvent<CompositionEvent>(block, e, "handleCompositionEnd");
  }
  handleCompositionStart(e: CompositionEvent): void | boolean {
    const block = this.findBlock(e.target);
    if (!block) {
      return;
    }
    this.sendEvent<CompositionEvent>(block, e, "handleCompositionStart");
  }
  handleCompositionUpdate(e: CompositionEvent): void | boolean {
    const block = this.findBlock(e.target);
    if (!block) {
      return;
    }
    this.sendEvent<CompositionEvent>(block, e, "handleCompositionUpdate");
  }
}

export class Page {
  handler: PageDispatch;
  opHandlers: { [key: string]: OperationHandlerFn } = {};
  blocks: LinkedDict<string, AnyBlock> = new LinkedDict();
  root: HTMLElement | null;
  history: History = globalHistory;
  constructor() {
    this.handler = new PageDispatch(this);
    this.root = null;
  }
  emit(command: Command<any>, executed?: boolean) {
    if (executed) {
      this.history.append(command);
    } else {
      this.history.execute(command);
    }
  }
  registerOp(type: string, handlerFn: OperationHandlerFn) {
    this.opHandlers[type] = handlerFn;
  }

  hover(name: Order) {
    const result = this.blocks.find(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, _] = result;
    tgt.el.classList.add("oh-is-hover");
  }
  unhover(name: Order) {
    const result = this.blocks.find(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, _] = result;
    tgt.el.classList.remove("oh-is-hover");
  }
  /**
   * 在 attribution 上进行改变，并在 page 的变量上进行记录
   * 在光标上不做任何处理，由 handler 内部消化
   * @param name
   */
  activate(name: Order) {
    const result = this.blocks.find(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, _] = result;
    tgt.el.classList.add("oh-is-active");
  }

  findBlock(order: Order): AnyBlock | null {
    const results = this.blocks.find(order);
    if (!results) {
      return null;
    }
    return results[0];
  }

  getPrevBlock(block: AnyBlock): AnyBlock | null {
    const results = this.blocks.previous(block.order!);
    if (!results) {
      return null;
    }
    return results[0];
  }

  getNextBlock(block: AnyBlock): AnyBlock | null {
    let results = this.blocks.next(block.order!);
    if (!results) {
      return null;
    }
    return results[0];
  }

  deactivate(name: Order) {
    const result = this.blocks.find(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, _] = result;
    tgt.el.classList.remove("oh-is-active");
  }

  appendBlock(newBlock: AnyBlock) {
    const [tgt, _] = this.blocks.getLast();
    if (tgt) {
      newBlock.assignOrder(createOrder(tgt.order));
      this.blocks.append(newBlock.order!, newBlock);
    } else {
      newBlock.assignOrder(createOrder());
      this.blocks.append(newBlock.order!, newBlock);
    }
    this.root?.appendChild(newBlock.el);
    return newBlock.order;
  }

  insertBlockBefore(name: Order, newBlock: AnyBlock) {
    const result = this.blocks.find(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, node] = result;
    const prev = node.prev;
    const prevOrder = prev ? prev.value.order : "";

    newBlock.assignOrder(createOrder(prevOrder, tgt.order));
    if (!this.blocks.insertBefore(tgt.order!, newBlock.order!, newBlock)) {
      throw EvalError(`insert before ${tgt.order} failed!`);
    }
    tgt.el.insertAdjacentElement("beforebegin", newBlock.el);
  }
  insertBlockAfter(name: Order, newBlock: AnyBlock) {
    const result = this.blocks.find(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, node] = result;
    const next = node.next;
    const nextOrder = next ? next.value.order : "";

    newBlock.assignOrder(createOrder(tgt.order, nextOrder));
    if (!this.blocks.insertAfter(tgt.order!, newBlock.order!, newBlock)) {
      throw EvalError(`insert before ${tgt.order} failed!`);
    }
    tgt.el.insertAdjacentElement("afterend", newBlock.el);
  }
  removeBlock(name: Order): any {
    const result = this.blocks.pop(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, _] = result;
    tgt.el.remove();
  }
  replaceBlock(name: Order, newBlock: AnyBlock) {
    const result = this.blocks.find(name);
    if (!result) {
      throw EvalError(`name ${name} not exists!`);
    }
    const [tgt, node] = result;
    newBlock.assignOrder(tgt.order!);
    node.value = newBlock;
    tgt.el.replaceWith(newBlock.el);
  }

  render(el: HTMLElement) {
    this.root = el;

    this.handler.bingEventListener(el);
    el.classList.add("oh-editer-root");
    el.contentEditable = "true";
    if (!el.hasChildNodes()) {
      this.appendBlock(new Paragraph());
    }
  }

  dismiss(removeElement?: boolean) {
    if (!this.root) {
      return;
    }
    this.handler.removeEventListener(this.root);
    if (removeElement) {
      this.root.remove();
    } else {
      this.root.classList.remove("oh-editor-root");
    }
    this.root = null;
  }
}
