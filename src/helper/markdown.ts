import { OH_MDHINT } from "./consts";
import { createElement } from "./document";
import { firstValidChild, getTagName, lastValidChild } from "./element";

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
export function addMarkdownHint(root: HTMLElement) {
  const childNodes = root.childNodes;

  for (let i = 0; i < childNodes.length; i++) {
    const childNode = childNodes[i];
    if (childNode.nodeType === Node.TEXT_NODE) {
    } else if (childNode.nodeType === Node.ELEMENT_NODE) {
      addMarkdownHint(childNode as HTMLElement);

      const hintContent = tagToHint[getTagName(childNode)];
      if (hintContent) {
        const hintLeft = makeHint(hintContent);
        const hintRight = makeHint(hintContent);
        childNode.insertBefore(
          hintLeft,
          firstValidChild(childNode as HTMLElement)
        );
        childNode.appendChild(hintRight);
      }
    }
  }
}
