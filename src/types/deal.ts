import { RenderedText } from "./destination";

export type Deal = {
  id?: string | number;
  slug?: string;
  title?: RenderedText;
  content?: RenderedText;
  status?: string;
  link?: string;
  imageUrl?: string;
  name?: string;
  discounted_price?: string | number;
  old_price?: string | number;
  where_to_buy?: string;
  where_to_publish?: string[];
  acf?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};
