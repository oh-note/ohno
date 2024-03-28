import { createElement, isTag, parentElementWithTag } from "../functional";
import { OH_INLINEBLOCK } from "./const";

export interface InlineBlock {
  serailizer: string;
  el: Node[];
  attributes?: { [key: string]: string };
}

export function makeInlineBlock(inline: InlineBlock) {
  const res = createElement("label", {
    children: inline.el,
    className: OH_INLINEBLOCK,
    attributes: Object.assign({}, inline.attributes, {
      serializer: inline.serailizer,
    }),
    style: { display: "inline-block" },
  });
  return res;
}

export function createInline(
  name: string,
  children?: (Node | string)[],
  dataset?: {
    [key: string]: any;
    name?: never;
  }
): HTMLLabelElement {
  if (dataset && dataset["name"]) {
    throw new Error("dataset can not assign value of key `name` ");
  }
  const res = createElement("label", {
    children,
    className: `${OH_INLINEBLOCK} ${name}`,
    style: { display: "inline-block" },
    dataset: { name },
  });
  dataset = dataset || {};
  for (const key in dataset) {
    res.dataset[key] = dataset[key];
  }

  return res;
}

export function isInlineBlock(node: Node) {
  return isTag(node, "label");
}
