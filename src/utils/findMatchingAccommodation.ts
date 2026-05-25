import { Accommodation } from "../types/accommodation";
import { AccommodationImportItem } from "../types/accommodationImport";

export function normalizeAccommodationText(
  value: string | undefined | null,
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function getAccommodationName(
  item: Accommodation | AccommodationImportItem,
): string {
  if (typeof item.title === "object" && item.title?.rendered) {
    return item.title.rendered;
  }

  if (typeof item.title === "string") {
    return item.title;
  }

  return item.name || "";
}

export function findMatchingAccommodation(
  existing: Accommodation[],
  item: AccommodationImportItem,
): Accommodation | undefined {
  const importName = normalizeAccommodationText(getAccommodationName(item));
  const importCountry = normalizeAccommodationText(item.country);
  const importCity = normalizeAccommodationText(item.city);

  return existing.find((accommodation) => {
    const name = normalizeAccommodationText(getAccommodationName(accommodation));
    const country = normalizeAccommodationText(accommodation.country);
    const city = normalizeAccommodationText(accommodation.city);

    if (name !== importName) return false;
    if (importCountry && country !== importCountry) return false;
    if (importCity && city !== importCity) return false;
    return true;
  });
}
