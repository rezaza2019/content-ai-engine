export type ParsedTravelOffer = {
  country: string;
  region: string;
  city: string;
  accommodationName: string;
  boardingType: string;
  departureDate: string;
  departureAirports: string[];
  roomConfig: string;
  transportType: string;
  tripDuration: string;
  sourceUrl: string;
};

export function createAffiliateLink(normalUrl: string) {
  const baseAffiliate =
    "https://ds1.nl/c/?si=7805&li=1362777&wi=263320&ws=app&dl=";

  const url = new URL(normalUrl);
  if (url.hostname === "ds1.nl" && url.pathname.startsWith("/c/")) {
    return normalUrl;
  }

  const pathAndQuery = url.pathname.replace(/^\/+/, "") + url.search;
  return baseAffiliate + encodeURIComponent(pathAndQuery);
}

const formatSlugTitle = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export function parseTravelOfferUrl(url: string): ParsedTravelOffer | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Extract path segments: /spanje/andalusie/marbella/globales_pueblo_andaluz
    const pathSegments = pathname
      .split("/")
      .filter((seg) => seg.length > 0);

    if (pathSegments.length < 4) {
      return null;
    }

    const country = pathSegments[0];
    const region = pathSegments[1];
    const city = pathSegments[2];
    const accommodationSlug = pathSegments[3];

    const accommodationName = formatSlugTitle(accommodationSlug);

    // Extract query parameters
    const boardingType = urlObj.searchParams.get("boardingtype") || "AI";
    const departureDate = urlObj.searchParams.get("departuredate") || "";
    const roomConfig = urlObj.searchParams.get("room") || "";
    const transportType = urlObj.searchParams.get("transporttype") || "";
    const tripDuration = urlObj.searchParams.get("trip_duration_range") || "";

    // URLSearchParams decodes %7E to ~, so support both decoded and raw forms.
    const departureAirportParam = urlObj.searchParams.get("departureairport") || "";
    const departureAirports = departureAirportParam
      .split(/~|%7E/i)
      .map((airport) => airport.trim())
      .filter((airport) => airport.length > 0);

    return {
      country: country.toLowerCase(),
      region: region.toLowerCase(),
      city: city.toLowerCase(),
      accommodationName,
      boardingType: boardingType.toUpperCase(),
      departureDate,
      departureAirports,
      roomConfig,
      transportType,
      tripDuration,
      sourceUrl: url,
    };
  } catch (error) {
    console.error("Failed to parse travel offer URL:", error);
    return null;
  }
}

export function formatBoardingTypeLabel(code: string): string {
  const boardingTypes: Record<string, string> = {
    AI: "All Inclusive",
    HB: "Half Board",
    BB: "Bed & Breakfast",
    RO: "Room Only",
    FB: "Full Board",
  };
  return boardingTypes[code.toUpperCase()] || code;
}
