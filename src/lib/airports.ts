/**
 * Hardcoded IATA airport code map for the world's ~250 busiest airports.
 *
 * We ship this inline because:
 *   1. Photon/OSM doesn't index airports by IATA code (e.g. "LAX" matches a
 *      village called Lax in Switzerland)
 *   2. Users want instant suggestions the moment they type a 3-letter code
 *   3. The list is small and almost never changes
 *
 * Feel free to extend. Format: [IATA, name, city, country].
 */

export interface AirportRecord {
  iata: string;
  name: string;
  city: string;
  country: string;
}

export const AIRPORTS: AirportRecord[] = [
  // ── North America ────────────────────────────────────────────
  { iata: "JFK", name: "John F. Kennedy Intl", city: "New York", country: "USA" },
  { iata: "LGA", name: "LaGuardia", city: "New York", country: "USA" },
  { iata: "EWR", name: "Newark Liberty Intl", city: "Newark", country: "USA" },
  { iata: "LAX", name: "Los Angeles Intl", city: "Los Angeles", country: "USA" },
  { iata: "BUR", name: "Hollywood Burbank", city: "Burbank", country: "USA" },
  { iata: "LGB", name: "Long Beach", city: "Long Beach", country: "USA" },
  { iata: "SFO", name: "San Francisco Intl", city: "San Francisco", country: "USA" },
  { iata: "OAK", name: "Oakland Intl", city: "Oakland", country: "USA" },
  { iata: "SJC", name: "San Jose Intl", city: "San Jose", country: "USA" },
  { iata: "ORD", name: "O'Hare Intl", city: "Chicago", country: "USA" },
  { iata: "MDW", name: "Midway Intl", city: "Chicago", country: "USA" },
  { iata: "ATL", name: "Hartsfield-Jackson", city: "Atlanta", country: "USA" },
  { iata: "DFW", name: "Dallas/Fort Worth Intl", city: "Dallas", country: "USA" },
  { iata: "DAL", name: "Dallas Love Field", city: "Dallas", country: "USA" },
  { iata: "IAH", name: "George Bush Intercontinental", city: "Houston", country: "USA" },
  { iata: "HOU", name: "William P. Hobby", city: "Houston", country: "USA" },
  { iata: "MIA", name: "Miami Intl", city: "Miami", country: "USA" },
  { iata: "FLL", name: "Fort Lauderdale-Hollywood", city: "Fort Lauderdale", country: "USA" },
  { iata: "MCO", name: "Orlando Intl", city: "Orlando", country: "USA" },
  { iata: "TPA", name: "Tampa Intl", city: "Tampa", country: "USA" },
  { iata: "BOS", name: "Logan Intl", city: "Boston", country: "USA" },
  { iata: "SEA", name: "Seattle-Tacoma Intl", city: "Seattle", country: "USA" },
  { iata: "PDX", name: "Portland Intl", city: "Portland", country: "USA" },
  { iata: "DEN", name: "Denver Intl", city: "Denver", country: "USA" },
  { iata: "PHX", name: "Phoenix Sky Harbor", city: "Phoenix", country: "USA" },
  { iata: "LAS", name: "Harry Reid Intl", city: "Las Vegas", country: "USA" },
  { iata: "SAN", name: "San Diego Intl", city: "San Diego", country: "USA" },
  { iata: "IAD", name: "Washington Dulles Intl", city: "Washington", country: "USA" },
  { iata: "DCA", name: "Ronald Reagan National", city: "Washington", country: "USA" },
  { iata: "BWI", name: "Baltimore/Washington Intl", city: "Baltimore", country: "USA" },
  { iata: "PHL", name: "Philadelphia Intl", city: "Philadelphia", country: "USA" },
  { iata: "CLT", name: "Charlotte Douglas Intl", city: "Charlotte", country: "USA" },
  { iata: "DTW", name: "Detroit Metro", city: "Detroit", country: "USA" },
  { iata: "MSP", name: "Minneapolis-St Paul Intl", city: "Minneapolis", country: "USA" },
  { iata: "SLC", name: "Salt Lake City Intl", city: "Salt Lake City", country: "USA" },
  { iata: "HNL", name: "Daniel K. Inouye Intl", city: "Honolulu", country: "USA" },
  { iata: "ANC", name: "Ted Stevens Anchorage Intl", city: "Anchorage", country: "USA" },
  { iata: "AUS", name: "Austin-Bergstrom Intl", city: "Austin", country: "USA" },
  { iata: "YYZ", name: "Toronto Pearson Intl", city: "Toronto", country: "Canada" },
  { iata: "YVR", name: "Vancouver Intl", city: "Vancouver", country: "Canada" },
  { iata: "YUL", name: "Montréal-Trudeau Intl", city: "Montreal", country: "Canada" },
  { iata: "YYC", name: "Calgary Intl", city: "Calgary", country: "Canada" },
  { iata: "MEX", name: "Mexico City Intl", city: "Mexico City", country: "Mexico" },
  { iata: "CUN", name: "Cancún Intl", city: "Cancún", country: "Mexico" },

  // ── Europe ───────────────────────────────────────────────────
  { iata: "LHR", name: "Heathrow", city: "London", country: "UK" },
  { iata: "LGW", name: "Gatwick", city: "London", country: "UK" },
  { iata: "STN", name: "Stansted", city: "London", country: "UK" },
  { iata: "LTN", name: "Luton", city: "London", country: "UK" },
  { iata: "LCY", name: "London City", city: "London", country: "UK" },
  { iata: "MAN", name: "Manchester", city: "Manchester", country: "UK" },
  { iata: "EDI", name: "Edinburgh", city: "Edinburgh", country: "UK" },
  { iata: "DUB", name: "Dublin", city: "Dublin", country: "Ireland" },
  { iata: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France" },
  { iata: "ORY", name: "Orly", city: "Paris", country: "France" },
  { iata: "NCE", name: "Côte d'Azur", city: "Nice", country: "France" },
  { iata: "LYS", name: "Lyon–Saint-Exupéry", city: "Lyon", country: "France" },
  { iata: "MRS", name: "Marseille Provence", city: "Marseille", country: "France" },
  { iata: "AMS", name: "Schiphol", city: "Amsterdam", country: "Netherlands" },
  { iata: "BRU", name: "Brussels", city: "Brussels", country: "Belgium" },
  { iata: "FRA", name: "Frankfurt", city: "Frankfurt", country: "Germany" },
  { iata: "MUC", name: "Munich", city: "Munich", country: "Germany" },
  { iata: "BER", name: "Berlin Brandenburg", city: "Berlin", country: "Germany" },
  { iata: "HAM", name: "Hamburg", city: "Hamburg", country: "Germany" },
  { iata: "DUS", name: "Düsseldorf", city: "Düsseldorf", country: "Germany" },
  { iata: "ZRH", name: "Zürich", city: "Zürich", country: "Switzerland" },
  { iata: "GVA", name: "Geneva", city: "Geneva", country: "Switzerland" },
  { iata: "VIE", name: "Vienna Intl", city: "Vienna", country: "Austria" },
  { iata: "PRG", name: "Václav Havel", city: "Prague", country: "Czech Republic" },
  { iata: "BUD", name: "Budapest Ferenc Liszt", city: "Budapest", country: "Hungary" },
  { iata: "WAW", name: "Warsaw Chopin", city: "Warsaw", country: "Poland" },
  { iata: "CPH", name: "Copenhagen", city: "Copenhagen", country: "Denmark" },
  { iata: "ARN", name: "Stockholm Arlanda", city: "Stockholm", country: "Sweden" },
  { iata: "OSL", name: "Oslo Gardermoen", city: "Oslo", country: "Norway" },
  { iata: "HEL", name: "Helsinki-Vantaa", city: "Helsinki", country: "Finland" },
  { iata: "KEF", name: "Keflavík Intl", city: "Reykjavík", country: "Iceland" },
  { iata: "MAD", name: "Adolfo Suárez Madrid-Barajas", city: "Madrid", country: "Spain" },
  { iata: "BCN", name: "Barcelona-El Prat", city: "Barcelona", country: "Spain" },
  { iata: "AGP", name: "Málaga", city: "Málaga", country: "Spain" },
  { iata: "PMI", name: "Palma de Mallorca", city: "Palma", country: "Spain" },
  { iata: "LIS", name: "Humberto Delgado", city: "Lisbon", country: "Portugal" },
  { iata: "OPO", name: "Francisco Sá Carneiro", city: "Porto", country: "Portugal" },
  { iata: "FCO", name: "Leonardo da Vinci-Fiumicino", city: "Rome", country: "Italy" },
  { iata: "CIA", name: "Ciampino", city: "Rome", country: "Italy" },
  { iata: "MXP", name: "Milan Malpensa", city: "Milan", country: "Italy" },
  { iata: "LIN", name: "Milan Linate", city: "Milan", country: "Italy" },
  { iata: "VCE", name: "Venice Marco Polo", city: "Venice", country: "Italy" },
  { iata: "NAP", name: "Naples Intl", city: "Naples", country: "Italy" },
  { iata: "FLR", name: "Florence Amerigo Vespucci", city: "Florence", country: "Italy" },
  { iata: "ATH", name: "Athens Intl", city: "Athens", country: "Greece" },
  { iata: "SKG", name: "Thessaloniki Intl", city: "Thessaloniki", country: "Greece" },
  { iata: "JTR", name: "Santorini (Thira)", city: "Santorini", country: "Greece" },
  { iata: "IST", name: "Istanbul", city: "Istanbul", country: "Turkey" },
  { iata: "SAW", name: "Sabiha Gökçen", city: "Istanbul", country: "Turkey" },
  { iata: "SVO", name: "Sheremetyevo", city: "Moscow", country: "Russia" },
  { iata: "DME", name: "Domodedovo", city: "Moscow", country: "Russia" },
  { iata: "DBV", name: "Dubrovnik", city: "Dubrovnik", country: "Croatia" },
  { iata: "SPU", name: "Split", city: "Split", country: "Croatia" },
  { iata: "ZAG", name: "Franjo Tuđman", city: "Zagreb", country: "Croatia" },

  // ── Middle East / Africa ─────────────────────────────────────
  { iata: "DXB", name: "Dubai Intl", city: "Dubai", country: "UAE" },
  { iata: "DWC", name: "Al Maktoum Intl", city: "Dubai", country: "UAE" },
  { iata: "AUH", name: "Abu Dhabi Intl", city: "Abu Dhabi", country: "UAE" },
  { iata: "DOH", name: "Hamad Intl", city: "Doha", country: "Qatar" },
  { iata: "KWI", name: "Kuwait Intl", city: "Kuwait City", country: "Kuwait" },
  { iata: "BAH", name: "Bahrain Intl", city: "Manama", country: "Bahrain" },
  { iata: "TLV", name: "Ben Gurion", city: "Tel Aviv", country: "Israel" },
  { iata: "CAI", name: "Cairo Intl", city: "Cairo", country: "Egypt" },
  { iata: "RAK", name: "Marrakech Menara", city: "Marrakech", country: "Morocco" },
  { iata: "CMN", name: "Mohammed V Intl", city: "Casablanca", country: "Morocco" },
  { iata: "JNB", name: "O. R. Tambo", city: "Johannesburg", country: "South Africa" },
  { iata: "CPT", name: "Cape Town Intl", city: "Cape Town", country: "South Africa" },
  { iata: "NBO", name: "Jomo Kenyatta Intl", city: "Nairobi", country: "Kenya" },
  { iata: "ADD", name: "Addis Ababa Bole", city: "Addis Ababa", country: "Ethiopia" },
  { iata: "ZNZ", name: "Abeid Amani Karume", city: "Zanzibar", country: "Tanzania" },

  // ── Asia ─────────────────────────────────────────────────────
  { iata: "HND", name: "Haneda", city: "Tokyo", country: "Japan" },
  { iata: "NRT", name: "Narita Intl", city: "Tokyo", country: "Japan" },
  { iata: "KIX", name: "Kansai Intl", city: "Osaka", country: "Japan" },
  { iata: "ITM", name: "Osaka Itami", city: "Osaka", country: "Japan" },
  { iata: "NGO", name: "Chubu Centrair", city: "Nagoya", country: "Japan" },
  { iata: "CTS", name: "New Chitose", city: "Sapporo", country: "Japan" },
  { iata: "ICN", name: "Incheon Intl", city: "Seoul", country: "South Korea" },
  { iata: "GMP", name: "Gimpo Intl", city: "Seoul", country: "South Korea" },
  { iata: "PEK", name: "Beijing Capital Intl", city: "Beijing", country: "China" },
  { iata: "PKX", name: "Beijing Daxing", city: "Beijing", country: "China" },
  { iata: "PVG", name: "Shanghai Pudong", city: "Shanghai", country: "China" },
  { iata: "SHA", name: "Shanghai Hongqiao", city: "Shanghai", country: "China" },
  { iata: "CAN", name: "Guangzhou Baiyun", city: "Guangzhou", country: "China" },
  { iata: "SZX", name: "Shenzhen Bao'an", city: "Shenzhen", country: "China" },
  { iata: "CTU", name: "Chengdu Shuangliu", city: "Chengdu", country: "China" },
  { iata: "HKG", name: "Hong Kong Intl", city: "Hong Kong", country: "Hong Kong" },
  { iata: "TPE", name: "Taoyuan Intl", city: "Taipei", country: "Taiwan" },
  { iata: "SIN", name: "Singapore Changi", city: "Singapore", country: "Singapore" },
  { iata: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "Thailand" },
  { iata: "DMK", name: "Don Mueang Intl", city: "Bangkok", country: "Thailand" },
  { iata: "HKT", name: "Phuket Intl", city: "Phuket", country: "Thailand" },
  { iata: "KUL", name: "Kuala Lumpur Intl", city: "Kuala Lumpur", country: "Malaysia" },
  { iata: "MNL", name: "Ninoy Aquino Intl", city: "Manila", country: "Philippines" },
  { iata: "CGK", name: "Soekarno-Hatta Intl", city: "Jakarta", country: "Indonesia" },
  { iata: "DPS", name: "Ngurah Rai Intl", city: "Bali (Denpasar)", country: "Indonesia" },
  { iata: "SGN", name: "Tan Son Nhat Intl", city: "Ho Chi Minh City", country: "Vietnam" },
  { iata: "HAN", name: "Noi Bai Intl", city: "Hanoi", country: "Vietnam" },
  { iata: "PNH", name: "Phnom Penh Intl", city: "Phnom Penh", country: "Cambodia" },
  { iata: "REP", name: "Siem Reap Intl", city: "Siem Reap", country: "Cambodia" },
  { iata: "RGN", name: "Yangon Intl", city: "Yangon", country: "Myanmar" },
  { iata: "DEL", name: "Indira Gandhi Intl", city: "Delhi", country: "India" },
  { iata: "BOM", name: "Chhatrapati Shivaji", city: "Mumbai", country: "India" },
  { iata: "BLR", name: "Kempegowda Intl", city: "Bangalore", country: "India" },
  { iata: "MAA", name: "Chennai Intl", city: "Chennai", country: "India" },
  { iata: "CCU", name: "Netaji Subhas Chandra Bose", city: "Kolkata", country: "India" },
  { iata: "HYD", name: "Rajiv Gandhi Intl", city: "Hyderabad", country: "India" },
  { iata: "COK", name: "Cochin Intl", city: "Kochi", country: "India" },
  { iata: "CMB", name: "Bandaranaike Intl", city: "Colombo", country: "Sri Lanka" },
  { iata: "KTM", name: "Tribhuvan Intl", city: "Kathmandu", country: "Nepal" },

  // ── Oceania ──────────────────────────────────────────────────
  { iata: "SYD", name: "Kingsford Smith", city: "Sydney", country: "Australia" },
  { iata: "MEL", name: "Tullamarine", city: "Melbourne", country: "Australia" },
  { iata: "BNE", name: "Brisbane Intl", city: "Brisbane", country: "Australia" },
  { iata: "PER", name: "Perth", city: "Perth", country: "Australia" },
  { iata: "ADL", name: "Adelaide", city: "Adelaide", country: "Australia" },
  { iata: "CNS", name: "Cairns", city: "Cairns", country: "Australia" },
  { iata: "AKL", name: "Auckland", city: "Auckland", country: "New Zealand" },
  { iata: "WLG", name: "Wellington", city: "Wellington", country: "New Zealand" },
  { iata: "CHC", name: "Christchurch", city: "Christchurch", country: "New Zealand" },
  { iata: "ZQN", name: "Queenstown", city: "Queenstown", country: "New Zealand" },
  { iata: "NAN", name: "Nadi Intl", city: "Nadi", country: "Fiji" },

  // ── South America ────────────────────────────────────────────
  { iata: "GRU", name: "São Paulo/Guarulhos", city: "São Paulo", country: "Brazil" },
  { iata: "CGH", name: "Congonhas", city: "São Paulo", country: "Brazil" },
  { iata: "GIG", name: "Galeão", city: "Rio de Janeiro", country: "Brazil" },
  { iata: "SDU", name: "Santos Dumont", city: "Rio de Janeiro", country: "Brazil" },
  { iata: "BSB", name: "Brasília Intl", city: "Brasília", country: "Brazil" },
  { iata: "EZE", name: "Ministro Pistarini", city: "Buenos Aires", country: "Argentina" },
  { iata: "AEP", name: "Aeroparque Jorge Newbery", city: "Buenos Aires", country: "Argentina" },
  { iata: "SCL", name: "Arturo Merino Benítez", city: "Santiago", country: "Chile" },
  { iata: "LIM", name: "Jorge Chávez Intl", city: "Lima", country: "Peru" },
  { iata: "BOG", name: "El Dorado Intl", city: "Bogotá", country: "Colombia" },
  { iata: "UIO", name: "Mariscal Sucre Intl", city: "Quito", country: "Ecuador" },
  { iata: "PTY", name: "Tocumen Intl", city: "Panama City", country: "Panama" },
];

const BY_IATA: Map<string, AirportRecord> = new Map(
  AIRPORTS.map((a) => [a.iata.toUpperCase(), a])
);

/** Exact IATA code lookup. */
export function getAirportByIATA(code: string): AirportRecord | null {
  return BY_IATA.get(code.toUpperCase().trim()) ?? null;
}

/**
 * Search airports by IATA, airport name, or city name. Returns ranked
 * matches (exact IATA first, then name-starts-with, then contains).
 */
export function searchAirports(
  query: string,
  limit: number = 6
): AirportRecord[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  // Exact IATA match → top result
  const exact = q.length === 3 ? BY_IATA.get(q.toUpperCase()) : null;

  const scored: Array<{ rec: AirportRecord; score: number }> = [];
  for (const a of AIRPORTS) {
    if (exact && a === exact) continue;
    const iata = a.iata.toLowerCase();
    const name = a.name.toLowerCase();
    const city = a.city.toLowerCase();
    const country = a.country.toLowerCase();

    let score = 0;
    if (iata === q) score = 100;
    else if (iata.startsWith(q)) score = 90;
    else if (city === q) score = 80;
    else if (city.startsWith(q)) score = 70;
    else if (name.startsWith(q)) score = 60;
    else if (city.includes(q)) score = 50;
    else if (name.includes(q)) score = 40;
    else if (country.startsWith(q)) score = 25;
    // 3-letter query that loosely matches IATA
    else if (q.length === 3 && iata.includes(q)) score = 20;

    if (score > 0) scored.push({ rec: a, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const results: AirportRecord[] = [];
  if (exact) results.push(exact);
  for (const s of scored) {
    if (results.length >= limit) break;
    results.push(s.rec);
  }
  return results;
}

/**
 * Format an airport record as a "compact label" for the origin city field.
 * Stable and machine-readable: the IATA code is first so our Skyscanner
 * deep-link builder can extract it.
 *
 * Format: "JFK - New York (John F. Kennedy Intl)"
 */
export function formatAirportLabel(a: AirportRecord): string {
  return `${a.iata} · ${a.city} (${a.name})`;
}

/**
 * Given a label produced by formatAirportLabel, extract the IATA code.
 * Returns null for non-airport labels.
 */
export function extractIataFromLabel(label: string): string | null {
  const m = label.match(/^([A-Z]{3})\s*·/);
  return m ? m[1] : null;
}
