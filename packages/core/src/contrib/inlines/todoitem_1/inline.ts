import { createElement } from "@ohno-editor/core/helper/document";
import { BlockEventContext } from "@ohno-editor/core/system/handler";
import { InlineBase } from "@ohno-editor/core/system/inline";
import { biasToLocation } from "@ohno-editor/core/system/position";
import {
  createRange,
  getValidAdjacent,
  setLocation,
  setRange,
} from "@ohno-editor/core/system/range";
import { computePosition } from "@floating-ui/dom";
import { InlineSubmit } from "@ohno-editor/core/contrib/commands/inlineblock";
import {
  addMarkdownHint,
  removeMarkdownHint,
} from "@ohno-editor/core/helper/markdown";
import "./style.css";
import {
  getTagName,
  parentElementWithFilter,
} from "@ohno-editor/core/helper/element";

export interface TodoItemPayload {
  done?: boolean;
  content: string;
}
export interface TodoItemInit {
  [key: string]: any;
}

export class TodoItem extends InlineBase {
  // options: BackLinkOption[];
  hoveredItem: number = -1;

  constructor() {
    super({ name: "todoitem" });
  }

  create(option?: TodoItemPayload): HTMLLabelElement {
    const { done, content } = option || { done: false, content: " " };

    const root = createElement("label", {
      attributes: { name: "todoitem" },
    });
    const input = createElement("input", {
      attributes: {
        type: "checkbox",
      },
    });
    const q = createElement("span", {
      textContent: content,
    });
    root.appendChild(input);
    root.appendChild(q);
    addMarkdownHint(root);
    return root;
  }

  activate_subclass(label: HTMLLabelElement, context: BlockEventContext): void {
    label.querySelector("");
  }
}
