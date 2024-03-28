import {
  parentElementWithTag,
  createElement,
  getValidAdjacent,
} from "@ohno/core/system/functional";
import {
  Page,
  BlockEventContext,
  IPlugin,
} from "@ohno/core/system/types";
import "./style.css";
import { computePosition } from "@floating-ui/dom";
import { SetLinkHref } from "./command";

export class Link implements IPlugin {
  root: HTMLElement;
  name: string = "link";
  parent!: Page;

  focused?: HTMLLinkElement;
  component: {
    input: HTMLInputElement;
  };
  context?: BlockEventContext;
  globalBias?: [number, number];
  constructor() {
    this.root = createElement("div", {
      className: "oh-is-link",
      textContent: "",
    });
    this.root.style.position = "absolute";
    this.root.style.display = "none";
    const component = {
      input: createElement("input", {
        eventHandler: {
          keydown: (e) => {
            if (e.code === "Enter" || e.code === "Tab") {
              const { page, block, range } = this.context!;
              page.focusEditable(() => {
                if (this.globalBias) {
                  page.setLocation(block.getLocation(...this.globalBias!)!);
                } else {
                  page.setLocation(
                    getValidAdjacent(this.focused!, "afterbegin")
                  );
                }
              });
              e.preventDefault();
              e.stopPropagation();
            }
          },
        },
      }),
    };
    this.root.appendChild(component.input);
    component.input.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const command = new SetLinkHref({
        page: this.parent,
        block: this.parent.findBlock(this.focused!)!,
        href: target.value,
        link: this.focused!,
      });
      this.parent.executeCommand(command);
      e.preventDefault();
      e.stopPropagation();
    });

    this.component = component;
  }

  span(link: HTMLLinkElement, context: BlockEventContext) {
    this.root.style.display = "block";
    this.context = context;
    this.focused = link;
    this.component.input.value = link.href;
    const { range, block } = context;

    if (range) {
      this.globalBias = block.getGlobalBiasPair([
        range!.startContainer,
        range!.startOffset,
      ]);
    }

    computePosition(link, this.root, {
      placement: "top-start",
    }).then(({ x, y }) => {
      Object.assign(this.root.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }

  close() {
    this.focused = undefined;
    this.context = undefined;
    this.root.style.display = "none";
  }

  findInline(node: Node, context: BlockEventContext): HTMLLinkElement | null {
    const label = parentElementWithTag(node, "a", context.block.root);
    return label as HTMLLinkElement;
  }

  destory(): void {}
  setParent(parent?: Page | undefined): void {
    this.parent = parent!;
  }
}
