import { computePosition } from "@floating-ui/dom";
import { createElement } from "@ohno/core/system/functional";
import { IPlugin, Page } from "@ohno/core/system/types";

export class KeyVis implements IPlugin {
  root: HTMLElement;
  name: string = "keyvis";
  parent?: Page | undefined;
  component: {
    press: HTMLElement;
    down: HTMLElement;
    up: HTMLElement;
  };
  constructor() {
    const press = createElement("div", { className: "press-panel" });
    const down = createElement("div", { className: "down-panel" });
    const up = createElement("div", { className: "up-panel" });
    this.root = createElement("div", {
      className: "oh-is-keyvis",
      style: {
        position: "absolute",
      },
      children: [down, press, up],
    });
    this.component = {
      press,
      down,
      up,
    };
  }
  destory(): void {}
  setParent(parent?: Page): void {
    this.parent = parent;
    if (parent) {
      computePosition(this.root, parent!.blockRoot, {
        placement: "right-start",
      }).then(({ x, y }) => {
        Object.assign(this.root.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      });
    }
  }
}
