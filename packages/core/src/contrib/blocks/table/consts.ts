import { PlatformShortcut, ShorcutEntry } from "@ohno-editor/core/system/types";

const field = "table";
export const ST_ADD_UP = "add_up";
export const ST_ADD_DOWN = "add_down";
export const ST_ADD_LEFT = "add_left";
export const ST_ADD_RIGHT = "add_right";

export const ST_MOVE_UP = "move_up";
export const ST_MOVE_DOWN = "move_down";
export const ST_MOVE_LEFT = "move_left";
export const ST_MOVE_RIGHT = "move_right";
export const SHORCUTS: [ShorcutEntry, PlatformShortcut][] = [
  [
    { alias: ST_ADD_UP, field },
    {
      winos: { shiftKey: true, ctrlKey: true, code: "ArrowUp" },
      linux: { shiftKey: true, ctrlKey: true, code: "ArrowUp" },
      macos: { shiftKey: true, metaKey: true, code: "ArrowUp" },
    },
  ],
  [
    { alias: ST_ADD_DOWN, field },
    {
      winos: { shiftKey: true, ctrlKey: true, code: "ArrowDown" },
      linux: { shiftKey: true, ctrlKey: true, code: "ArrowDown" },
      macos: { shiftKey: true, metaKey: true, code: "ArrowDown" },
    },
  ],
  [
    { alias: ST_ADD_LEFT, field },
    {
      winos: { shiftKey: true, ctrlKey: true, code: "ArrowLeft" },
      linux: { shiftKey: true, ctrlKey: true, code: "ArrowLeft" },
      macos: { shiftKey: true, metaKey: true, code: "ArrowLeft" },
    },
  ],
  [
    { alias: ST_ADD_RIGHT, field },
    {
      winos: { shiftKey: true, ctrlKey: true, code: "ArrowRight" },
      linux: { shiftKey: true, ctrlKey: true, code: "ArrowRight" },
      macos: { shiftKey: true, metaKey: true, code: "ArrowRight" },
    },
  ],
  [
    { alias: ST_MOVE_UP, field },
    {
      common: { shiftKey: true, altKey: true, code: "ArrowUp" },
    },
  ],
  [
    { alias: ST_MOVE_DOWN, field },
    {
      common: { shiftKey: true, altKey: true, code: "ArrowDown" },
    },
  ],
  [
    { alias: ST_MOVE_LEFT, field },
    {
      common: { shiftKey: true, altKey: true, code: "ArrowLeft" },
    },
  ],
  [
    { alias: ST_MOVE_RIGHT, field },
    {
      common: { shiftKey: true, altKey: true, code: "ArrowRight" },
    },
  ],
];
