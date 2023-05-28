import { createElement } from "@ohno-editor/core/helper/document";
import { parentElementWithTag } from "@ohno-editor/core/helper/element";
import {
  IComponent,
  IContainer,
  IInline,
  IPlugin,
} from "@ohno-editor/core/system/base";
import { AnyBlock } from "@ohno-editor/core/system/block";
import {
  BlockEventContext,
  InlineHandler,
} from "@ohno-editor/core/system/handler";
import "./style.css";

export class Highlight implements IPlugin {
  root: HTMLElement;
  name: string = "highlight";
  parent?: IComponent | undefined;

  inlineHandler: { [key: string]: InlineHandler } = {};
  inlineManager: { [key: string]: IInline } = {};
  constructor() {
    this.root = createElement("div", {
      className: "oh-is-highlight",
      textContent: "",
    });
  }

  registerHandler(handler: InlineHandler, manager: IInline) {
    this.root.appendChild(manager.root);
    this.inlineHandler[manager.name] = handler;
    this.inlineManager[manager.name] = manager;
  }

  findInline(node: Node, context: BlockEventContext): HTMLLabelElement | null {
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
