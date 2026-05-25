import { AccommodationImportItem } from "../types/accommodationImport";

export function parseAccommodationJson(text: string): AccommodationImportItem[] {
  const parsed = parseJsonInput(text);
  const items = normalizeToItems(parsed);

  if (items.length === 0) {
    throw new Error(
      'JSON must be an object, a non-empty array, comma-separated objects, or { "accommodations": [...] }.',
    );
  }

  return items.map((item, index) => normalizeAccommodationItem(item, index));
}

const parseJsonInput = (text: string): unknown => {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("Invalid JSON. Check brackets, commas, and quotes.");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    // Allow multiple objects separated by commas without array brackets.
    if (trimmed.startsWith("{")) {
      const wrapped = `[${trimmed.replace(/,\s*$/, "")}]`;

      try {
        return JSON.parse(wrapped);
      } catch {
        // fall through
      }
    }

    throw new Error("Invalid JSON. Check brackets, commas, and quotes.");
  }
};

const normalizeToItems = (parsed: unknown): Record<string, unknown>[] => {
  if (Array.isArray(parsed)) {
    return parsed.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    );
  }

  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;

    if (Array.isArray(record.accommodations)) {
      return record.accommodations.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object",
      );
    }

    if (typeof record.name === "string" || typeof record.title === "string") {
      return [record];
    }
  }

  return [];
};

const normalizeAccommodationItem = (
  record: Record<string, unknown>,
  index: number,
): AccommodationImportItem => {
  const name =
    typeof record.name === "string"
      ? record.name
      : typeof record.title === "string"
        ? record.title
        : "";

  if (!name.trim()) {
    throw new Error(`Item at index ${index} is missing a name or title.`);
  }

  if (!stringField(record.country)) {
    throw new Error(`Item at index ${index} is missing a country.`);
  }

  const facilities = arrayField(record.facilities);
  if (record.facilities !== undefined && record.facilities !== null && !Array.isArray(record.facilities)) {
    throw new Error(`Item at index ${index} has an invalid facilities value.`);
  }

  const rating = nullableNumberField(record.rating);
  if (record.rating !== undefined && record.rating !== null && rating === null) {
    throw new Error(`Item at index ${index} has an invalid rating value.`);
  }

  const reviewCount = nullableNumberField(record.review_count);
  if (
    record.review_count !== undefined &&
    record.review_count !== null &&
    reviewCount === null
  ) {
    throw new Error(`Item at index ${index} has an invalid review_count value.`);
  }

  const price = nullableNumberField(record.price_per_person_from);
  if (
    record.price_per_person_from !== undefined &&
    record.price_per_person_from !== null &&
    price === null
  ) {
    throw new Error(
      `Item at index ${index} has an invalid price_per_person_from value.`,
    );
  }

  const durationDays = nullableNumberField(record.duration_days);
  if (
    record.duration_days !== undefined &&
    record.duration_days !== null &&
    durationDays === null
  ) {
    throw new Error(`Item at index ${index} has an invalid duration_days value.`);
  }

  if (
    record.transfer_included !== undefined &&
    record.transfer_included !== null &&
    typeof record.transfer_included !== "boolean"
  ) {
    throw new Error(
      `Item at index ${index} has an invalid transfer_included value.`,
    );
  }

  return {
    name: name.trim(),
    title: name.trim(),
    country: stringField(record.country),
    region: stringField(record.region),
    city: stringField(record.city),
    rating: rating ?? undefined,
    review_count: reviewCount ?? undefined,
    facilities,
    content: stringField(record.content),
    excerpt: stringField(record.excerpt),
    status: typeof record.status === "string" ? record.status : "publish",
    price_per_person_from: price ?? undefined,
    departure_date: stringField(record.departure_date) || undefined,
    duration_days: durationDays ?? undefined,
    departure_airport: stringField(record.departure_airport) || undefined,
    transfer_included:
      typeof record.transfer_included === "boolean"
        ? record.transfer_included
        : undefined,
    board_type: stringField(record.board_type) || undefined,
  };
};

const stringField = (value: unknown) =>
  value === undefined || value === null ? "" : String(value).trim();

const nullableNumberField = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const arrayField = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
};
