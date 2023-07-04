import { visMap } from "./const";
import { Shortcut } from "./interface";

export function visualKeyEvent(
  e: Shortcut | KeyboardEvent,
  useKey?: boolean
): string {
  const keys = [];
  const { shiftKey, altKey, metaKey, ctrlKey, key, code } = e;
  if (shiftKey) {
    keys.push("⇧");
  }
  if (altKey) {
    keys.push("⎇");
  }
  if (metaKey) {
    keys.push("⌘");
  }
  if (ctrlKey) {
    keys.push("^");
  }
  if (useKey && key) {
    keys.push(key);
  } else if (code) {
    keys.push(visMap[code as LinuxKeyCode] || code);
  }

  return keys.join("+");
}
