import { OH_MDHINT } from "./consts";
import { createElement } from "./document";
import {
  ValidNode,
  firstValidChild,
  getTagName,
  lastValidChild,
} from "./element";

function makeHint(content: string): HTMLElement {
  return createElement("span", { textContent: content, className: OH_MDHINT });
}

const tagToHint: { [key: string]: string } = {
  b: "**",
  i: "*",
  del: "~~",
  code: "`",
};

/**
 * <p><b>text</b></p>
 * <p><b><span>**</span>text<span>**</span></b></p>
 */
export function addMarkdownHint(root: ValidNode) {
  const childNodes = root.childNodes;

  for (let i = childNodes.length - 1; i >= 0; i--) {
    const childNode = childNodes[i];
    if (childNode instanceof Text) {
    } else if (childNode instanceof HTMLElement) {
      if (childNode.classList.contains(OH_MDHINT)) {
        childNode.remove();
      } else {
        addMarkdownHint(childNode as HTMLElement);
      }
    }
  }

  const hintContent = tagToHint[getTagName(root)];
  if (hintContent) {
    const hintLeft = makeHint(hintContent);
    const hintRight = makeHint(hintContent);
    root.insertBefore(hintLeft, firstValidChild(root as HTMLElement));
    root.appendChild(hintRight);
  }
}
