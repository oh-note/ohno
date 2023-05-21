import {
  createElement,
  getTagName,
  parentElementWithFilter,
} from "@ohno-editor/core/helper";
import { IComponent, IContainer } from "@ohno-editor/core/system";

export class OptionMenu {
  component: {
    noresult: HTMLElement;
    onload: HTMLElement;
    failed: HTMLElement;
    results: HTMLElement;

    dropdown: HTMLElement;
    tips: HTMLElement;
  };

  root: HTMLElement;
  constructor() {
    this.root = createElement("menu");

    const onload = createElement("div", {
      style: { display: "none" },
      className: "onload",
      textContent: "onload",
    });
    const noresult = createElement("div", {
      style: { display: "none" },
      className: "noresult",
      textContent: "noresult",
    });
    const failed = createElement("div", {
      style: { display: "none" },
      className: "failed",
      textContent: "failed",
    });
    const results = createElement("div", {
      style: { display: "none" },
      className: "results",
    });
    const tips = createElement("div", { className: "tips" });
    const dropdown = createElement("div", { className: "dropdown" });
    dropdown.style.position = "absolute";
    tips.style.position = "absolute";
    dropdown.append(results, noresult, failed, onload);
    this.root.append(tips, dropdown);
    this.component = {
      noresult,
      onload,
      failed,
      results,
      dropdown,
      tips,
    };
    results.addEventListener("mousemove", this.handleMouseMove.bind(this));
    results.addEventListener("click", this.handleClick.bind(this));
  }

  findOption(node: Node): HTMLElement | null {
    const option = parentElementWithFilter(
      node,
      this.component.results,
      (el: Node) => {
        return el instanceof HTMLElement && getTagName(el) === "option";
      }
    );
    return option;
  }

  handleMouseMove(e: MouseEvent) {
    console.log(e);
    const option = this.findOption(e.target as Node);
    if (option) {
      const index = parseInt(option.getAttribute("index")!);
    }
  }
  handleClick(e: MouseEvent) {
    const option = this.findOption(e.target as Node);
    if (option) {
      const index = parseInt(option.getAttribute("index")!);
    }
  }

  detach(): void {
    throw new Error("Method not implemented.");
  }
  equals(component?: IComponent | undefined): boolean {
    throw new Error("Method not implemented.");
  }
  serialize(option?: any) {
    throw new Error("Method not implemented.");
  }
  toMarkdown(range?: Range | undefined): string {
    throw new Error("Method not implemented.");
  }
}
