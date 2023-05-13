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
import { setOffset } from "@/system/position";
import { createRange, getValidAdjacent, setRange } from "@/system/range";
import { computePosition } from "@floating-ui/dom";
import { InlineSubmit } from "@/contrib/commands/inlineblock";

export interface Option {
  element?: HTMLElement;
  dynamic?: (dropdown: KatexMath) => HTMLElement;
  type: "element" | "dynamic" | "plain";
  plain?: string;
  filter: string | ((text: string) => boolean);
  onHover?: (context: EventContext) => void;
  onSelect?: (context: EventContext) => void;
}

export class KatexMath extends InlineBase {
  options: Option[];
  filtered: Option[];
  hoveredItem: number = 0;

  math?: string;
  components: {
    input: HTMLInputElement;
    ok: HTMLButtonElement;
    cancel: HTMLButtonElement;
  };
  constructor(init?: Option) {
    super({ name: "math" });
    this.components = {
      input: createElement("input"),
      ok: createElement("button", { textContent: "√" }),
      cancel: createElement("button", { textContent: "x" }),
    };
    this.input.addEventListener("input", this.handleInputChange.bind(this));
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.submit();
        this.hover(this.current!, this.context!);
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === "Escape") {
        this.cancel();
        this.hover(this.current!, this.context!);
        e.preventDefault();
        e.stopPropagation();
      }
    });
    this.components.ok.addEventListener("click", () => {
      this.submit();
      this.hover(this.current!, this.context!);
    });
    this.components.cancel.addEventListener("click", () => {
      this.cancel();
      this.hover(this.current!, this.context!);
    });
    this.root.style.position = "absolute";
    this.root.appendChild(this.input);
    this.root.appendChild(this.components.ok);
    this.root.appendChild(this.components.cancel);
    this.options = [];
    this.filtered = [];
    this.hide();
  }

  public get input(): HTMLInputElement {
    return this.components.input;
  }

  handleInputChange(e: Event) {
    const math = ((e as InputEvent).target as any).value;
    this.update(math);
  }

  create(math: string): HTMLLabelElement {
    const root = createElement("label", {
      attributes: { name: "math", value: math },
    });
    let renderedFormula;
    try {
      // 尝试使用 katex.renderToString 渲染表达式
      renderedFormula = katex.renderToString(math, { output: "mathml" });
    } catch (error) {
      // 渲染失败，将错误信息作为 HTML 内容返回
      renderedFormula = `<span style="color: red;">${
        (error as any).message
      }</span>`;
    }
    root.innerHTML = renderedFormula;
    return root;
  }

  update(math: string) {
    let renderedFormula;
    try {
      // 尝试使用 katex.renderToString 渲染表达式
      renderedFormula = katex.renderToString(math, { output: "mathml" });
    } catch (error) {
      // 渲染失败，将错误信息作为 HTML 内容返回
      renderedFormula = `<span style="color: red;">${
        (error as any).message
      }</span>`;
    }
    this.current!.innerHTML = ` ${renderedFormula} `;
    this.current!.setAttribute("value", math);
  }

  show() {
    this.root.style.display = "block";
  }

  hide() {
    this.root.style.display = "none";
  }

  edit(label: HTMLLabelElement, context: EventContext): void {
    this.show();
    this.context = context;
    this.snap = label.cloneNode(true) as HTMLLabelElement;
    this.current = label;
    this.input.value = label.getAttribute("value")!;
    computePosition(label, this.root, { placement: "top-start" }).then(
      ({ x, y }) => {
        Object.assign(this.root.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      }
    );
    this.input.focus();
  }

  submit() {
    if (this.current!.innerHTML !== this.snap!.innerHTML) {
      const { page, block } = this.context!;
      const command = new InlineSubmit({
        page,
        label: this.current!,
        old: this.snap!,
        block,
      });
      page.executeCommand(command);
    }
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

export const globalDropdown = new KatexMath();
