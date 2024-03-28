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

