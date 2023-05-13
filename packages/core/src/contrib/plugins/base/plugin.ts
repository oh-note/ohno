import { createElement } from "@/helper/document";
import { IComponent, IContainer, IPlugin } from "@/system/base";

export class Example implements IPlugin {
  root: HTMLElement;
  name: string = "abc";
  parent?: IComponent | undefined;
  constructor() {
    this.root = createElement("div", {
      className: "oh-is-example",
      textContent: "",
    });
    throw new Error("class not implemented.");
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
}
