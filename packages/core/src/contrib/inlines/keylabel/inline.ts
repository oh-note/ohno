import { createElement, createInline } from "@ohno-editor/core/helper/document";
import { InlineBase } from "@ohno-editor/core/system/inline";
import { addMarkdownHint } from "@ohno-editor/core/helper/markdown";
import {
  BlockEventContext,
  InlineRangedEventContext,
  Page,
  ShortCutManager,
  Shortcut,
  makeRangeInNode,
  setRange,
} from "@ohno-editor/core/system";
import "./style.css";

export class KeyLabel extends InlineBase {
  // options: BackLinkOption[];
  hoveredItem: number = -1;
  status: "onload" | "loaded" = "loaded";

  constructor() {
    super({ name: "keylabel" });
  }

  create(option: Shortcut): HTMLLabelElement {
    const shortcut = !this.parent
      ? new ShortCutManager()
      : (this.parent as Page).shortcut;

    const res = shortcut.find(option);
    const keystr = shortcut.visualKeyEvent(option);
    // const hits = Array.from(res).join(", ");

    const q = createElement("data");
    q.textContent = keystr;
    const ks = keystr.split("+").map((item) => {
      return createElement("kbd", { textContent: item });
    });
    q.replaceChildren(...ks);
    const root = createInline(this.name, [q]);

    root.appendChild(q);
    addMarkdownHint(root);
    return root;
  }

  update(e: KeyboardEvent, context: InlineRangedEventContext) {
    const { inline, page } = context;
    const q = inline.querySelector("data")!;
    // const hits = Array.from(page.shortcut.find(e)).join(", ");
    const keystr = page.shortcut.visualKeyEvent(e);
    const ks = keystr.split("+").map((item) => {
      return createElement("kbd", { textContent: item });
    });
    q.replaceChildren(...ks);
    addMarkdownHint(q);
    this.latest = false;
  }

  activate_subclass(label: HTMLLabelElement, context: BlockEventContext): void {
    const q = label.querySelector("data")!;
    setRange(makeRangeInNode(q, context.range));
  }
}
