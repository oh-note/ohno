import {
  createElement,
  innerHTMLToNodeList,
} from "@ohno/core/system/functional";
import {
  IPlugin,
  Page,
  BlockEventContext,
  HandlerMethods,
  RangedBlockEventContext,
  MouseElement,
} from "@ohno/core/system/types";
import { computePosition, flip } from "@floating-ui/dom";
import "./style.css";

import menu from "./menu.html?raw";
import templates from "./templates.html?raw";

const TEMPLATES = new DocumentFragment();
TEMPLATES.append(...innerHTMLToNodeList(templates));
const TEMPLATE_BUTTON = TEMPLATES.querySelector(
  "#button"
) as HTMLTemplateElement;
const TEMPLATE_INPUT_BUTTON = TEMPLATES.querySelector(
  "#input-button"
) as HTMLTemplateElement;

// 大图

export interface MenuItemOption {
  content: string;
  hasInput?: boolean;
  handleMethods: Required<"handleClick"> | HandlerMethods;
}

export class ContextMenu implements IPlugin {
  root: HTMLElement;
  name: string = "contextmenu";

  parent?: Page | undefined;
  context?: RangedBlockEventContext;
  filter?: string;

  hover: number = -1;
  visibleElements: HTMLElement[];
  menu: HTMLElement;
  constructor() {
    this.root = createElement("div", {
      className: "oh-is-contextmenu",
      textContent: "",
      children: [menu],
    });

    this.visibleElements = [];
    this.menu = this.root.querySelector("menu")!;
    this.registerStaticButton({ content: "copy", handleMethods: {} });
  }

  makeButton(menuitemOption: MenuItemOption) {
    const row = TEMPLATE_BUTTON.content.cloneNode(true) as HTMLElement;
    row.querySelector("button")!.innerHTML = menuitemOption.content;
    return row;
  }
  makeInputButton(menuitemOption: MenuItemOption) {
    const row = TEMPLATE_BUTTON.content.cloneNode(true) as HTMLElement;
    row.querySelector("button")!.innerHTML = menuitemOption.content;
    return row;
  }

  destory(): void {
    throw new Error("Method not implemented.");
  }
  setParent(parent?: Page | undefined): void {
    this.parent = parent;
  }

  registerStaticButton(menuitemOption: MenuItemOption) {
    let row;
    if (menuitemOption.hasInput) {
      row = this.makeInputButton(menuitemOption);
    } else {
      row = this.makeButton(menuitemOption);
    }
    this.menu.appendChild(row);
  }

  span(e: MouseEvent, context: BlockEventContext) {
    computePosition(new MouseElement(e), this.root, {
      placement: "bottom-start",
      middleware: [flip()],
    }).then(({ x, y }) => {
      Object.assign(this.root.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }
}
