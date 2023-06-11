import { getTagName, innerHTMLToNodeList } from "@ohno-editor/core/helper";
import {
  BlockEventContext,
  RangedBlockEventContext,
  dispatchKeyEvent,
  PagesHandleMethods,
} from "@ohno-editor/core/system/handler";
import sanitizeHtml from "sanitize-html";
import { PasteAll } from "./plugin";
import { OhNoClipboardData } from "@ohno-editor/core/system";

export class PasteAllPluginHandler implements PagesHandleMethods {}
