import {
  createElement,
  getDefaultRange,
  innerHTMLToNodeList,
  makeInlineBlock,
} from "@/helper/document";
import {
  getTagName,
  parentElementWithFilter,
  parentElementWithTag,
} from "@/helper/element";
import { EventContext } from "@/system/handler";
import { TextInsert } from "@/contrib/commands";
import katex from "katex";
import { InlineBase, RangeElement } from "@/system/inline";
import { biasToLocation, locationToBias, setOffset } from "@/system/position";
import {
  createRange,
  getValidAdjacent,
  setLocation,
  setRange,
} from "@/system/range";
import { computePosition } from "@floating-ui/dom";
import { InlineSubmit } from "@/contrib/commands/inlineblock";
import { addMarkdownHint, removeMarkdownHint } from "@/helper/markdown";
import "./style.css";

export interface BackLinkOption {
  cite: string;
  type: "block" | "page" | "link" | "plain";
  content: string;
}

export interface BackLinkInit {
  onLoad: (content: string) => Promise<BackLinkOption[]>;
}

export class BackLink extends InlineBase {
  // options: BackLinkOption[];
  hoveredItem: number = 0;
  component: {
    noresult: HTMLElement;
    onload: HTMLElement;
    failed: HTMLElement;
    results: HTMLElement;
  };
  math?: string;
  status: "onload" | "loaded" = "loaded";
  onLoad: (content: string) => Promise<BackLinkOption[]>;
  constructor(init: BackLinkInit) {
    super({ name: "backlink" });
    this.onLoad = init.onLoad;
    this.root.style.position = "absolute";
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
    this.root.append(results, noresult, failed, onload);
    this.component = {
      noresult,
      onload,
      failed,
      results,
    };
    this.hide();
  }

  create(math: string): HTMLLabelElement {
    const root = createElement("label", {
      attributes: { name: "backlink", value: math },
    });
    const content = createElement("q", { textContent: " " });
    root.appendChild(content);
    addMarkdownHint(root);
    return root;
  }

  show() {
    this.root.style.display = "block";
  }

  hide() {
    this.root.style.display = "none";
  }

  toggleComponent(el: HTMLElement) {
    this.root.childNodes.forEach((item) => {
      if (item === el) {
        (item as HTMLElement).style.display = "block";
      } else {
        (item as HTMLElement).style.display = "none";
      }
    });
  }

  update() {
    const slot = this.current!.querySelector("q")!.cloneNode(
      true
    ) as HTMLElement;
    removeMarkdownHint(slot);
    this.status = "onload";
    this.toggleComponent(this.component.onload);
    this.onLoad(slot.textContent?.trim() || "")
      .then((results) => {
        if (results.length === 0) {
          this.toggleComponent(this.component.noresult);
        } else {
          const els = results.map((item) => {
            return createElement("option", {
              textContent: item.content,
              attributes: { cite: item.cite, type: item.type },
            });
          });
          this.component.results.replaceChildren(...els);
          this.toggleComponent(this.component.results);
        }
      })
      .catch(() => {
        this.toggleComponent(this.component.failed);
      })
      .finally(() => {
        this.status = "loaded";
      });
  }

  edit(label: HTMLLabelElement, context: EventContext): void {
    this.show();
    this.context = context;
    this.snap = label.cloneNode(true) as HTMLLabelElement;
    this.current = label;

    computePosition(label, this.root, { placement: "bottom-start" }).then(
      ({ x, y }) => {
        Object.assign(this.root.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      }
    );
    this.update();
  }

  rangeToLeft() {
    const slot = this.current!.querySelector("q")!;
    const loc = biasToLocation(slot, 0)!;
    setLocation(loc);
  }
  rangeToRight() {
    const slot = this.current!.querySelector("q")!;
    const loc = biasToLocation(slot, -1)!;
    setLocation(loc);
  }
  rangeToAll() {
    const slot = this.current!.querySelector("q")!;
    const startLoc = biasToLocation(slot, 0)!;
    const endLoc = biasToLocation(slot, -1)!;
    setRange(createRange(...startLoc, ...endLoc));
  }
  submit() {
    const { page, block } = this.context!;
    const command = new InlineSubmit({
      page,
      label: this.current!,
      old: this.snap!,
      block,
    });
    page.executeCommand(command);
  }

  cancel() {
    this.current?.setAttribute("value", this.snap!.getAttribute("value")!);
    this.current!.innerHTML = this.snap!.innerHTML;
  }

  hover(label: HTMLLabelElement, context: EventContext): void {
    this.hide();
    context.page.blockRoot.addEventListener(
      "focus",
      () => {
        setRange(createRange(label, 0));
      },
      {
        once: true,
      }
    );
    context.page.blockRoot.focus();
  }

  exit(): void {
    this.hide();
    this.context?.page.setActiveInline();
    this.context = undefined;
    this.snap = undefined;
  }
}
