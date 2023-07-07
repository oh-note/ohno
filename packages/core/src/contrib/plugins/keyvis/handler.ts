import { PagesHandleMethods } from "@ohno-editor/core/system/types";
import {
  BlockEventContext,
  RangedBlockEventContext,
} from "@ohno-editor/core/system/types";
import { KeyVis } from "./plugin";

export class KeyVisPluginHandler implements PagesHandleMethods {
  handleKeyPress(e: KeyboardEvent, context: BlockEventContext): boolean | void {
    const { page } = context;

    const plugin = page.getPlugin<KeyVis>("keyvis");
    plugin.component.press.textContent =
      page.shortcut.serializeKeyEvent(e) +
      " => " +
      Array.from(page.shortcut.find(e)).join(", ");
  }
  handleKeyDown(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page } = context;
    const plugin = page.getPlugin<KeyVis>("keyvis");
    plugin.component.down.textContent =
      page.shortcut.serializeKeyEvent(e) +
      " => " +
      Array.from(page.shortcut.find(e)).join(", ");
  }

  handleKeyUp(
    e: KeyboardEvent,
    context: RangedBlockEventContext
  ): boolean | void {
    const { page } = context;
    const plugin = page.getPlugin<KeyVis>("keyvis");
    plugin.component.up.textContent =
      page.shortcut.serializeKeyEvent(e) +
      "|" +
      page.shortcut.serializeKeyEvent(e, true);
  }
}
