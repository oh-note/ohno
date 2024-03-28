import { Order, BlockSerializedData } from "../types";

export interface OhNoClipboardData {
  data: BlockSerializedData[];
  context?: {
    dragFrom: Order;
  };
}
