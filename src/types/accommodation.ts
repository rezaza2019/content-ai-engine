import { RenderedText } from "./destination";

export type Accommodation = {
  id?: string | number;
  slug?: string;
  date?: string;
  modified?: string;
  title?: RenderedText | string;
  content?: RenderedText | string;
  excerpt?: RenderedText | string;
  status?: string;
  link?: string;
  admin_edit_link?: string;
  imageUrl?: string;
  name?: string;
  country?: string;
  region?: string;
  city?: string;
  rating?: string | number;
  review_count?: string | number;
  facilities?: string[];
  acf?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};
