import { createElement, createInline } from "@ohno-editor/core/helper/document";
import {
  BlockEventContext,
  UIEventHandleMethods,
} from "@ohno-editor/core/system/handler";
import { InlineBase } from "@ohno-editor/core/system/inline";
import { makeRangeInNode, setRange } from "@ohno-editor/core/system/range";
import { addMarkdownHint } from "@ohno-editor/core/helper/markdown";
import "./style.css";
import { markPlain } from "@ohno-editor/core/helper";

export interface BackLinkOption {
  cite?: string;
  type: "block" | "page" | "link" | "plain";
  content: string;
}

export interface BackLinkInit {
  onLoad: (content: string) => Promise<BackLinkOption[]>;
}

export class BackLink extends InlineBase implements UIEventHandleMethods {
  // options: BackLinkOption[];
  hoveredItem: number = -1;
  component: {
    noresult: HTMLElement;
    onload: HTMLElement;
    failed: HTMLElement;
    results: HTMLElement;

    dropdown: HTMLElement;
    tips: HTMLElement;
  };

  options: BackLinkOption[] = [];

  status: "onload" | "loaded" = "loaded";
  onLoad: (content: string) => Promise<BackLinkOption[]>;
  constructor(init: BackLinkInit) {
    super({ name: "backlink" });
    this.onLoad = init.onLoad;

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
    this.hide(dropdown);
    this.hide(tips);

    results.addEventListener("mousemove", this.handleMouseMove.bind(this));
    results.addEventListener("click", this.handleClick.bind(this));
  }

  create(option?: BackLinkOption): HTMLLabelElement {
    const { cite, type, content } = option || {
      cite: "",
      type: "",
      content: "",
    };
    const q = createElement("q", {
      textContent: content,
      attributes: { cite: cite || "" },
    });
    markPlain(q);

    const root = createInline(this.name, [q], { type });
    addMarkdownHint(root);

    return root;
  }

  toggleComponent(el: HTMLElement) {
    this.component.dropdown.childNodes.forEach((item) => {
      if (item === el) {
        (item as HTMLElement).style.display = "block";
      } else {
        (item as HTMLElement).style.display = "none";
      }
    });
  }

  query() {
    if (!this.current) {
      throw new Error("Sanity check");
    }
    let q = this.current.querySelector("q");
    if (q) {
      // onload
      // query and update content
      //  .then(){}
    }
  }
  hover_subclass(label: HTMLLabelElement, context: BlockEventContext): void {
    const q = label.querySelector("q")!;
    if (q.dataset["type"] === "link") {
      this.component.tips.textContent = q.dataset["cite"] || "";
      this.float(label, this.component.tips, { placement: "top-start" });
    }
  }
  activate_subclass(label: HTMLLabelElement, context: BlockEventContext): void {
    this.component.dropdown.textContent = "waiting for menu";
    this.float(label, this.component.dropdown, { placement: "bottom-start" });
    this.hover_subclass(label, context);
    const q = label.querySelector("q")!;
    const { range } = context;
    setRange(makeRangeInNode(q, range));
  }
  exit_subclass(label: HTMLLabelElement, context: BlockEventContext): void {
    this.hide(this.component.dropdown);
    this.hide(this.component.tips);
  }
  // rangeToLeft() {
  //   const slot = this.current!.querySelector("q")!;
  //   const loc = biasToLocation(slot, 0)!;
  //   setLocation(loc);
  // }
  // rangeToRight() {
  //   const slot = this.current!.querySelector("q")!;
  //   const loc = biasToLocation(slot, -1)!;
  //   setLocation(loc);
  // }
  // rangeToAll() {
  //   const slot = this.current!.querySelector("q")!;
  //   const startLoc = biasToLocation(slot, 0)!;
  //   const endLoc = biasToLocation(slot, -1)!;
  //   setRange(createRange(...startLoc, ...endLoc));
  // }

  // findOption(node: Node): HTMLElement | null {
  //   const option = parentElementWithFilter(
  //     node,
  //     this.component.results,
  //     (el: Node) => {
  //       return el instanceof HTMLElement && getTagName(el) === "option";
  //     }
  //   );
  //   return option;
  // }

  handleMouseMove(e: MouseEvent) {
    // console.log(e);
    // const option = this.findOption(e.target as Node);
    // if (option) {
    //   const index = parseInt(option.dataset["index"]!);
    //   this.onHover(index);
    // }
  }
  handleClick(e: MouseEvent) {
    // const option = this.findOption(e.target as Node);
    // if (option) {
    //   const index = parseInt(option.dataset["index"]!);
    //   this.onSelected(index);
    // }
  }
}
