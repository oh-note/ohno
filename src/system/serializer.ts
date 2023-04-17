import {
  HTMLElementTagName,
  createElement,
  createTextNode,
} from "@helper/document";
import { getTagName, isHTMLElement, isTextNode } from "@helper/element";

export interface Segment {
  value: string;
  format: HTMLElementTagName[];
  index: number[];
}

export function serializeNode(
  el: Node,
  context?: HTMLElementTagName[],
  group?: number[]
): Segment[] {
  const res: Segment[] = [];
  context = context || [];
  group = group || [0];
  if (isTextNode(el)) {
    res.push({ format: context, value: el.textContent!, index: group });
  } else if (isHTMLElement(el)) {
    if (el.childNodes.length === 0) {
      res.push({
        value: "",
        format: context?.slice().concat(getTagName(el) as HTMLElementTagName),
        index: group,
      });
    }

    el.childNodes.forEach((item, index) => {
      res.push(
        ...serializeNode(
          item,
          context?.slice().concat(getTagName(el) as HTMLElementTagName),
          group!.slice().concat(index)
        )
      );
    });
  }

  return res;
}

/**
 * 所有空元素（没有格式且没有文本）会被忽略
 *
 * 这一筛选可以帮助局部序列化判断边界
 * @param el
 * @returns
 */
export function serialize(...el: Node[]): Segment[] {
  const res: Segment[] = [];
  el.forEach((item, index) => {
    res.push(...serializeNode(item, undefined, [index]));
  });
  return res.filter((item) => {
    return item.format.length > 0 || item.value.length > 0;
  });
}

export function deserialize(...seg: Segment[]): Node[] {
  const root = createElement("p");

  for (const { value, format, index } of seg) {
    let cur: HTMLElement = root;
    for (let i = 0; i < format.length; i++) {
      const ind = index[i];
      if (cur.childNodes[ind]) {
        cur = cur.childNodes[ind] as HTMLElement;
      } else {
        const child = createElement(format[i]);
        cur.appendChild(child);
        cur = child;
      }
    }
    cur.appendChild(createTextNode(value));
  }

  return Array.from(root.childNodes);
}
