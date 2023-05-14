import { createElement } from "@ohno-editor/core/helper/document";
import { EventContext } from "@ohno-editor/core/system/handler";
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
    const root = createElement("label", {
      attributes: { name: "backlink", type },
    });
    const q = createElement("q", {
      textContent: content,
      attributes: { cite },
    });
    root.appendChild(q);
    addMarkdownHint(root);
    return root;
  }

  show(component: HTMLElement) {
    component.style.display = "block";
  }

  hide(component: HTMLElement) {
    component.style.display = "none";
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

  update() {
    const slot = this.current!.querySelector("q")!.cloneNode(
      true
    ) as HTMLElement;
    removeMarkdownHint(slot);
    this.status = "onload";
    this.toggleComponent(this.component.onload);
    this.hoveredItem = -1;
    this.onLoad(slot.textContent?.trim() || "")
      .then((results) => {
        this.options = results;
        if (results.length === 0) {
          this.toggleComponent(this.component.noresult);
          this.hoveredItem = -1;
        } else {
          const els = results.map((item, index) => {
            const el = createElement("option", {
              textContent: item.content,
              attributes: { cite: item.cite, type: item.type, index },
            });

            return el;
          });
          this.component.results.replaceChildren(...els);
          this.toggleComponent(this.component.results);
          this.onHover(0);
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
    this.show(this.component.dropdown);
    this.context = context;
    this.snap = label.cloneNode(true) as HTMLLabelElement;
    this.current = label;
    this.hoverLabel(label);
    computePosition(label, this.component.dropdown, {
      placement: "bottom-start",
    }).then(({ x, y }) => {
      Object.assign(this.component.dropdown.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
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
      this.onHover(index);
    }
  }
  handleClick(e: MouseEvent) {
    const option = this.findOption(e.target as Node);
    if (option) {
      const index = parseInt(option.getAttribute("index")!);
      this.onSelected(index);
    }
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
    this.hide(this.component.dropdown);
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
    this.hide(this.component.dropdown);
    this.hide(this.component.tips);
    this.context?.page.setActiveInline();
    this.context = undefined;
    this.snap = undefined;
  }

  getOption(index: number): HTMLElement {
    return this.component.results.childNodes[index] as HTMLElement;
  }

  onHover(index: number) {
    if (index !== this.hoveredItem) {
      if (this.hoveredItem >= 0) {
        const oldoption = this.getOption(this.hoveredItem);
        oldoption.classList.remove("hover");
      }

      this.hoveredItem = index;
      const option = this.getOption(index);
      if (option) {
        option.classList.add("hover");
      } else {
        throw new Error("Sanity check.");
      }
    }
  }
  onSelected(index: number) {
    const option = this.getOption(index);
    const { cite, type, content } = this.options[index];
    this.current!.setAttribute("type", type);
    const q = this.current!.querySelector("q")!;
    q.setAttribute("cite", cite);
    q.textContent = content;
    addMarkdownHint(this.current!);
    this.submit();
    this.exit();
  }
  public get resultSize(): number {
    return this.component.results.style.display === "block"
      ? this.component.results.childNodes.length
      : 0;
  }

  simulateArrowDown() {
    const index = (this.hoveredItem + 1) % this.resultSize;
    this.onHover(index);
  }
  simulateArrowUp() {
    let index;
    if (this.hoveredItem === 0) {
      index = this.resultSize - 1;
    } else {
      index = this.hoveredItem - 1;
    }
    this.onHover(index);
  }
  simulateEnter() {
    // if(this.)
    this.onSelected(this.hoveredItem);
  }
  parseOption(label: HTMLLabelElement): BackLinkOption {
    const type = (label.getAttribute("type") ||
      "plain") as BackLinkOption["type"];
    const q = label.querySelector("q")!.cloneNode(true) as HTMLElement;
    removeMarkdownHint(q);
    const cite = q.getAttribute("cite") || "";
    const content = q.textContent || "";

    return { type, cite, content };
  }

  hoverLabel(label: HTMLLabelElement) {
    const { cite, type, content } = this.parseOption(label);
    if (content.trim().length > 0) {
      this.show(this.component.tips);
      if (type === "link") {
        this.component.tips.textContent = cite;
      } else {
        this.component.tips.textContent = type;
      }
      computePosition(label, this.component.tips, {
        placement: "top-start",
      }).then(({ x, y }) => {
        Object.assign(this.component.tips.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      });
    }
  }
  unHoverLabel(label: HTMLLabelElement) {
    this.hide(this.component.tips);
  }
}
