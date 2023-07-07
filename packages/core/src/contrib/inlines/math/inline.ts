import {
  createElement,
  createInline,
  getValidAdjacent,
} from "@ohno-editor/core/system/functional";
import { BlockEventContext, InlineBase } from "@ohno-editor/core/system/types";
import katex from "katex";
import { computePosition } from "@floating-ui/dom";

export interface Option {
  element?: HTMLElement;
  dynamic?: (dropdown: KatexMath) => HTMLElement;
  type: "element" | "dynamic" | "plain";
  plain?: string;
  filter: string | ((text: string) => boolean);
  onHover?: (context: BlockEventContext) => void;
  onSelect?: (context: BlockEventContext) => void;
}

const VALUE_KEY = "math";

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
    this.hide(this.root);
  }

  public get input(): HTMLInputElement {
    return this.components.input;
  }

  handleInputChange(e: Event) {
    const math = ((e as InputEvent).target as any).value;
    this.update(math);
  }

  create(math: string): HTMLLabelElement {
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

    const root = createInline(this.name, [renderedFormula], { math });
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
    this.current!.dataset[VALUE_KEY] = math;
    this.latest = false;
  }

  hover_subclass(label: HTMLLabelElement, context: BlockEventContext): void {
    this.hide(this.root);
    const { page } = context;
    page.focusEditable();
    page.setLocation([label, 0]);
  }

  activate_subclass(label: HTMLLabelElement, context: BlockEventContext): void {
    this.show(this.root);
    this.input.value = label.dataset[VALUE_KEY]!;
    computePosition(label, this.root, { placement: "top-start" }).then(
      ({ x, y }) => {
        Object.assign(this.root.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      }
    );
    this.input.focus({
      preventScroll: true,
    });
  }

  exit_subclass(label: HTMLLabelElement, context: BlockEventContext): void {
    this.hide(this.root);
    const { page } = context;
    page.focusEditable(() => {
      page.setLocation(getValidAdjacent(label, "afterend"));
    });
  }
}
