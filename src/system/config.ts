export var ROOT_CLASS = "oh-is-page";
export var BLOCK_CLASS = "oh-is-block";
export var CONTAINER_CLASS = "oh-is-container";

export interface Config {
  root_class?: string;
  block_class?: string;
  container_class?: string;
  history?: number;
}

export const defaultConfig = {
  root_class: "oh-is-page",
  block_class: "oh-is-block",
  container_class: "oh-is-container",
};
export const useConfig = () => {};
