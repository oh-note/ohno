import { createElement } from "../../../system/functional";
import { IPlugin, Page } from "../../../system/types";

export class Example implements IPlugin {
  root: HTMLElement;
  name: string = "abc";
  parent?: Page;
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
  setParent(parent?: Page | undefined): void {
    this.parent = parent;
  }
}
