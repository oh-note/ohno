export const visMap: {
  [key in LinuxKeyCode | WinKeyCode | MacKeyCode]?: string;
} = {
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Backspace: "⌫",
  Enter: "↩",
  Delete: "Del",
  MetaLeft: "⌘",
  MetaRight: "⌘",
  ControlLeft: "^",
  ControlRight: "^",
  Minus: "-",
  Equal: "=",
  Digit0: "0",
  Digit1: "1",
  Digit2: "2",
  Digit3: "3",
  Digit4: "4",
  Digit5: "5",
  Digit6: "6",
  Digit7: "7",
  Digit8: "8",
  Digit9: "9",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Quote: "'",
  Semicolon: ";",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Backquote: "`",
  Tab: "Tab",
};

const userAgent = navigator.userAgent;
export let platform: "macos" | "winos" | "linux" | "common";

if (userAgent.match(/Win/i)) {
  platform = "winos";
} else if (userAgent.match(/Mac/i)) {
  platform = "macos";
} else if (userAgent.match(/Linux/i)) {
  platform = "linux";
} else if (userAgent.match(/Android/i)) {
  platform = "common";
} else if (userAgent.match(/iPhone|iPad|iPod/i)) {
  platform = "common";
} else {
  platform = "common";
}
