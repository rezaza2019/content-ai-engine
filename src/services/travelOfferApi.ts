import { TravelOffer } from "../types/travelOffer";

const readError = async (response: Response) => {
  try {
    const body = await response.json();
    return body.error || body.message || response.statusText;
  } catch {
    return response.statusText;
  }
};

export async function fetchTravelOffers(): Promise<TravelOffer[]> {
  const response = await fetch("/api/wp/travel-offers");

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function createTravelOffer(
  offer: Partial<TravelOffer>,
): Promise<number> {
  const response = await fetch("/api/wp/travel-offers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(offer),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const created: TravelOffer = await response.json();
  return Number(created.id);
}

export async function updateTravelOffer(offer: TravelOffer) {
  if (!offer.id) {
    throw new Error("Travel offer ID is required.");
  }

  const response = await fetch(`/api/wp/travel-offers/${offer.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(offer),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function deleteTravelOffer(offerId: string | number) {
  const response = await fetch(`/api/wp/travel-offers/${offerId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}
