import {
  OH_MDHINT_LEFT,
  OH_MDHINT_RIGHT,
  tagToHint,
  tagToHintRight,
} from "./const";
import {
  createElement,
  firstValidChild,
  getTagName,
  isHTMLElement,
} from "../functional";
import { ValidNode } from "../types";

function makeHintLeft(content: string): HTMLElement {
  return createElement("span", {
    textContent: content,
    className: OH_MDHINT_LEFT,
  });
}
function makeHintRight(content: string): HTMLElement {
  return createElement("span", {
    textContent: content,
    className: OH_MDHINT_RIGHT,
  });
}

export function removeMarkdownHint(...roots: Node[]) {
  roots.forEach((root) => {
    const childNodes = root.childNodes;
    if (!childNodes) {
      return;
    }
    for (let i = childNodes.length - 1; i >= 0; i--) {
      const childNode = childNodes[i];
      if (childNode instanceof HTMLElement) {
        if (isHintHTMLElement(childNode)) {
          childNode.remove();
        } else {
          removeMarkdownHint(childNode as HTMLElement);
        }
      }
    }
  });
}

/**
 * <p><b>text</b></p>
 * <p><b><span>**</span>text<span>**</span></b></p>
 */
export function addMarkdownHint(...roots: ValidNode[]) {
  roots.forEach((root) => {
    const childNodes = root.childNodes;
    if (!childNodes) {
      return;
    }
    for (let i = childNodes.length - 1; i >= 0; i--) {
      const childNode = childNodes[i];
      if (childNode instanceof Text) {
      } else if (childNode instanceof HTMLElement) {
        if (isHintHTMLElement(childNode)) {
          childNode.remove();
        } else {
          addMarkdownHint(childNode as HTMLElement);
        }
      }
    }

    const hintContent = tagToHint[getTagName(root)];
    if (hintContent) {
      const hintContentRight = tagToHintRight[getTagName(root)];
      const hintLeft = makeHintLeft(hintContent);
      const hintRight = makeHintRight(
        hintContentRight ? hintContentRight : hintContent
      );
      root.insertBefore(hintLeft, firstValidChild(root as HTMLElement));
      root.appendChild(hintRight);
    }
  });
}

export function isHintLeft(el: HTMLElement) {
  return el.classList.contains(OH_MDHINT_LEFT);
}
export function isHintRight(el: HTMLElement) {
  return el.classList.contains(OH_MDHINT_RIGHT);
}
export function isHintHTMLElement(el?: Node | null): boolean {
  return (
    isHTMLElement(el) &&
    ((el as HTMLElement).classList.contains(OH_MDHINT_LEFT) ||
      (el as HTMLElement).classList.contains(OH_MDHINT_RIGHT))
  );
}
