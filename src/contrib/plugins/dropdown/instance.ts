import { createElement, getDefaultRange } from "@/helper/document";
import { Page, PagePluginInstance } from "../../../system/page";
import {
  parentElementWithFilter,
  parentElementWithTag,
} from "@/helper/element";
import { EventContext } from "@/system/handler";
import { TextInsert } from "@/contrib/commands";

export interface Option {
  element?: HTMLElement;
  dynamic?: (dropdown: Dropdown) => HTMLElement;
  type: "element" | "dynamic" | "plain";
  plain?: string;
  filter: string | ((text: string) => boolean);
  onHover?: (context: EventContext) => void;
  onSelect?: (context: EventContext) => void;
}

export class Dropdown implements PagePluginInstance {
  page?: Page;
  context?: EventContext;
  el: HTMLElement;
  options: Option[];
  filtered: Option[];
  hover: number = 0;
  constructor() {
    this.el = createElement("div", {
      className: "oh-is-dropdown",
      style: {
        position: "absolute",
      },
    });
    this.el.style.display = "none";
    this.el.addEventListener("click", this.handleClick.bind(this));
    this.el.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.options = [];
    this.filtered = [];
  }

  assignPage(page: Page) {
    page.pluginRoot.appendChild(this.el);
    this.page = page;
  }

  dismiss() {}
  add(option: Option) {
    this.options.push(option);
  }

  handleMouseMove(e: MouseEvent) {
    const option = parentElementWithFilter(
      e.target as Node,
      this.el,
      (el: Node) => {
        return (
          el instanceof HTMLElement && el.classList.contains("oh-is-option")
        );
      }
    );
    if (option) {
      const index = parseInt(option.getAttribute("index")!);
      if (index !== this.hover) {
        this.hover = index;
        this.onHover();
      }
    }
  }
  handleClick(e: MouseEvent) {
    const option = parentElementWithFilter(
      e.target as Node,
      this.el,
      (el: Node) => {
        return (
          el instanceof HTMLElement && el.classList.contains("oh-is-option")
        );
      }
    );
    if (option) {
      this.onSelect(parseInt(option.getAttribute("index")!));
      this.close();
    }
  }

  onSelect(index?: number) {
    if (!index) {
      index = this.hover;
    }
    if (this.filtered[this.hover]) {
      const fn = this.filtered[this.hover].onSelect;
      if (fn) {
        fn(this.context!);
      }
      return true;
    }
    return false;
  }

  hoverNext() {
    if (this.filtered.length === 0) {
      this.hover = -1;
    } else {
      this.hover -= 1;
      if (this.hover < 0) {
        this.hover = this.filtered.length - 1;
      }
      this.onHover();
    }
  }

  hoverPrev() {
    if (this.filtered.length === 0) {
      this.hover = -1;
    } else {
      this.hover = (this.hover + 1) % this.filtered.length;
      this.onHover();
    }
  }
  onHover() {
    console.log(`Hover ${this.hover}`);
    const fn = this.filtered[this.hover].onHover;
    if (fn) {
      fn(this.context!);
    }
  }

  public update(data?: string) {
    data = data || "";
    const that = this;
    this.filtered = this.options.filter((item) => {
      if (typeof item.filter === "string") {
        return item.filter.indexOf(data!) >= 0;
      } else {
        return item.filter(data!);
      }
    });
    const elements = this.filtered
      .map((item) => {
        if (item.type === "element") {
          return item.element!;
        } else if (item.type === "dynamic") {
          return item.dynamic!(that);
        } else if (item.type === "plain") {
          return createElement("div", { textContent: item.plain! });
        } else {
          throw new Error(`Can not handle option type ${item.type}`);
        }
      })
      .map((item, index) => this.makeOptionElement(item, index));

    this.el.innerHTML = "";
    this.el.append(...elements);
    if (this.filtered.length >= 0) {
      this.hover = 0;
    }
  }

  private makeOptionElement(inner: HTMLElement, index: number) {
    const wrap = createElement("div", { className: "oh-is-option" });
    wrap.setAttribute("index", index + "");
    wrap.appendChild(inner);
    return wrap;
  }
  public get isOpen(): boolean {
    return this.el.style.display !== "none";
  }

  public make(context: EventContext) {
    const { range } = context;
    if (!range) {
      throw new NoRangeError();
    }
    this.context = context;
    this.update();
    this.el.style.display = "block";
  }

  public close() {
    this.el.style.display = "none";
  }
}

export const globalDropdown = new Dropdown();
