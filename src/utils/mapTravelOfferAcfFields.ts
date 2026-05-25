const DEPARTURE_AIRPORT_SLUGS = new Set([
  "amsterdam_schiphol",
  "brussel_zaventem",
  "charleroi",
  "eindhoven",
  "dusseldorf",
  "keulen",
]);

const BOARD_TYPE_SLUGS = new Set([
  "logies",
  "logies_ontbijt",
  "halfpension",
  "volpension",
  "allinclusive",
]);

const DEPARTURE_AIRPORT_ALIASES: Record<string, string> = {
  ams: "amsterdam_schiphol",
  amsterdam: "amsterdam_schiphol",
  "amsterdam (schiphol)": "amsterdam_schiphol",
  "amsterdam schiphol": "amsterdam_schiphol",
  schiphol: "amsterdam_schiphol",
  bru: "brussel_zaventem",
  brussel: "brussel_zaventem",
  "brussel zaventem": "brussel_zaventem",
  zaventem: "brussel_zaventem",
  crl: "charleroi",
  charleroi: "charleroi",
  "charleroi (brussel zuid)": "charleroi",
  "charleroi brussel zuid": "charleroi",
  "brussel zuid": "charleroi",
  "brussel-zuid": "charleroi",
  cgn: "keulen",
  keulen: "keulen",
  cologne: "keulen",
  köln: "keulen",
  dus: "dusseldorf",
  dusseldorf: "dusseldorf",
  düsseldorf: "dusseldorf",
  dusseldorf_airport: "dusseldorf",
  ein: "eindhoven",
  eindhoven: "eindhoven",
};

const BOARD_TYPE_ALIASES: Record<string, string> = {
  logies: "logies",
  "logies & ontbijt": "logies_ontbijt",
  "logies + ontbijt": "logies_ontbijt",
  "logies en ontbijt": "logies_ontbijt",
  logies_ontbijt: "logies_ontbijt",
  halfpension: "halfpension",
  "half pension": "halfpension",
  volpension: "volpension",
  "vol pension": "volpension",
  allinclusive: "allinclusive",
  "all inclusive": "allinclusive",
  all_inclusive: "allinclusive",
};

const normalizeLookupKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\++/g, "+")
    .replace(/\s+/g, " ");

const normalizeBoardLookupKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\++/g, " ")
    .replace(/\s+/g, " ");

const toSlugKey = (value: string) =>
  value.trim().toLowerCase().replace(/[\s-]+/g, "_");

const stripParenthetical = (value: string) =>
  value.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();

export function mapDepartureAirport(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const raw = String(value).trim();
  const slug = toSlugKey(raw);

  if (DEPARTURE_AIRPORT_SLUGS.has(slug)) {
    return slug;
  }

  const lookupKeys = [
    normalizeLookupKey(raw),
    normalizeLookupKey(stripParenthetical(raw)),
  ];

  for (const key of lookupKeys) {
    const alias = DEPARTURE_AIRPORT_ALIASES[key];
    if (alias) {
      return alias;
    }

    const keySlug = toSlugKey(key);
    if (DEPARTURE_AIRPORT_SLUGS.has(keySlug)) {
      return keySlug;
    }
  }

  for (const airportSlug of DEPARTURE_AIRPORT_SLUGS) {
    const prefix = airportSlug.split("_")[0];
    const normalized = normalizeLookupKey(raw);

    if (
      normalized === prefix ||
      normalized.startsWith(`${prefix} `) ||
      slug.startsWith(`${prefix}_`)
    ) {
      return airportSlug;
    }
  }

  throw new Error(
    `Unknown departure_airport "${raw}". Use one of: ${[...DEPARTURE_AIRPORT_SLUGS].join(", ")}.`,
  );
}

export function mapBoardType(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const raw = String(value).trim();
  const slug = toSlugKey(raw.replace(/\+/g, " "));

  if (BOARD_TYPE_SLUGS.has(slug)) {
    return slug;
  }

  const lookupKeys = [
    normalizeLookupKey(raw),
    normalizeBoardLookupKey(raw),
    normalizeBoardLookupKey(raw.replace(/\+/g, " ")),
  ];

  for (const key of lookupKeys) {
    const alias = BOARD_TYPE_ALIASES[key];
    if (alias) {
      return alias;
    }
  }

  const compact = normalizeBoardLookupKey(raw);
  if (compact.includes("logies") && compact.includes("ontbijt")) {
    return "logies_ontbijt";
  }

  if (compact.includes("half") && compact.includes("pension")) {
    return "halfpension";
  }

  if (compact.includes("vol") && compact.includes("pension")) {
    return "volpension";
  }

  if (compact.includes("all") && compact.includes("inclusive")) {
    return "allinclusive";
  }

  if (compact === "logies") {
    return "logies";
  }

  throw new Error(
    `Unknown board_type "${raw}". Use one of: ${[...BOARD_TYPE_SLUGS].join(", ")}.`,
  );
}

export function mapTravelOfferImportFields(offer: Record<string, unknown>) {
  const mapped: Record<string, unknown> = { ...offer };

  if ("departure_airport" in offer) {
    mapped.departure_airport = mapDepartureAirport(offer.departure_airport);
  }

  if ("board_type" in offer) {
    mapped.board_type = mapBoardType(offer.board_type);
  }

  if ("accommodation" in offer && offer.accommodation !== null) {
    mapped.accommodation = Number(offer.accommodation);
  }

  return mapped;
}
