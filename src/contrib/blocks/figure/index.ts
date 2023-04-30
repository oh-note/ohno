import { BlockEntry, HandlerEntry } from "@/system/page";
import { FigureHandler } from "./handler";
import { Figure } from "./block";

export * from "./handler";
export * from "./block";

export const FigureHandlers: HandlerEntry = {
  blockHandler: new FigureHandler(),
};

export const FigureBlockEntry: BlockEntry = {
  name: "figure",
  blockType: Figure,
  handler: new FigureHandler(),
};
