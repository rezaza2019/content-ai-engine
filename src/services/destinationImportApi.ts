import { AccommodationImportItem } from "../types/accommodationImport";
import { Destination } from "../types/destination";
import {
  createDestination,
  updateDestination,
} from "./destinationApi";
import {
  buildDestinationIdentifier,
  DestinationLevel,
  getDestinationLevelsFromAccommodation,
  resolveCountryCode,
} from "../utils/destinationIdentifier";
import { findDestinationByLevel } from "../utils/findMatchingDestination";
import {
  ImportProgressReporter,
  noopImportProgress,
} from "../types/importProgress";

export type EnsuredDestinationIds = {
  cityId?: number;
  regionId?: number;
  countryId?: number;
};

export type EnsureDestinationsSummary = {
  created: number;
  skipped: number;
  updated: number;
  ids: EnsuredDestinationIds;
};

const destinationTypeLabel = (type: DestinationLevel) => {
  if (type === "city") return "city";
  if (type === "region") return "region";
  return "country";
};

const needsDestinationUpdate = (
  existing: Destination,
  next: {
    destination_name: string;
    destination_region?: string;
    destination_country: string;
    type_of_destination: string;
    destination_identifier: string;
  },
) =>
  (existing.destination_name || "") !== next.destination_name ||
  (existing.destination_region || "") !== (next.destination_region || "") ||
  (existing.destination_country || "") !== next.destination_country ||
  (existing.type_of_destination || "") !== next.type_of_destination ||
  (existing.destination_identifier || "") !== next.destination_identifier;

export async function ensureDestinationsFromAccommodationItem(
  item: AccommodationImportItem,
  existingDestinations: Destination[],
  onProgress: ImportProgressReporter = noopImportProgress,
): Promise<EnsureDestinationsSummary> {
  const countryCode = resolveCountryCode(item.country);
  const summary: EnsureDestinationsSummary = {
    created: 0,
    skipped: 0,
    updated: 0,
    ids: {},
  };

  if (!countryCode) {
    onProgress({
      level: "skip",
      message: `Skipping destinations — unknown country code for "${item.country || ""}".`,
    });
    return summary;
  }

  const levels = getDestinationLevelsFromAccommodation(item);

  for (const level of levels) {
    const typeLabel = destinationTypeLabel(level.type);
    onProgress({
      level: "info",
      message: `Checking ${typeLabel} destination "${level.name}"...`,
    });

    const destinationIdentifier = buildDestinationIdentifier(
      level.name,
      countryCode,
    );
    const payload = {
      title: { rendered: level.name },
      destination_name: level.name,
      destination_identifier: destinationIdentifier,
      type_of_destination: level.type,
      destination_country: countryCode,
      destination_region:
        level.type === "city"
          ? level.region || item.region || ""
          : level.type === "region"
            ? level.name
            : "",
    };

    const match = findDestinationByLevel(
      existingDestinations,
      level.name,
      level.type,
      countryCode,
    );

    if (match?.id) {
      if (needsDestinationUpdate(match, payload)) {
        onProgress({
          level: "update",
          message: `${typeLabel} destination "${level.name}" exists — updating fields...`,
        });
        await updateDestination({ ...match, ...payload, id: match.id });
        summary.updated += 1;
        Object.assign(match, payload);
      } else {
        onProgress({
          level: "skip",
          message: `${typeLabel} destination "${level.name}" already exists — no update needed.`,
        });
        summary.skipped += 1;
      }

      const id = Number(match.id);
      if (level.type === "city") summary.ids.cityId = id;
      if (level.type === "region") summary.ids.regionId = id;
      if (level.type === "country") summary.ids.countryId = id;
      continue;
    }

    onProgress({
      level: "create",
      message: `Creating ${typeLabel} destination "${level.name}"...`,
    });
    const newId = await createDestination(payload);
    const createdDestination: Destination = { ...payload, id: newId };
    existingDestinations.push(createdDestination);
    summary.created += 1;
    onProgress({
      level: "success",
      message: `Created ${typeLabel} destination "${level.name}".`,
    });

    if (level.type === "city") summary.ids.cityId = newId;
    if (level.type === "region") summary.ids.regionId = newId;
    if (level.type === "country") summary.ids.countryId = newId;
  }

  return summary;
}
