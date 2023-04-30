import { OH_MDHINT, OH_MDHINT_LEFT, OH_MDHINT_RIGHT } from "./consts";
import { createElement } from "./document";
import {
  ValidNode,
  firstValidChild,
  getTagName,
  isHintHTMLElement,
  lastValidChild,
} from "./element";

function makeHint(content: string): HTMLElement {
  return createElement("span", { textContent: content, className: OH_MDHINT });
}
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

const tagToHint: { [key: string]: string } = {
  b: "**",
  i: "*",
  del: "~~",
  code: "`",
  em: " ",
  label: " ",
};

export function removeMarkdownHint(...roots: ValidNode[]) {
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
      const hintLeft = makeHintLeft(hintContent);
      const hintRight = makeHintRight(hintContent);
      root.insertBefore(hintLeft, firstValidChild(root as HTMLElement));
      root.appendChild(hintRight);
    }
  });
}
