import { Accommodation } from "./accommodation";
import { mapTravelOfferImportFields } from "../utils/mapTravelOfferAcfFields";

export type AccommodationImportItem = Partial<Accommodation> & {
  name?: string;
  price_per_person_from?: string | number;
  departure_date?: string;
  duration_days?: string | number;
  departure_airport?: string;
  transfer_included?: boolean;
  board_type?: string;
};

export function pickAccommodationFields(
  item: AccommodationImportItem,
): Partial<Accommodation> {
  return {
    id: item.id,
    name: item.name,
    title: item.title ?? item.name,
    country: item.country,
    region: item.region,
    city: item.city,
    rating: item.rating,
    review_count: item.review_count,
    facilities: item.facilities,
    content: item.content,
    excerpt: item.excerpt,
    status: item.status,
  };
}

export type TravelOfferImportFields = {
  title?: string;
  price_per_person_from?: string | number;
  departure_date?: string;
  duration_days?: string | number;
  departure_airport?: string;
  transfer_included?: boolean;
  board_type?: string;
  accommodation?: number;
  destination_term?: number | null;
};

export function pickTravelOfferFields(
  item: AccommodationImportItem,
  accommodationId: number,
  destinationIds?: {
    cityId?: number;
    regionId?: number;
    countryId?: number;
  },
): TravelOfferImportFields | null {
  const hasTravelOfferFields =
    item.price_per_person_from !== undefined ||
    Boolean(item.departure_date) ||
    item.duration_days !== undefined ||
    Boolean(item.departure_airport) ||
    Boolean(item.board_type) ||
    item.transfer_included !== undefined;

  if (!hasTravelOfferFields) {
    return null;
  }

  return mapTravelOfferImportFields({
    title:
      item.name ||
      (typeof item.title === "string" ? item.title : item.title?.rendered),
    price_per_person_from: item.price_per_person_from,
    departure_date: item.departure_date,
    duration_days: item.duration_days,
    departure_airport: item.departure_airport,
    board_type: item.board_type,
    transfer_included: item.transfer_included ?? false,
    accommodation: accommodationId,
    destination_term:
      destinationIds?.cityId ??
      destinationIds?.regionId ??
      destinationIds?.countryId ??
      null,
  }) as TravelOfferImportFields;
}
