import { createElement } from "@ohno-editor/core/helper/document";
import { IComponent, IContainer, IPlugin } from "@ohno-editor/core/system/base";
import { AnyBlock } from "@ohno-editor/core/system/block";
import { computePosition } from "@floating-ui/dom";
import "./style.css";

export class Placeholder implements IPlugin {
  root: HTMLElement;
  name: string = "placeholder";
  parent?: IComponent | undefined;
  current?: AnyBlock;
  constructor() {
    this.root = createElement("div", {
      className: "oh-is-placeholder",
      textContent: "",
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

  span(block: AnyBlock, force?: boolean) {
    this.root.style.height = block.root.clientHeight + "px";
    if (this.current !== block || force) {
      this.current = block;
      computePosition(block.root, this.root, { placement: "left-start" }).then(
        ({ x, y }) => {
          // this.root.style.backgroundColor = "black";
          Object.assign(this.root.style, {
            left: `${x - 8}px`,
            top: `${y}px`,
          });
        }
      );
    }
  }
}
