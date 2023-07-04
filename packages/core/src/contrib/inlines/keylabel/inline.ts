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
  visualKeyEvent,
} from "@ohno-editor/core/system";
import "./style.css";
import {
  InlineData,
  InlineSerializer,
  LabelData,
  LabelSerializer,
} from "@ohno-editor/core/system/inline";

export class KeyLabel extends InlineBase {
  // options: BackLinkOption[];
  hoveredItem: number = -1;
  status: "onload" | "loaded" = "loaded";

  constructor() {
    super({ name: "keylabel" });
  }

  create(option: Shortcut): HTMLLabelElement {
    const keystr = visualKeyEvent(option);
    const q = createElement("data");
    q.textContent = keystr;
    const ks = keystr.split("+").map((item) => {
      return createElement("kbd", { textContent: item });
    });
    q.replaceChildren(...ks);
    const root = createInline(this.name, [q], option);
    root.appendChild(q);
    return root;
  }

  update(e: KeyboardEvent, context: InlineRangedEventContext) {
    const { inline } = context;
    const q = inline.querySelector("data")!;

    const keystr = visualKeyEvent(e);
    const ks = keystr.split("+").map((item) => {
      return createElement("kbd", { textContent: item });
    });
    q.replaceChildren(...ks);
    this.latest = false;
  }

  activate_subclass(label: HTMLLabelElement, context: BlockEventContext): void {
    const q = label.querySelector("data")!;
    setRange(makeRangeInNode(q, context.range));
  }
}

export class KeyLabelSerializer extends LabelSerializer<KeyLabel> {
  toMarkdown(node: HTMLLabelElement, parent: InlineSerializer): string {
    const text = node.querySelector("kbd")!.textContent;
    return ` [${text}](ohno://label?name=keylabel) `;
  }

  toJson(node: HTMLLabelElement, parent: InlineSerializer): InlineData {
    return [
      {
        type: "label",
        label_type: "keylabel",
        data: { ...node.dataset },
      } as LabelData,
    ];
  }
  deserialize({ data }: LabelData, parent: InlineSerializer): Node[] {
    const { shiftKey, altKey, metaKey, ctrlKey, key, code } = data;
    return [this.manager.create({ shiftKey, ctrlKey, altKey, metaKey, code })];
  }
}
