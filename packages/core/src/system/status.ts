/**
 * mark HTMLElement as some status
 */

import { isHintHTMLElement, isHintLeft, isHintRight } from "./hint";

export { isHintHTMLElement, isHintLeft, isHintRight };

export {
  isParent,
  isValidNode,
  isHTMLElement,
  isTextNode,
  isTokenHTMLElement,
} from "./node";

export function addMark(node: HTMLElement, name: string) {
  node.classList.add(name);
  return node;
}
export function removeMark(node: HTMLElement, name: string) {
  node.classList.remove(name);
  return node;
}

export function hasMark(node: HTMLElement, name: string) {
  return node.classList.contains(name);
}

export const markFloat = (node: HTMLElement) =>
  (node.style.position = "absolute");

export const isMenu = (node: HTMLElement) => hasMark(node, "menu");

export const markPlain = (node: HTMLElement) => addMark(node, "plain");
export const isPlain = (node: HTMLElement) => hasMark(node, "plain");
export const removePlain = (node: HTMLElement) => removeMark(node, "plain");

export const markHover = (node: HTMLElement) => addMark(node, "hover");
export const isHover = (node: HTMLElement) => hasMark(node, "hover");
export const removeHover = (node: HTMLElement) => removeMark(node, "hover");

export const markActivate = (node: HTMLElement) => addMark(node, "active");
export const isActivate = (node: HTMLElement) => hasMark(node, "active");
export const removeActivate = (node: HTMLElement) => removeMark(node, "active");

export const markSelect = (node: HTMLElement) => addMark(node, "select");
export const isSelect = (node: HTMLElement) => hasMark(node, "select");
export const removeSelect = (node: HTMLElement) => removeMark(node, "select");

export const markHide = (node: HTMLElement) => {
  node.style.display = "none";
};
export const isHide = (node: HTMLElement) => {
  return node.style.display === "none";
};
export const markShow = (node: HTMLElement) => {
  node.style.removeProperty("display");
};
export const isShow = (node: HTMLElement) => {
  return node.style.display !== "none";
};

export const isLeftButtonDown = (e: MouseEvent) => {
  return e.buttons === 1;
};

export const getLabelType = (e: HTMLLabelElement): string => {
  return e.dataset["name"]!;
};
