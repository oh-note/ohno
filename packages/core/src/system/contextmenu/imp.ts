import { VirtualElement } from "@floating-ui/dom";
import { createElement, parentElementWithFilter } from "../functional";
import { isHTMLElement, markHide, markShow } from "../status";
import {
  BlockEventContext,
  Icon,
  MouseEventHandleMethods,
  RangedBlockEventContext,
  UIEventHandleMethods,
} from "../types";

export type Query = string;

export interface Menu {
  icon: Icon;
  content: string;
  submenu?: Menu[];

  // handleMouseEnter: MouseEventHandleMethods["handleMouseEnter"];
  // handleMouseLeave: MouseEventHandleMethods["handleMouseLeave"];
  // handleMouseDown: MouseEventHandleMethods["handleMouseDown"];
  // handleMouseUp: MouseEventHandleMethods["handleMouseUp"];
  // handleMouseMove: MouseEventHandleMethods["handleMouseMove"];
  handleClick?: MouseEventHandleMethods["handleClick"];
  // handleContextMenu: MouseEventHandleMethods["handleContextMenu"];
}

export class Popup implements UIEventHandleMethods {
  root: HTMLElement;
  map: { [key: string]: MenuGroup } = {};
  attached: string[] = [];

  hoveredMenuGroup?: MenuGroup;
  hoveredItem?: HTMLElement;

  constructor() {
    this.root = createElement("div", {
      className: "oh-is-contextmenu",
      style: { display: "absolute" },
    });
    this.root.addEventListener("click", this.onClick.bind(this));
  }

  addMenuGroup(group: MenuGroup) {
    this.map[group.namespace] = group;
    group.setParent(this);
    group.root.dataset["namespace"] = group.namespace;
    group.root.dataset["namespace"] = group.namespace;
  }

  findMenuGroup(node: Node) {
    return parentElementWithFilter(node, this.root, (e) => {
      if (e instanceof HTMLElement) {
        return e.dataset["namespace"] !== undefined;
      }
      return true;
    });
  }

  attach(namespace: string) {
    this.root.appendChild(this.map[namespace].root);
    this.attached.push(namespace);
  }
  detach(namespace: string) {
    this.map[namespace].root.remove();
    this.attached.splice(this.attached.indexOf(namespace), 1);
  }
  detachAll() {
    this.root.replaceChildren();
    this.attached = [];
  }

  filter(query: Query) {}

  selectNextItem(el: HTMLElement) {}
  selectPrevItem(el: HTMLElement) {}

  onClick(e: MouseEvent) {}
  onMouseMove(e: MouseEvent) {}

  show(ref: VirtualElement) {
    markShow(this.root);
  }

  hide() {
    markHide(this.root);
  }

  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {}
  handleMouseMove(e: MouseEvent, context: BlockEventContext): boolean | void {}
}

export abstract class MenuGroup {
  abstract root: HTMLElement;
  namespace: string;
  parent!: Popup;
  constructor(namespace: string) {
    this.namespace = namespace;
  }

  setParent(parent: Popup) {
    this.parent = parent;
  }

  abstract filter(query: Query): void;
  abstract firstItem(): HTMLElement;
  abstract lastItem(): HTMLElement;
  abstract nextItem(el: HTMLElement): HTMLElement | null;
  abstract prevItem(el: HTMLElement): HTMLElement | null;
  abstract findItemFromNode(node: Node): HTMLElement;
  abstract onSeelectItem(el: HTMLElement): void;
  abstract onMouseEnter(e: HTMLElement): void;
  abstract onMouseLeave(e: HTMLElement): void;
  abstract onMouseHold(e: HTMLElement): void;
}

export class CommonMenuGroup extends MenuGroup {
  root: HTMLElement;
  constructor(namespace: string) {
    super(namespace);
    this.root = createElement("div", { className: "common-menugroup" });
  }
  createMenuElement(menu: Menu) {
    createElement("li");
  }
  addMenu(menu: Menu) {}

  filter(query: string): void {
    throw new Error("Method not implemented.");
  }
  firstItem(): HTMLElement {
    throw new Error("Method not implemented.");
  }
  lastItem(): HTMLElement {
    throw new Error("Method not implemented.");
  }
  nextItem(el: HTMLElement): HTMLElement | null {
    throw new Error("Method not implemented.");
  }
  prevItem(el: HTMLElement): HTMLElement | null {
    throw new Error("Method not implemented.");
  }
  findItemFromNode(node: Node): HTMLElement {
    throw new Error("Method not implemented.");
  }
  onSeelectItem(el: HTMLElement): void {
    throw new Error("Method not implemented.");
  }
  onMouseEnter(e: HTMLElement): void {
    throw new Error("Method not implemented.");
  }
  onMouseLeave(e: HTMLElement): void {
    throw new Error("Method not implemented.");
  }
  onMouseHold(e: HTMLElement): void {
    throw new Error("Method not implemented.");
  }
}
