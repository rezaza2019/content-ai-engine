import { RenderedText } from "./destination";

export type TravelOffer = {
  id?: string | number;
  slug?: string;
  date?: string;
  modified?: string;
  title?: RenderedText | string;
  excerpt?: RenderedText | string;
  status?: string;
  link?: string;
  imageUrl?: string;
  price_per_person_from?: string | number;
  duration_days?: string | number;
  departure_date?: string;
  departure_airport?: string;
  board_type?: string;
  transfer_included?: boolean;
  accommodation?: string | number | Record<string, unknown> | null;
  destination_term?: string | number | Record<string, unknown> | null;
  acf?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};
