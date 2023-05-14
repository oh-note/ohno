// 分为格式按钮（B，I，Code）和功能按钮（插入 Block）
import {
  createElement,
  createTextNode,
} from "@ohno-editor/core/helper/document";
import { IComponent, IContainer, IPlugin } from "@ohno-editor/core/system/base";
import { AnyBlock } from "@ohno-editor/core/system/block";
import { computePosition } from "@floating-ui/dom";

export interface Option {
  icon: string;
  text: string;
  tips: string;
}
export interface Button {
  icon: string;
  tips: string;
  dropdown?: Option[];
}
export interface ButtonGroup {
  buttons: Button[];
}

export interface ToolbarInit {
  buttonGroup: ButtonGroup[];
}

export class Toolbar implements IPlugin {
  root: HTMLElement;
  name: string = "toolbar";
  parent?: IComponent | undefined;
  constructor(init: ToolbarInit) {
    this.root = createElement("div", {
      className: "oh-is-toolbar",
      style: { position: "absolute" },
    });

    init.buttonGroup.map((group) => {
      const groupEl = createElement("div", { style: { flex: "row" } });
      const els = group.buttons.map((bt) => {
        return createElement("button", { textContent: bt.icon });
      });
      groupEl.append(...els);
      groupEl.append(createTextNode("|"));
      return groupEl;
    });

    this.root.appendChild(createElement("button", { textContent: "B" }));
    this.root.appendChild(createElement("button", { textContent: "I" }));
    this.root.appendChild(createElement("button", { textContent: "A" }));
  }

  hook(): void {
    throw new Error("Method not implemented.");
  }
  destory(): void {
    throw new Error("Method not implemented.");
  }
  setParent(parent?: IContainer | undefined): void {
    this.parent = parent;
  }
  serialize(option?: any): string {
    throw new Error("Method not implemented.");
  }
  equals(component?: IComponent | undefined): boolean {
    throw new Error("Method not implemented.");
  }
  detach(): void {
    throw new Error("Method not implemented.");
  }

  span(block: AnyBlock) {
    computePosition(block.root, this.root, { placement: "left-start" }).then(
      ({ x, y }) => {
        this.root.style.height = block.root.clientHeight + "px";
        this.root.style.backgroundColor = "black";
        Object.assign(this.root.style, {
          left: `${x - 4}px`,
          top: `${y}px`,
        });
      }
    );
  }
}
