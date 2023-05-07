import { createElement } from "@/helper/document";
import { parentElementWithTag } from "@/helper/element";
import { IComponent, IContainer, IInline, IPlugin } from "@/system/base";
import { AnyBlock } from "@/system/block";
import {
  EventContext,
  Handler,
  HandlerMethod,
  InlineHandler,
} from "@/system/handler";
import { computePosition, inline } from "@floating-ui/dom";

export class InlineSupport implements IPlugin {
  root: HTMLElement;
  name: string = "inlinesupport";
  parent?: IComponent | undefined;

  inlineHandler: { [key: string]: InlineHandler } = {};
  inlineManager: { [key: string]: IInline } = {};
  constructor() {
    this.root = createElement("div", {
      className: "oh-is-inlinesupport",
      textContent: "",
    });
  }

  registerHandler(handler: InlineHandler, manager: IInline) {
    this.root.appendChild(manager.root);
    this.inlineHandler[manager.name] = handler;
    this.inlineManager[manager.name] = manager;
  }

  findInline(node: Node, context: EventContext): HTMLLabelElement | null {
    const label = parentElementWithTag(node, "label", context.block.root);
    return label as HTMLLabelElement;
  }

  getInlineManager<T extends IInline = IInline>(
    label: HTMLLabelElement | string
  ): T {
    const inlineName =
      typeof label === "string" ? label : label.getAttribute("name");
    if (!inlineName) {
      throw new Error("can not found inline name");
    }
    const manager = this.inlineManager[inlineName];
    if (!manager) {
      throw new Error(`can not found inline manager of ${inlineName}`);
    }
    return manager as T;
  }

  getInlineHandler<T extends InlineHandler = InlineHandler>(
    label: HTMLLabelElement | string
  ): T {
    const inlineName =
      typeof label === "string" ? label : label.getAttribute("name");
    if (!inlineName) {
      throw new Error("can not found inline name");
    }
    const handler = this.inlineHandler[inlineName];
    if (!handler) {
      throw new Error(`can not found inline handler of ${inlineName}`);
    }
    return handler as T;
  }
  destory(): void {}
  setParent(parent?: IContainer | undefined): void {
    this.parent = parent;
  }
}
