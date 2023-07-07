import {
  createElement,
  createInline,
  addMarkdownHint,
  makeRangeInNode,
  setRange,
} from "@ohno-editor/core/system/functional";
import { BlockEventContext, InlineBase } from "@ohno-editor/core/system/types";
import "./style.css";

type TODOStatus = "done" | "todo" | "deprecated" | "doing";

export interface TodoitemOption {
  title: string;
  status?: TODOStatus;
  // content: string;
}

export interface TodoItemInit {
  // onLoad: (content: string) => Promise<TodoitemOption[]>;
  [key: string]: any;
}

export const EDIT_EL = "data";

export class TodoItem extends InlineBase {
  // options: BackLinkOption[];
  // hoveredItem: number = -1;
  // component: {
  //   noresult: HTMLElement;
  //   onload: HTMLElement;
  //   failed: HTMLElement;
  //   results: HTMLElement;

  //   dropdown: HTMLElement;
  //   tips: HTMLElement;
  // };

  // options: TodoitemOption[] = [];

  // onLoad: (content: string) => Promise<TodoitemOption[]>;
  constructor(init: TodoItemInit) {
    super({ name: "todoitem" });
  }

  create(option?: TodoitemOption): HTMLLabelElement {
    const { title, status } = option || { title: "" };

    const checkbox = createElement("input", {
      attributes: { type: "checkbox", tabindex: "-1" },
    });
    const titleEl = createElement(EDIT_EL, { textContent: title });

    const root = createInline(this.name, [checkbox, titleEl], { status });
    addMarkdownHint(root);

    return root;
  }

  // update() {
  //   const slot = this.current!.querySelector(EDIT_EL)!.cloneNode(
  //     true
  //   ) as HTMLElement;
  //   removeMarkdownHint(slot);
  //   this.status = "onload";
  //   this.toggleComponent(this.component.onload);
  //   this.hoveredItem = -1;
  //   this.onLoad(slot.textContent?.trim() || "")
  //     .then((results) => {
  //       this.options = results;
  //       if (results.length === 0) {
  //         this.toggleComponent(this.component.noresult);
  //         this.hoveredItem = -1;
  //       } else {
  //         const els = results.map((item, index) => {
  //           const el = createElement("option", {
  //             textContent: item.content,
  //             dataset: { cite: item.cite, type: item.type, index },
  //           });

  //           return el;
  //         });
  //         this.component.results.replaceChildren(...els);
  //         this.toggleComponent(this.component.results);
  //         this.onHover(0);
  //       }
  //     })
  //     .catch(() => {
  //       this.toggleComponent(this.component.failed);
  //     })
  //     .finally(() => {
  //       this.status = "loaded";
  //     });
  // }
  toggleCheckbox() {
    if (this.current) {
      const check = this.current.querySelector("input")!;
      this.latest = false;
      check.checked = !(check.checked || false);
      this.submit(false);
    } else {
      throw new Error("Sanity check");
    }
  }

  hover_subclass(label: HTMLLabelElement, context: BlockEventContext): void {
    const q = label.querySelector(EDIT_EL)!;
  }
  activate_subclass(label: HTMLLabelElement, context: BlockEventContext): void {
    // this.component.dropdown.textContent = "waiting for menu";
    // this.float(label, this.component.dropdown, { placement: "bottom-start" });
    this.hover_subclass(label, context);
    const q = label.querySelector(EDIT_EL)!;
    const { range } = context;
    setRange(makeRangeInNode(q, range));
  }

  exit_subclass(label: HTMLLabelElement, context: BlockEventContext): void {
    // this.hide(this.component.dropdown);
    // this.hide(this.component.tips);
  }
}
