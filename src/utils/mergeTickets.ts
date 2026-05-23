type TicketProductLike = {
  ID: string | number;
  name: string;
  price?: {
    amount?: string | number;
  };
  URL?: string;
};

type WpTicketLike = {
  id?: string | number;
  slug?: string;
  title?: {
    rendered?: string;
  };
  status?: string;
  link?: string;
  imageUrl?: string;
  trade_tracker_id?: string | number;
  ticket_id?: string | number;
  tt_id?: string | number;
  price?: string | number;
  old_price?: string | number;
  discount?: string | number;
};

const getTicketId = (ticket: WpTicketLike) =>
  ticket.trade_tracker_id ?? ticket.ticket_id ?? ticket.tt_id;

const normalizeId = (id: string | number | undefined) =>
  id === undefined ? "" : String(id);

export function mergeTickets<TTradeTrackerTicket extends TicketProductLike>(
  tradeTrackerTickets: TTradeTrackerTicket[],
  wpTickets: WpTicketLike[],
  _language = "en",
) {
  const wpTicketsByTradeTrackerId = new Map(
    wpTickets.map((ticket) => [normalizeId(getTicketId(ticket)), ticket]),
  );

  const matchedWpTicketIds = new Set<string>();

  const mergedTradeTrackerTickets = tradeTrackerTickets.map((tradeTracker) => {
    const wpTicket = wpTicketsByTradeTrackerId.get(
      normalizeId(tradeTracker.ID),
    );

    if (wpTicket?.id !== undefined) {
      matchedWpTicketIds.add(normalizeId(wpTicket.id));
    }

    return {
      tradeTracker,
      wpId: wpTicket?.id,
      wpTitle: wpTicket?.title?.rendered,
      price: wpTicket?.price ?? tradeTracker.price?.amount ?? "",
      old_price: wpTicket?.old_price,
      discount: wpTicket?.discount,
      wpTicket,
    };
  });

  const wpOnlyTickets = wpTickets
    .filter((ticket) => !matchedWpTicketIds.has(normalizeId(ticket.id)))
    .map((ticket) => ({
      tradeTracker: {
        ID: getTicketId(ticket) ?? ticket.id ?? "",
        name: ticket.title?.rendered || "Untitled ticket",
        description: "",
        URL: ticket.link || "",
        images: ticket.imageUrl ? [ticket.imageUrl] : [],
        price: {
          amount: ticket.price ?? "",
        },
        properties: {},
      },
      wpId: ticket.id,
      wpTitle: ticket.title?.rendered,
      price: ticket.price ?? "",
      old_price: ticket.old_price,
      discount: ticket.discount,
      wpTicket: ticket,
    }));

  return [...mergedTradeTrackerTickets, ...wpOnlyTickets];
}
