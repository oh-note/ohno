import { Handlers } from "@system/page";
import { ParagraphHandler } from "./handler";

export * from "./handler";
export * from "./block";

export const ParagraphHandlers: Handlers = {
  beforeHandler: new ParagraphHandler(),
};
