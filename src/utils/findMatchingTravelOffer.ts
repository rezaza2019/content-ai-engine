import { TravelOfferImportFields } from "../types/accommodationImport";
import { TravelOffer } from "../types/travelOffer";

export function normalizeDepartureDate(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }

  return raw.split("T")[0];
}

export function normalizeOfferNumber(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const num = Number(value);
  return Number.isFinite(num) ? String(num) : String(value).trim();
}

export function getTravelOfferAccommodationId(
  offer: TravelOffer | TravelOfferImportFields,
): number | null {
  const accommodation = offer.accommodation;

  if (typeof accommodation === "number") {
    return accommodation;
  }

  if (typeof accommodation === "string" && accommodation.trim()) {
    const parsed = Number(accommodation);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (accommodation && typeof accommodation === "object") {
    const record = accommodation as Record<string, unknown>;
    const id = record.ID ?? record.id;
    if (id !== undefined && id !== null) {
      return Number(id);
    }
  }

  return null;
}

export function findMatchingTravelOffer(
  existing: TravelOffer[],
  offer: TravelOfferImportFields,
): TravelOffer | undefined {
  const accommodationId = getTravelOfferAccommodationId(offer);
  const departureDate = normalizeDepartureDate(offer.departure_date);
  const price = normalizeOfferNumber(offer.price_per_person_from);
  const duration = normalizeOfferNumber(offer.duration_days);

  if (!accommodationId || !departureDate) {
    return undefined;
  }

  return existing.find((candidate) => {
    const candidateAccommodationId = getTravelOfferAccommodationId(candidate);
    const candidateDepartureDate = normalizeDepartureDate(
      candidate.departure_date,
    );
    const candidatePrice = normalizeOfferNumber(candidate.price_per_person_from);
    const candidateDuration = normalizeOfferNumber(candidate.duration_days);

    return (
      candidateAccommodationId === accommodationId &&
      candidateDepartureDate === departureDate &&
      candidatePrice === price &&
      candidateDuration === duration
    );
  });
}
