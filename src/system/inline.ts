// inline manager 的基本行为，所有 inline 类（包裹了 label tag）都需要一个 manager 来管理行为（除了默认的格式 tag）
import { createElement } from "@/helper/document";
import { EventContext, Handler } from "./handler";
import { Page } from "./page";
import { ClientRectObject, VirtualElement } from "@floating-ui/dom";
import { IComponent, IContainer, IInline } from "./base";

export interface InlineInit {
  [key: string]: any;
  name: string;
}

/** Each type of inline should extend InlineBase to manager the corresponding HTMLELement  */
export class InlineBase<T extends InlineInit = InlineInit> implements IInline {
  destory(): void {}
  hover(label: HTMLLabelElement, context: EventContext): void {
    this.current = label;
    this.context = context;
  }
  edit(label: HTMLLabelElement, context: EventContext): void {
    this.current = label;
    this.context = context;
    context.page.setActiveInline(label);
  }
  exit(): void {
    // this.context.page.setActiveInline(label);
  }

  onHover() {}
  onEdit() {}

  name: string = "";
  parent?: IComponent | undefined;
  root: HTMLElement;
  current?: HTMLLabelElement;
  snap?: HTMLLabelElement;
  context?: EventContext;
  constructor(init: T) {
    this.root = createElement("div", {
      className: `oh-is-${init.name} inline`,
    });
    this.name = init.name;
  }

  create(payload: any): HTMLLabelElement {
    return createElement("label", { textContent: `not implemented.` });
  }
  setParent(parent?: IContainer | undefined): void {
    this.parent = parent;
  }
}

/**
 * Inline 的 4 种状态：
 *  - unactive：光标在其他位置时的默认状态，正常显示
 *  - hover: 鼠标经过，通过 css 标识，不额外引入代码，浅背景色
 *  - active：从编辑模式退出，或光标移动经过时进入，此时焦点仍然在 page 上，深背景色，会在 page 上注册
 *  - edit：鼠标点击，或激活状态下回车键，此时根据是否有额外的编辑框，Page 可能会失去焦点，深背景色，会在 page 上注册
 */

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
