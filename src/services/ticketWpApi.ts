export type CombinedWpTicket = {
  id?: string | number;
  slug?: string;
  title?: {
    rendered?: string;
  };
  status?: string;
  link?: string;
  imageUrl?: string;
  trade_tracker_id?: string | number;
  price?: string | number;
  old_price?: string | number;
  discount?: string | number;
  acf?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export async function fetchWpTickets(): Promise<CombinedWpTicket[]> {
  const response = await fetch("/api/wp/tickets");

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || response.statusText);
  }

  return response.json();
}
