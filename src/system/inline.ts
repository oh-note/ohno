import { createElement } from "@/helper/document";
import { EventContext, Handler, HandlerOption } from "./handler";
import { Page } from "./page";
import { getTagName, parentElementWithFilter } from "@/helper/element";
import { ClientRectObject, VirtualElement } from "@floating-ui/dom";

export interface InlineInit {
  [key: string]: any;
}

/**
 * Inline 的 4 种状态：
 *  - unactive：光标在其他位置时的默认状态，正常显示
 *  - hover: 鼠标经过，通过 css 标识，不额外引入代码，浅背景色
 *  - active：从编辑模式退出，或光标移动经过时进入，此时焦点仍然在 page 上，深背景色，会在 page 上注册
 *  - edit：鼠标点击，或激活状态下回车键，此时根据是否有额外的编辑框，Page 可能会失去焦点，深背景色，会在 page 上注册
 */
export class Inline<T extends InlineInit> {
  ui: HTMLElement;
  context?: EventContext;
  type: string = "";
  init?: T;
  page?: Page;
  status: { [key: string]: any } = {};

  snap?: HTMLElement;

  constructor(init?: T) {
    this.init = init;
    this.ui = createElement("div", {
      id: `inline-${this.type}`,
      className: "oh-is-inline",
      style: {
        zIndex: 10000,
        position: "absolute",
        display: "none",
      },
    });
  }

  public get current(): HTMLElement | undefined {
    if (!this.context) {
      return undefined;
    }
    return this.context.page.status.activeInline;
  }

  // findInline(range?: Range): HTMLElement | null {
  //   if (!range) {
  //     return null;
  //   }
  //   return parentElementWithFilter(
  //     range.startContainer,
  //     this.page!.blockRoot,
  //     (el) => {
  //       return getTagName(el) === "label";
  //     }
  //   );
  // }

  findInline(container: Node): HTMLElement | null {
    throw new Error('not implemented')
  };

  create(payload: any): HTMLElement {
    return createElement("div");
  }

  update(payload: any) {}

  show() {
    this.ui.style.display = "block";
  }
  hide() {
    this.ui.style.display = "none";
  }
  activate(context: EventContext, inline: HTMLElement) {
    this.context = context;
    context.page.activateInline(inline);

    this.onActivate(context, inline);
  }

  onActivate(context: EventContext, inline: HTMLElement) {}

  edit(context: EventContext, inline: HTMLElement) {
    this.snap = inline.cloneNode(true) as HTMLElement;
    this.context = context;
    context.page.activateInline(inline);
    this.onEdit(context, inline);
  }

  onEdit(context: EventContext, inline: HTMLElement) {}
  onDeactivate(context: EventContext, inline?: HTMLElement) {}
  deactivate() {
    if (this.context) {
      this.onDeactivate(this.context, this.current);
      this.context.page.deactivateInline();
    }
  }

  assignPage(page: Page) {
    this.page = page;
    page.pluginRoot.appendChild(this.ui);
  }
}

export interface InlineOption {
  instance: Inline<any>;
}

export class InlineHandler extends Handler {
  declare option: InlineOption;
  instance: Inline<any>;
  constructor(option: InlineOption) {
    super(option);
    this.instance = option.instance;
  }

  // open(context: BlockEventContext) {
  //   this.instance.activate(context);
  // }

  // close() {}
}

export class RangeElement implements VirtualElement {
  range: Range;
  constructor(range: Range) {
    this.range = range;
    this.contextElement = this.range.startContainer as Element;
  }
  getBoundingClientRect(): ClientRectObject {
    return this.range.getBoundingClientRect();
  }
  contextElement?: Element | undefined;
}
