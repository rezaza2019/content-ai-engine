import { TicketProduct } from "../services/ticketApi";

export type MergedTicket = {
  tradeTracker: TicketProduct;
  wpId?: string | number;
  wpTitle?: string;
  price: string | number;
  old_price?: string | number;
  discount?: string | number;
  wpTicket?: unknown;
};
