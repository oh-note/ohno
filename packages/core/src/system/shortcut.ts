export interface Shortcut {
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
  key?: string;
  code?: WinKeyCode | MacKeyCode | LinuxKeyCode;
}

export interface PlatformShortcut {
  common?: Shortcut;
  winos?: Shortcut;
  linux?: Shortcut;
  macos?: Shortcut;
}

export interface IShortcut {
  registKey(entry: ShorcutEntry, shortcut: PlatformShortcut): void;
  visualKeyEvent(e: KeyboardEvent | Shortcut, useKey?: boolean): string;
  serializeKeyEvent(e: KeyboardEvent | Shortcut, useKey?: boolean): string;
  match(e: KeyboardEvent, name: string): boolean;
  find(e: KeyboardEvent | Shortcut): Set<string>;
  equal(e: KeyboardEvent, shortcut: Shortcut): boolean;
}

export interface ShorcutEntry {
  alias: string;
  field: string;
}

const userAgent = navigator.userAgent;
let platform: "macos" | "winos" | "linux" | "common";

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

const visMap: { [key in LinuxKeyCode | WinKeyCode | MacKeyCode]?: string } = {
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Backspace: "⌫",
  Enter: "↩",
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
  Tab: "⇥",
};

export class ShortCutManager implements IShortcut {
  // key -> alias[]
  common: Map<string, string[]> = new Map();
  linux: Map<string, string[]> = new Map();
  winos: Map<string, string[]> = new Map();
  macos: Map<string, string[]> = new Map();
  _registKey(
    entry: ShorcutEntry,
    shortcut: Shortcut,
    map: Map<string, string[]>
  ) {
    const { alias, field } = entry;
    const keystr = this.serializeKeyEvent(shortcut);
    const keys = map.get(keystr) || [];
    keys.push(alias);
    map.set(keystr, keys);
  }
  registKey(entry: ShorcutEntry, pshortcut: PlatformShortcut): void {
    const { alias } = entry;
    const { common, linux, winos, macos } = pshortcut;

    if (common) {
      this._registKey(entry, common, this.common);
    }
    if (linux) {
      this._registKey(entry, linux, this.linux);
    }
    if (winos) {
      this._registKey(entry, winos, this.winos);
    }
    if (macos) {
      this._registKey(entry, macos, this.macos);
    }
  }
  visualKeyEvent(e: Shortcut, useKey?: boolean): string {
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
  serializeKeyEvent(e: KeyboardEvent | Shortcut, useKey?: boolean): string {
    const keys = [];
    const { shiftKey, altKey, metaKey, ctrlKey, key, code } = e;
    if (shiftKey) {
      keys.push("shift");
    }
    if (altKey) {
      keys.push("alt");
    }
    if (metaKey) {
      keys.push("meta");
    }
    if (ctrlKey) {
      keys.push("ctrl");
    }
    if (useKey && key) {
      keys.push(key);
    } else if (code) {
      keys.push(code);
    }

    return keys.join("+");
  }

  match(e: KeyboardEvent, name: string): boolean {
    const keystr = this.serializeKeyEvent(e, true);

    const keys = this.linux.get(keystr) || [];
    for (const item in keys) {
      if (item === name) {
        return true;
      }
    }
    const codestr = this.serializeKeyEvent(e);
    const codes = this.linux.get(codestr) || [];
    for (const item in codes) {
      if (item === name) {
        return true;
      }
    }
    return false;
  }
  find(e: KeyboardEvent): Set<string> {
    const keystr = this.serializeKeyEvent(e, true);
    let res: string[] = [];
    res = res.concat(...(this.common.get(keystr) || []));
    res = res.concat(...(this[platform].get(keystr) || []));
    const codestr = this.serializeKeyEvent(e);
    res = res.concat(...(this.common.get(codestr) || []));
    res = res.concat(...(this[platform].get(codestr) || []));
    return new Set(res);
  }
  equal(e: KeyboardEvent, shortcut: Shortcut): boolean {
    return this.serializeKeyEvent(e) === this.serializeKeyEvent(shortcut);
  }
}
