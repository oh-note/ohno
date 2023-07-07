export const OH_MDHINT = "oh-is-hint";
export const OH_MDHINT_LEFT = "hint-left";
export const OH_MDHINT_RIGHT = "hint-right";

export const tagToHint: { [key: string]: string } = {
  b: "**",
  i: "*",
  del: "~~",
  code: "`",
  em: " ",
  label: " ",
  a: "[",
  q: "[[",
};

export const tagToHintRight: { [key: string]: string } = {
  q: "]]",
  a: "]",
};
