import { parentElementWithTag, createElement } from "../functional";

import "./style.css";
import {
  isHover,
  markActivate,
  markHover,
  removeActivate,
  removeHover,
} from "../status";
import {
  Page,
  InlineHandler,
  IPlugin,
  IInline,
  BlockEventContext,
} from "../types";

export interface InlineMutexResult {
  set?: HTMLLabelElement;
  unset?: HTMLLabelElement;
}

export class InlineSupport implements IPlugin {
  root: HTMLElement;
  name: string = "inlinesupport";
  parent?: Page;
  hoveredCount: number = 0;
  mouseHoveredInline?: HTMLLabelElement;
  cursorHoveredInline?: HTMLLabelElement;
  activeInline?: HTMLLabelElement;
  inlineHandler: { [key: string]: InlineHandler } = {};
  inlineManager: { [key: string]: IInline } = {};
  constructor() {
    this.root = createElement("div", {
      className: "oh-is-inlinesupport",
      textContent: "",
    });
  }
  setHoveredInline(
    from: "mouse" | "cursor" | undefined,
    inline?: HTMLLabelElement | undefined
  ): InlineMutexResult {
    const res: InlineMutexResult = {};
    const oldInline =
      from === "mouse" ? this.mouseHoveredInline : this.cursorHoveredInline;
    if (from === "mouse") {
      this.mouseHoveredInline = inline;
    } else {
      this.cursorHoveredInline = inline;
    }
    if (
      oldInline &&
      this.mouseHoveredInline !== oldInline &&
      this.cursorHoveredInline !== oldInline
    ) {
      removeHover(oldInline);
      res.unset = oldInline;
    }
    if (inline && !isHover(inline)) {
      markHover(inline);
      res.set = inline;
    }
    return res;
  }
  setActiveInline(inline?: HTMLLabelElement | undefined): InlineMutexResult {
    const res: InlineMutexResult = {};
    if (this.activeInline === inline) {
      // 已在激活状态的不做处理
      return res;
    }
    if (this.activeInline) {
      removeActivate(this.activeInline);
      res.unset = this.activeInline;
    }
    if (inline) {
      markActivate(inline);
      res.set = inline;
    }
    this.activeInline = inline;
    return res;
  }

  registerHandler(handler: InlineHandler, manager: IInline) {
    this.root.appendChild(manager.root);
    this.inlineHandler[manager.name] = handler;
    this.inlineManager[manager.name] = manager;
    manager.setInlineManager(this);
  }

  findInline(node: Node, context: BlockEventContext): HTMLLabelElement | null {
    const label = parentElementWithTag(node, "label", context.block.root);
    return label as HTMLLabelElement;
  }

  getInlineManager<T extends IInline = IInline>(
    label: HTMLLabelElement | string
  ): T {
    const inlineName =
      typeof label === "string" ? label : label.dataset["name"];
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
      typeof label === "string" ? label : label.dataset["name"];
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
  setParent(parent?: Page): void {
    this.parent = parent;
  }
}

import { PluginComponent } from "@ohno-editor/core/system/types";
// import {} from "./handler";
import { InlineSupportPluginHandler } from "./handler";

export function InlineSupportPlugin(): PluginComponent {
  const manager = new InlineSupport();
  return {
    manager: manager,
    handlers: {
      plugins: new InlineSupportPluginHandler(),
    },
  };
}
