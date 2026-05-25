import { Destination } from "../types/destination";
import { buildDestinationIdentifier, DestinationLevel } from "./destinationIdentifier";

export function findDestinationByIdentifier(
  destinations: Destination[],
  identifier: string,
): Destination | undefined {
  const normalized = identifier.trim().toLowerCase();

  return destinations.find(
    (destination) =>
      destination.destination_identifier?.trim().toLowerCase() === normalized,
  );
}

export function findDestinationByLevel(
  destinations: Destination[],
  name: string,
  type: DestinationLevel,
  countryCode: string,
): Destination | undefined {
  const identifier = buildDestinationIdentifier(name, countryCode);
  const byIdentifier = findDestinationByIdentifier(destinations, identifier);
  if (byIdentifier) return byIdentifier;

  const normalizedName = name.trim().toLowerCase();

  return destinations.find((destination) => {
    const destinationName = (
      destination.destination_name ||
      destination.title?.rendered ||
      ""
    )
      .trim()
      .toLowerCase();

    return (
      destinationName === normalizedName &&
      destination.type_of_destination === type &&
      destination.destination_country?.trim().toLowerCase() ===
        countryCode.toLowerCase()
    );
  });
}
