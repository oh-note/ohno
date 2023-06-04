import { PlatformShortcut, ShorcutEntry, Shortcut } from "../..";

const field = "defaultHandler";
export const ST_FORMAT_BOLD = "FormatBold";
export const ST_FORMAT_ITALIC = "FormatItalic";
export const ST_FORMAT_CODE = "FormatCode";
export const ST_FORMAT_LINK = "FormatLink";
export const ST_DELETE_SOFTLINE_FORWARD = "deleteSoftLineForward";

export const FORMAT_MAP: { [key: string]: keyof HTMLElementTagNameMap } = {
  FormatBold: "b",
  FormatItalic: "i",
  FormatLink: "a",
  FormatCode: "code",
};

export const ST_MOVE = "ArrowMove";
export const ST_UNDO = "Undo";
export const ST_REDO = "Redo";
export const ST_MOVE_SOFT_HEAD = "MoveToSoftLineHead";
export const ST_MOVE_SOFT_END = "MoveToSoftLineEnd";
export const ST_SELECT_ALL = "SelectAll";
export const ST_SELECT_SOFTLINE_FORWARD = "selectSoftLineForward";
export const ST_SELECT_SOFTLINE_BACKWARD = "selectSoftLineBackward";
export const SHORCUTS: [ShorcutEntry, PlatformShortcut][] = [
  // Format
  [
    { alias: ST_FORMAT_LINK, field },
    {
      winos: { ctrlKey: true, code: "KeyG" },
      linux: { ctrlKey: true, code: "KeyG" },
      macos: { metaKey: true, code: "KeyG" },
    },
  ],
  [
    { alias: ST_FORMAT_ITALIC, field },
    {
      winos: { ctrlKey: true, code: "KeyI" },
      linux: { ctrlKey: true, code: "KeyI" },
      macos: { metaKey: true, code: "KeyI" },
    },
  ],
  [
    { alias: ST_FORMAT_BOLD, field },
    {
      winos: { ctrlKey: true, code: "KeyB" },
      linux: { ctrlKey: true, code: "KeyB" },
      macos: { metaKey: true, code: "KeyB" },
    },
  ],
  // Undo
  [
    { alias: ST_UNDO, field },
    {
      winos: { ctrlKey: true, code: "KeyZ" },
      linux: { ctrlKey: true, code: "KeyZ" },
      macos: { metaKey: true, code: "KeyZ" },
    },
  ],
  [
    { alias: ST_REDO, field },
    {
      winos: { ctrlKey: true, code: "KeyY" },
      linux: { ctrlKey: true, code: "KeyY" },
      macos: { shiftKey: true, metaKey: true, code: "KeyZ" },
    },
  ],
  // Move To Head
  [
    { alias: ST_MOVE_SOFT_HEAD, field },
    {
      common: { code: "Home" },
      macos: { ctrlKey: true, code: "KeyA" },
    },
  ],
  // Move To End
  [
    { alias: ST_MOVE_SOFT_END, field },
    { common: { code: "End" }, macos: { ctrlKey: true, code: "KeyE" } },
  ],
  // Select All
  [
    { alias: ST_SELECT_ALL, field },
    {
      common: { ctrlKey: true, code: "KeyA" },
      macos: { metaKey: true, code: "KeyA" },
    },
  ],
  // Delete SoftLine Forward
  [
    { alias: ST_DELETE_SOFTLINE_FORWARD, field },
    {
      common: { ctrlKey: true, code: "Delete" },
      macos: { metaKey: true, code: "Delete" },
    },
  ],
  // Select SoftLine Forward
  [
    { alias: ST_SELECT_SOFTLINE_BACKWARD, field },
    {
      common: { shiftKey: true, code: "End" },
    },
  ],
  // Select SoftLine Backward
  [
    { alias: ST_SELECT_SOFTLINE_FORWARD, field },
    {
      common: { shiftKey: true, code: "Home" },
    },
  ],
];

SHORCUTS.push(
  ...["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].map(
    (item): [ShorcutEntry, PlatformShortcut] => {
      return [
        { alias: ST_MOVE, field },
        {
          winos: { code: item as WinKeyCode },
          linux: { code: item as WinKeyCode },
          macos: { code: item as WinKeyCode },
        },
      ];
    }
  )
);
