import {
  createElement,
  innerHTMLToNodeList,
  makeInlineBlock,
} from "@/helper/document";
import { EventContext } from "@/system/handler";
import katex from "katex";
import { Inline } from "@/system/inline";
import { createRange, setRange } from "@/system/range";
import { computePosition } from "@floating-ui/dom";
import { IBlockSubmit } from "@/contrib/commands/inlineblock";

export interface Option {
  element?: HTMLElement;
  dynamic?: (dropdown: InlineMath) => HTMLElement;
  type: "element" | "dynamic" | "plain";
  plain?: string;
  filter: string | ((text: string) => boolean);
  onHover?: (context: EventContext) => void;
  onSelect?: (context: EventContext) => void;
}

export class InlineMath extends Inline<Option> {
  options: Option[];
  filtered: Option[];
  hover: number = 0;

  math?: string;
  components: {
    input: HTMLInputElement;
    ok: HTMLButtonElement;
    cancel: HTMLButtonElement;
  };

  constructor(init?: Option) {
    super(init);
    this.components = {
      input: createElement("input"),
      ok: createElement("button", { textContent: "√" }),
      cancel: createElement("button", { textContent: "x" }),
    };
    this.input.addEventListener("input", this.handleInputChange.bind(this));
    this.input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.submit();
        this.activate(this.context!, this.current!);
      }
    });
    this.components.ok.addEventListener("click", () => {
      this.onActivate(this.context!, this.current!);
    });
    this.ui.appendChild(this.input);
    this.ui.appendChild(this.components.ok);
    this.ui.appendChild(this.components.cancel);
    this.options = [];
    this.filtered = [];
  }

  handleInputChange(e: Event) {
    const math = ((e as InputEvent).target as any).value;
    console.log(math);
    this.update(math);
  }

  create(math: string) {
    const renderedFormula = katex.renderToString(math, { output: "mathml" });

    const wrap = makeInlineBlock({
      attributes: { value: math },
      el: innerHTMLToNodeList(renderedFormula),
      serailizer: "katex",
    });
    return wrap;
  }

  update(math: string) {
    const renderedFormula = katex.renderToString(math, { output: "mathml" });
    this.current!.innerHTML = renderedFormula;
    // this.math = math;
    this.current!.setAttribute("value", math);
  }

  submit() {
    const { page, block } = this.context!;
    const command = new IBlockSubmit({
      page,
      label: this.current!,
      old: this.snap!,
      block,
    });
    page.executeCommand(command);
  }
  cancel() {
    this.current?.replaceWith(this.snap!);
  }

  public get input(): HTMLInputElement {
    return this.components.input;
  }

  onEdit(context: EventContext, inline: HTMLElement): void {
    this.show();
    this.input.value = inline.getAttribute("value") || "";
    this.input.focus();
    this.ui;
    // const rangeEl = new RangeElement(context.range!);
    computePosition(inline, this.ui, { placement: "top" }).then(({ x, y }) => {
      Object.assign(this.ui.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }
  onActivate(context: EventContext, inline: HTMLElement): void {
    context.page.blockRoot.addEventListener(
      "focus",
      () => {
        setRange(createRange(this.current, 0));
      },
      {
        once: true,
      }
    );
    this.hide();
    context.page.blockRoot.focus();
  }

  onDeactivate(context: EventContext, inline?: HTMLElement | undefined): void {
    this.hide();
  }
}

export const globalDropdown = new InlineMath();
