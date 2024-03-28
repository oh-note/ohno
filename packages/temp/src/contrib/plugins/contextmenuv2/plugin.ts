import {
  createElement,
  dispatchKeyEvent,
  parentElementWithFilter,
} from "@ohno/core/system/functional";
import {
  IPlugin,
  Page,
  HandlerMethods,
  RangedBlockEventContext,
  MouseElement,
  MouseEventHandleMethods,
  PagesHandleMethods,
  BlockEventContext,
} from "@ohno/core/system/types";
import { FloatingMixin } from "@ohno/core/system/plugin/mixin";
import { Popup } from "@ohno/core/system/contextmenu/imp";
import {
  RawHandlerMethods,
  isHide,
  isMenu,
  isShow,
  markHide,
  markHover,
  markShow,
  removeHover,
} from "@ohno/core/system";
import { LinkedDict } from "@ohno/core/struct";
// import "./style.css";

export interface MenuItemOption {
  content: string;
  hasInput?: boolean;
  handleMethods: Required<"handleClick"> | HandlerMethods;
}

export class ContextMenu
  extends FloatingMixin
  implements IPlugin, PagesHandleMethods
{
  root: HTMLElement;
  name: string = "contextmenu";

  parent?: Page | undefined;
  context?: RangedBlockEventContext;
  filter?: string;
  popup: Popup;
  hover: number = -1;
  visibleElements: HTMLElement[];
  menu: HTMLElement;

  // status
  hoveredItem?: HTMLElement;

  fixedItems: LinkedDict<string, any> = new LinkedDict();
  dynamicItems: LinkedDict<string, any> = new LinkedDict();

  constructor() {
    super();
    this.menu = createElement("div", {
      className: "menu-container",
      children: ["123"],
    });
    this.root = createElement("div", {
      className: "oh-is-contextmenu",
      textContent: "",
      children: [this.menu],
    });
    this.markFloat(this.menu);
    markHide(this.menu);
    this.visibleElements = [];
    this.popup = new Popup();
  }

  public get isOpen(): boolean {
    return isShow(this.menu);
  }

  setHoveredMenu() {}

  destory(): void {
    throw new Error("Method not implemented.");
  }

  setParent(parent?: Page | undefined): void {
    this.parent = parent;
  }

  open(e: MouseEvent, context: RangedBlockEventContext) {
    markShow(this.menu);
    this.context = context;
    this.computePosition(new MouseElement(e), this.menu, { autoUpdate: true });
  }

  close() {
    markHide(this.menu);
    if (this.hoveredItem) {
      removeHover(this.hoveredItem);
      this.hoveredItem = undefined;
    }
  }

  hoverItem(el: HTMLElement) {
    if (this.hoveredItem && el !== this.hoveredItem) {
      removeHover(this.hoveredItem);
    }
    this.hoveredItem = el;
    markHover(el);
  }
  expandItem(el: HTMLElement) {
    return;
  }

  findMenuItem(el: Node): HTMLElement | null {
    return parentElementWithFilter(el, this.menu, (e) => {
      return e instanceof HTMLElement && isMenu(e);
    });
  }

  hoverNextItem() {}
  hoverPrevItem() {}
  expandCurrentItem() {
    return;
  }
  unexpandCurrentItem() {
    return;
  }

  handleClick(e: MouseEvent): boolean | void {}
  handleMouseMove(e: MouseEvent): boolean | void {
    const node = document.elementFromPoint(e.clientX, e.clientY);
    if (!node) {
      return;
    }
    const menu = this.findMenuItem(node);
    if (!menu) {
      return;
    }
    this.hoverItem(menu);
  }

  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    return dispatchKeyEvent(this, e, context);
  }

  handleEscapeDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    this.close();
    return true;
  }

  handleMouseDown(e: MouseEvent, context: BlockEventContext): boolean | void {
    if (this.isOpen) {
      this.close();
    }
  }

  handleContextMenu(
    e: MouseEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    this.open(e, context);
  }
}
