import { Deal } from "../types/deal";

export async function fetchDeals(): Promise<Deal[]> {
  const response = await fetch("/api/wp/deals");

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || response.statusText);
  }

  return response.json();
}
