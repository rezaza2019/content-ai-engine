import type { ParsedTravelOffer } from "../utils/parseTravelOfferUrl";

export type ParseUrlResult = {
  parsed: ParsedTravelOffer;
  postId?: number;
  created: boolean;
  updated: boolean;
  createError?: string;
  duplicate?: boolean;
  existingPostId?: number;
  accommodationId?: number;
  accommodationExists?: boolean;
  accommodationCreated?: boolean;
};

export async function parseAndCreateTravelOfferFromUrl(
  url: string,
  createPost: boolean = false,
  fields: { pricePerPersonFrom?: string; durationDays?: string } = {},
): Promise<ParseUrlResult> {
  const response = await fetch("/api/wp/travel-offers/parse-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, createPost, ...fields }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to parse travel offer URL");
  }

  return data;
}
