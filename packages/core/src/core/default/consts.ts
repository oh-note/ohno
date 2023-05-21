import { PlatformShortcut, ShorcutEntry, Shortcut } from "../..";

const field = "defaultHandler";
export const ST_MOVE = "ArrowMove";
export const ST_UNDO = "Undo";
export const ST_REDO = "Redo";
export const ST_MOVE_SOFT_HEAD = "MoveToSoftLineHead";
export const ST_MOVE_SOFT_END = "MoveToSoftLineEnd";
export const SHORCUTS: [ShorcutEntry, PlatformShortcut][] = [
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
