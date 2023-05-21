/**
 * mark HTMLElement as some status
 */

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
