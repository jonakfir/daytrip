/**
 * Skyscanner deep-link helpers.
 *
 * Skyscanner's actual API is partner-only, but their public search URLs
 * accept structured params. We build deep links so clicking a flight or
 * hotel opens Skyscanner's real results page with everything pre-filled.
 *
 * Flight URL format:
 *   https://www.skyscanner.com/transport/flights/{from}/{to}/{depart}/{return}/
 *   - from/to: 3-letter Skyscanner location codes (LAX, CDG, NYCA, TYOA…)
 *   - depart/return: YYMMDD
 *
 * Hotel URL format:
 *   https://www.skyscanner.com/hotels/search/{destination-slug}/{checkin}/{checkout}/
 *
 * To monetize, append your affiliate ID via ?associateId=XYZ on each link.
 */

/** Map of common origin city names → Skyscanner "any-airport" code (3 letters). */
const ORIGIN_CITY_TO_CODE: Record<string, string> = {
  // North America
  "new york": "NYCA",
  "nyc": "NYCA",
  "los angeles": "LAXA",
  "la": "LAXA",
  "san francisco": "SFOA",
  "chicago": "CHIA",
  "miami": "MIAA",
  "boston": "BOSA",
  "seattle": "SEAA",
  "washington": "WASA",
  "washington dc": "WASA",
  "dc": "WASA",
  "atlanta": "ATL",
  "dallas": "DFWA",
  "houston": "HOUA",
  "phoenix": "PHX",
  "denver": "DEN",
  "las vegas": "LAS",
  "philadelphia": "PHL",
  "orlando": "ORL",
  "toronto": "YTOA",
  "vancouver": "YVR",
  "montreal": "YMQA",
  "mexico city": "MEX",
  // Europe
  "london": "LOND",
  "paris": "PARI",
  "amsterdam": "AMS",
  "berlin": "BERL",
  "frankfurt": "FRA",
  "munich": "MUC",
  "rome": "ROME",
  "milan": "MILA",
  "madrid": "MAD",
  "barcelona": "BCN",
  "lisbon": "LIS",
  "porto": "OPO",
  "athens": "ATH",
  "vienna": "VIE",
  "zurich": "ZRH",
  "geneva": "GVA",
  "brussels": "BRU",
  "copenhagen": "CPH",
  "stockholm": "STOA",
  "oslo": "OSLA",
  "helsinki": "HEL",
  "dublin": "DUB",
  "edinburgh": "EDI",
  "manchester": "MAN",
  "warsaw": "WAW",
  "prague": "PRG",
  "budapest": "BUD",
  "istanbul": "ISTA",
  "moscow": "MOWA",
  // Middle East / Africa
  "dubai": "DXB",
  "abu dhabi": "AUH",
  "doha": "DOH",
  "tel aviv": "TLV",
  "cairo": "CAI",
  "johannesburg": "JNB",
  "cape town": "CPT",
  "marrakech": "RAK",
  "casablanca": "CMN",
  // Asia
  "tokyo": "TYOA",
  "osaka": "OSAA",
  "kyoto": "TYOA",
  "seoul": "SELA",
  "beijing": "BJSA",
  "shanghai": "SHAA",
  "hong kong": "HKG",
  "taipei": "TPE",
  "singapore": "SIN",
  "bangkok": "BKKA",
  "kuala lumpur": "KUL",
  "manila": "MNL",
  "jakarta": "JKTA",
  "mumbai": "BOM",
  "delhi": "DEL",
  "bangalore": "BLR",
  // Oceania / Pacific
  "sydney": "SYD",
  "melbourne": "MEL",
  "brisbane": "BNE",
  "perth": "PER",
  "auckland": "AKL",
  // South America
  "sao paulo": "SAOA",
  "rio de janeiro": "RIOA",
  "buenos aires": "BUEA",
  "lima": "LIM",
  "bogota": "BOG",
  "santiago": "SCLA",
};

/**
 * Look up a Skyscanner location code for a city name. Returns the 3-letter
 * code if known, otherwise null (in which case we fall back to the search URL).
 */
export function lookupSkyscannerCode(city: string | null | undefined): string | null {
  if (!city) return null;
  const normalized = city.toLowerCase().trim().split(",")[0].trim();
  return ORIGIN_CITY_TO_CODE[normalized] ?? null;
}

/** Convert YYYY-MM-DD to YYMMDD (Skyscanner's compact format). */
function toSkyscannerDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y.slice(2)}${m}${d}`;
}

/** Generic destination URL when we don't have an IATA code. */
function citySearchUrl(city: string): string {
  return `https://www.skyscanner.com/g/radar/en-GB/?market=US&currency=USD&search=${encodeURIComponent(
    city
  )}`;
}

/**
 * Build a flight search deep link. If we know both city codes, use the
 * canonical /transport/flights/from/to/dep/ret/ URL. Otherwise fall back
 * to a generic search URL with the destination name.
 */
export function buildSkyscannerFlightUrl(params: {
  originCity?: string | null;
  destinationCity: string;
  startDate: string;
  endDate: string;
  travelers?: number;
  /** Optional explicit IATA codes (Claude can supply these). */
  originAirport?: string | null;
  destinationAirport?: string | null;
}): string {
  const originCode =
    params.originAirport?.toUpperCase() ??
    lookupSkyscannerCode(params.originCity ?? null);
  const destCode =
    params.destinationAirport?.toUpperCase() ??
    lookupSkyscannerCode(params.destinationCity);

  if (!originCode || !destCode) {
    return citySearchUrl(params.destinationCity);
  }

  const depart = toSkyscannerDate(params.startDate);
  const ret = toSkyscannerDate(params.endDate);
  const adults = params.travelers ?? 1;

  return `https://www.skyscanner.com/transport/flights/${originCode.toLowerCase()}/${destCode.toLowerCase()}/${depart}/${ret}/?adults=${adults}&children=0&adultsv2=${adults}&childrenv2=&infants=0&cabinclass=economy&rtn=1&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false`;
}

/** Build a hotel search deep link. */
export function buildSkyscannerHotelUrl(params: {
  destinationCity: string;
  startDate: string;
  endDate: string;
  travelers?: number;
}): string {
  const slug = params.destinationCity
    .toLowerCase()
    .replace(/,.*$/, "") // strip ", Country"
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
  const checkin = params.startDate;
  const checkout = params.endDate;
  const adults = params.travelers ?? 2;

  return `https://www.skyscanner.com/hotels/search?entity_name=${encodeURIComponent(
    params.destinationCity.split(",")[0].trim()
  )}&checkin=${checkin}&checkout=${checkout}&adults=${adults}&rooms=1&cabinclass=economy&utm_source=daytrip`;
}
