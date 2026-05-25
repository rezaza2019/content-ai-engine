import { AccommodationImportItem } from "../types/accommodationImport";
import {
  createAccommodation,
  fetchAccommodations,
  updateAccommodation,
} from "./accommodationApi";
import {
  ensureDestinationsFromAccommodationItem,
  EnsuredDestinationIds,
} from "./destinationImportApi";
import { fetchDestinations } from "./destinationApi";
import {
  createTravelOffer,
  fetchTravelOffers,
  updateTravelOffer,
} from "./travelOfferApi";
import { findMatchingAccommodation } from "../utils/findMatchingAccommodation";
import { findMatchingTravelOffer } from "../utils/findMatchingTravelOffer";
import {
  pickAccommodationFields,
  pickTravelOfferFields,
} from "../types/accommodationImport";
import {
  ImportProgressReporter,
  noopImportProgress,
} from "../types/importProgress";

export type AccommodationImportResult = {
  accommodationId: number;
  travelOfferId?: number;
  skippedExisting?: boolean;
  travelOfferSkippedExisting?: boolean;
  destinationIds?: EnsuredDestinationIds;
};

export type AccommodationImportSummary = {
  created: number;
  skipped: number;
  travelOffersCreated: number;
  travelOffersSkipped: number;
  destinationsCreated: number;
  destinationsSkipped: number;
  destinationsUpdated: number;
  results: AccommodationImportResult[];
};

const getItemLabel = (item: AccommodationImportItem) =>
  item.name ||
  (typeof item.title === "string" ? item.title : item.title?.rendered) ||
  "accommodation";

export async function importAccommodationItems(
  items: AccommodationImportItem[],
  onProgress: ImportProgressReporter = noopImportProgress,
): Promise<AccommodationImportSummary> {
  onProgress({
    level: "info",
    message: "Loading existing WordPress data...",
  });

  const existingAccommodations = await fetchAccommodations();
  const existingDestinations = await fetchDestinations();
  const existingTravelOffers = await fetchTravelOffers();

  onProgress({
    level: "success",
    message: `Loaded ${existingAccommodations.length} accommodation(s), ${existingDestinations.length} destination(s), ${existingTravelOffers.length} travel offer(s).`,
  });

  const results: AccommodationImportResult[] = [];
  let created = 0;
  let skipped = 0;
  let travelOffersCreated = 0;
  let travelOffersSkipped = 0;
  let destinationsCreated = 0;
  let destinationsSkipped = 0;
  let destinationsUpdated = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const itemLabel = getItemLabel(item);

    onProgress({
      level: "info",
      message: `Processing ${index + 1}/${items.length}: ${itemLabel}`,
    });

    const destinationResult = await ensureDestinationsFromAccommodationItem(
      item,
      existingDestinations,
      onProgress,
    );
    destinationsCreated += destinationResult.created;
    destinationsSkipped += destinationResult.skipped;
    destinationsUpdated += destinationResult.updated;

    onProgress({
      level: "info",
      message: `Checking accommodation "${itemLabel}"...`,
    });

    const accommodationData = pickAccommodationFields(item);
    const match = findMatchingAccommodation(existingAccommodations, item);

    let accommodationId: number;
    let skippedExisting = false;

    if (match?.id) {
      accommodationId = Number(match.id);
      skippedExisting = true;
      skipped += 1;
      onProgress({
        level: "update",
        message: `Accommodation "${itemLabel}" already exists — updating fields...`,
      });
      await updateAccommodation({ ...accommodationData, id: accommodationId });
      onProgress({
        level: "skip",
        message: `Accommodation "${itemLabel}" updated.`,
      });
    } else {
      onProgress({
        level: "create",
        message: `Accommodation "${itemLabel}" not found — creating...`,
      });
      accommodationId = await createAccommodation(accommodationData);
      created += 1;
      existingAccommodations.push({ ...accommodationData, id: accommodationId });
      onProgress({
        level: "success",
        message: `Created accommodation "${itemLabel}".`,
      });
    }

    const result: AccommodationImportResult = {
      accommodationId,
      skippedExisting,
      destinationIds: destinationResult.ids,
    };

    const travelOfferData = pickTravelOfferFields(
      item,
      accommodationId,
      destinationResult.ids,
    );

    if (travelOfferData) {
      onProgress({
        level: "info",
        message: `Checking travel offer for "${itemLabel}" (${travelOfferData.departure_date}, ${travelOfferData.price_per_person_from} EUR, ${travelOfferData.duration_days} days)...`,
      });

      const travelOfferMatch = findMatchingTravelOffer(
        existingTravelOffers,
        travelOfferData,
      );

      if (travelOfferMatch?.id) {
        onProgress({
          level: "skip",
          message: `Duplicate travel offer found — updating existing offer #${travelOfferMatch.id}...`,
        });
        await updateTravelOffer({
          ...travelOfferMatch,
          ...travelOfferData,
          id: travelOfferMatch.id,
        });
        result.travelOfferId = Number(travelOfferMatch.id);
        result.travelOfferSkippedExisting = true;
        travelOffersSkipped += 1;
        onProgress({
          level: "success",
          message: `Travel offer #${travelOfferMatch.id} updated.`,
        });
      } else {
        onProgress({
          level: "create",
          message: `Creating travel offer for "${itemLabel}"...`,
        });
        const travelOfferId = await createTravelOffer(travelOfferData);
        result.travelOfferId = travelOfferId;
        travelOffersCreated += 1;
        existingTravelOffers.push({ ...travelOfferData, id: travelOfferId });
        onProgress({
          level: "success",
          message: `Created travel offer #${travelOfferId}.`,
        });
      }
    }

    results.push(result);
  }

  onProgress({
    level: "success",
    message: "Import finished.",
  });

  return {
    created,
    skipped,
    travelOffersCreated,
    travelOffersSkipped,
    destinationsCreated,
    destinationsSkipped,
    destinationsUpdated,
    results,
  };
}
