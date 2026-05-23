export type RenderedText = {
  rendered: string;
};

export type Destination = {
  id?: string | number;
  slug?: string;
  date?: string;
  modified?: string;
  title?: RenderedText;
  content?: RenderedText;
  price?: string | number;
  duration?: string | number;
  departure_date?: string;
  aff_link?: string;
  destination_name?: string;
  destination_region?: string;
  destination_country?: string;
  imageUrl?: string;
};
