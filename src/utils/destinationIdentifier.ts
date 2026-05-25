const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  spanje: "es",
  spain: "es",
  espana: "es",
  griekenland: "gr",
  greece: "gr",
  turkije: "tr",
  turkey: "tr",
  italie: "it",
  italy: "it",
  frankrijk: "fr",
  france: "fr",
  nederland: "nl",
  netherlands: "nl",
  duitsland: "de",
  germany: "de",
  portugal: "pt",
  kroatie: "hr",
  croatia: "hr",
  bulgarije: "bg",
  bulgaria: "bg",
  egypte: "eg",
  egypt: "eg",
  marokko: "ma",
  morocco: "ma",
  tunisie: "tn",
  tunisia: "tn",
  cyprus: "cy",
  malta: "mt",
  oostenrijk: "at",
  austria: "at",
  zwitserland: "ch",
  switzerland: "ch",
  belgie: "be",
  belgium: "be",
  uk: "gb",
  "united kingdom": "gb",
  engeland: "gb",
  england: "gb",
};

export type DestinationLevel = "city" | "region" | "country";

export function slugifyDestinationName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function resolveCountryCode(country: string | undefined): string | null {
  if (!country?.trim()) return null;

  const normalized = country.trim().toLowerCase();
  if (/^[a-z]{2}$/.test(normalized)) {
    return normalized;
  }

  return COUNTRY_NAME_TO_CODE[normalized] ?? null;
}

export function buildDestinationIdentifier(
  name: string,
  countryCode: string,
): string {
  const slug = slugifyDestinationName(name);
  return `${slug}|${countryCode.toLowerCase()}`;
}

export function getDestinationLevelsFromAccommodation(item: {
  city?: string;
  region?: string;
  country?: string;
}): Array<{ name: string; type: DestinationLevel; region?: string }> {
  const levels: Array<{ name: string; type: DestinationLevel; region?: string }> =
    [];

  if (item.city?.trim()) {
    levels.push({
      name: item.city.trim(),
      type: "city",
      region: item.region?.trim() || undefined,
    });
  }

  if (item.region?.trim()) {
    levels.push({
      name: item.region.trim(),
      type: "region",
    });
  }

  if (item.country?.trim()) {
    levels.push({
      name: item.country.trim(),
      type: "country",
    });
  }

  return levels;
}
