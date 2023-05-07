import { createElement } from "@/helper/document";
import { IComponent, IContainer, IPlugin } from "@/system/base";
import { AnyBlock } from "@/system/block";
import { computePosition } from "@floating-ui/dom";

export class Toolbar implements IPlugin {
  root: HTMLElement;
  name: string = "toolbar";
  parent?: IComponent | undefined;
  constructor() {
    this.root = createElement("div", {
      className: "oh-is-toolbar",
      style: { position: "absolute" },
    });
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
