import { createElement } from "@ohno-editor/core/helper/document";
import { IComponent, IContainer, IPlugin } from "@ohno-editor/core/system/base";

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
  destory(): void {
    throw new Error("Method not implemented.");
  }
  setParent(parent?: IContainer | undefined): void {
    this.parent = parent;
  }
}
