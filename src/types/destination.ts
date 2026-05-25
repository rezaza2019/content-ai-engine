export type RenderedText = {
  rendered: string;
};

export type DestinationPhoto = {
  ID?: number;
  id?: number;
  url?: string;
};

export type Destination = {
  id?: string | number;
  slug?: string;
  date?: string;
  modified?: string;
  title?: RenderedText;
  content?: RenderedText;
  destination_name?: string;
  destination_identifier?: string;
  type_of_destination?: string;
  destination_name_farsi?: string;
  destination_region?: string;
  destination_region_fa?: string;
  destination_country?: string;
  destination_country_fa?: string;
  destination_photo?: DestinationPhoto[] | number[];
  destination_region_description_farsi?: string;
  imageUrl?: string;
  acf?: Record<string, unknown>;
};
