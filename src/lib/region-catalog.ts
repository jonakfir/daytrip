export interface CatalogCity {
  name: string;
  blurb: string;
}

export interface CatalogCountry {
  name: string;
  cities: CatalogCity[];
}

export interface CatalogRegion {
  slug: string;
  label: string;
  blurb: string;
  countries: CatalogCountry[];
}

export const REGION_CATALOG: CatalogRegion[] = [
  {
    slug: "eastern-europe",
    label: "Eastern Europe",
    blurb: "Medieval old towns, baroque capitals, and layered 20th-century history.",
    countries: [
      {
        name: "Czech Republic",
        cities: [
          { name: "Prague", blurb: "Old Town with the 15th-century astronomical clock." },
          { name: "Český Krumlov", blurb: "Riverbend village under a hilltop Renaissance castle." },
          { name: "Brno", blurb: "Functionalist Villa Tucker and a student-driven cafe scene." },
          { name: "Olomouc", blurb: "Baroque Holy Trinity Column and quiet university squares." },
          { name: "Karlovy Vary", blurb: "Colonnaded spa town in a wooded river valley." },
        ],
      },
      {
        name: "Poland",
        cities: [
          { name: "Kraków", blurb: "Wawel Castle and Europe's largest medieval market square." },
          { name: "Warsaw", blurb: "Rebuilt Old Town and Chopin's Łazienki Park." },
          { name: "Gdańsk", blurb: "Hanseatic waterfront with amber stalls on Mariacka." },
          { name: "Wrocław", blurb: "Bridges, islands, and hundreds of bronze dwarf statues." },
          { name: "Poznań", blurb: "Colorful Stary Rynek and a famous goat-clock tower." },
        ],
      },
      {
        name: "Hungary",
        cities: [
          { name: "Budapest", blurb: "Thermal baths and Parliament on the Danube." },
          { name: "Eger", blurb: "Baroque town under a Turkish-era hilltop castle." },
          { name: "Pécs", blurb: "Early Christian necropolis and Zsolnay ceramics." },
          { name: "Szeged", blurb: "Art Nouveau squares and summer open-air festival." },
          { name: "Debrecen", blurb: "Calvinist Great Church and the Hortobágy puszta nearby." },
        ],
      },
      {
        name: "Slovakia",
        cities: [
          { name: "Bratislava", blurb: "Compact Old Town below a white hilltop castle." },
          { name: "Košice", blurb: "Gothic St. Elisabeth Cathedral on a long pedestrian axis." },
          { name: "Banská Štiavnica", blurb: "UNESCO silver-mining town in the Štiavnica hills." },
          { name: "Levoča", blurb: "Walled town with Master Paul's carved wooden altar." },
          { name: "Trenčín", blurb: "Clifftop castle above the Váh river plain." },
        ],
      },
      {
        name: "Ukraine",
        cities: [
          { name: "Kyiv", blurb: "Golden-domed Saint Sophia and the Lavra cave monastery." },
          { name: "Lviv", blurb: "Habsburg-era coffee houses around Rynok Square." },
          { name: "Odesa", blurb: "Potemkin Steps and neoclassical Black Sea boulevards." },
          { name: "Chernivtsi", blurb: "Moorish-brick university, a former archbishop's residence." },
          { name: "Kamianets-Podilskyi", blurb: "Fortress on a dramatic river-canyon loop." },
        ],
      },
    ],
  },
  {
    slug: "western-europe",
    label: "Western Europe",
    blurb: "Iconic capitals, canal cities, and small towns rich in food and art.",
    countries: [
      {
        name: "France",
        cities: [
          { name: "Paris", blurb: "Louvre, Seine, and the Haussmann boulevard grid." },
          { name: "Lyon", blurb: "Renaissance traboules and Michelin-dense bouchons." },
          { name: "Bordeaux", blurb: "18th-century stone quays along the Garonne." },
          { name: "Strasbourg", blurb: "Timber-framed Petite France and Gothic cathedral." },
          { name: "Nice", blurb: "Promenade des Anglais and ochre Old Town lanes." },
          { name: "Marseille", blurb: "Ancient Greek port below Notre-Dame de la Garde." },
        ],
      },
      {
        name: "Germany",
        cities: [
          { name: "Berlin", blurb: "Museum Island and remnants of the divided city." },
          { name: "Munich", blurb: "Beer halls, Residenz, and the English Garden." },
          { name: "Hamburg", blurb: "Warehouse district HafenCity and the Elbphilharmonie." },
          { name: "Dresden", blurb: "Rebuilt Frauenkirche and Zwinger baroque galleries." },
          { name: "Cologne", blurb: "Twin-spired Gothic cathedral above the Rhine." },
          { name: "Heidelberg", blurb: "Red sandstone castle above an old university town." },
        ],
      },
      {
        name: "Netherlands",
        cities: [
          { name: "Amsterdam", blurb: "17th-century canal ring and gabled merchant houses." },
          { name: "Rotterdam", blurb: "Cube Houses and bold post-war modern architecture." },
          { name: "Utrecht", blurb: "Wharf cellars along the central Oudegracht canal." },
          { name: "The Hague", blurb: "Binnenhof parliament and Vermeer at the Mauritshuis." },
          { name: "Delft", blurb: "Blue pottery and the New Church with royal tombs." },
          { name: "Haarlem", blurb: "Frans Hals Museum and a windmill on the Spaarne." },
        ],
      },
      {
        name: "Belgium",
        cities: [
          { name: "Brussels", blurb: "Grand Place guildhalls and Art Nouveau Horta houses." },
          { name: "Bruges", blurb: "Medieval canal city around the Markt belfry." },
          { name: "Ghent", blurb: "Van Eyck's altarpiece in St Bavo's Cathedral." },
          { name: "Antwerp", blurb: "Rubens House and a diamond district near the station." },
          { name: "Leuven", blurb: "University town with a late-Gothic town hall." },
        ],
      },
      {
        name: "Austria",
        cities: [
          { name: "Vienna", blurb: "Imperial Hofburg and coffee-house ringstraße culture." },
          { name: "Salzburg", blurb: "Mozart's baroque birthplace beneath Hohensalzburg fortress." },
          { name: "Innsbruck", blurb: "Alpine capital with the Golden Roof on the Altstadt." },
          { name: "Graz", blurb: "Red-tiled old town and a modern art Kunsthaus blob." },
          { name: "Hallstatt", blurb: "Lakeside village under a salt-mining mountain." },
        ],
      },
      {
        name: "Switzerland",
        cities: [
          { name: "Zurich", blurb: "Limmat lakefront and a Bahnhofstrasse of banks." },
          { name: "Geneva", blurb: "Jet d'Eau fountain and United Nations on the lake." },
          { name: "Bern", blurb: "Arcaded sandstone old town bent around the Aare." },
          { name: "Lucerne", blurb: "Covered Chapel Bridge below Mount Pilatus." },
          { name: "Basel", blurb: "Rhine river swimming and Fondation Beyeler art." },
          { name: "Lausanne", blurb: "Olympic Museum on terraced Lake Geneva slopes." },
        ],
      },
    ],
  },
  {
    slug: "southern-europe",
    label: "Southern Europe",
    blurb: "Mediterranean coastlines, ancient ruins, and hill towns built for long lunches.",
    countries: [
      {
        name: "Italy",
        cities: [
          { name: "Rome", blurb: "Colosseum, Pantheon, and layered ancient center." },
          { name: "Florence", blurb: "Uffizi, Duomo, and Renaissance Oltrarno workshops." },
          { name: "Venice", blurb: "Car-free island city of canals and campi." },
          { name: "Naples", blurb: "Pizza, archaeology, and views to Mount Vesuvius." },
          { name: "Milan", blurb: "Duomo, fashion quarter, and Leonardo's Last Supper." },
          { name: "Bologna", blurb: "Porticoed medieval center and famed tagliatelle al ragù." },
        ],
      },
      {
        name: "Spain",
        cities: [
          { name: "Barcelona", blurb: "Gaudí's Sagrada Família and Gothic Quarter alleys." },
          { name: "Madrid", blurb: "Prado, Reina Sofía, and a late-night tapas scene." },
          { name: "Seville", blurb: "Moorish Alcázar and Gothic cathedral with La Giralda." },
          { name: "Granada", blurb: "Alhambra palaces above the Albaicín hillside." },
          { name: "Valencia", blurb: "City of Arts, horchata, and paella on the Turia." },
          { name: "San Sebastián", blurb: "Pintxo bars on the Bay of Biscay's La Concha beach." },
        ],
      },
      {
        name: "Portugal",
        cities: [
          { name: "Lisbon", blurb: "Hilltop miradouros, azulejo tiles, and yellow trams." },
          { name: "Porto", blurb: "Port-wine cellars across from the Ribeira quays." },
          { name: "Sintra", blurb: "Fairy-tale palaces in a misty forested sierra." },
          { name: "Coimbra", blurb: "Ancient university with an 18th-century Joanina library." },
          { name: "Évora", blurb: "Walled town with Roman temple and Chapel of Bones." },
          { name: "Faro", blurb: "Algarve capital on the lagoon-flanked Ria Formosa." },
        ],
      },
      {
        name: "Greece",
        cities: [
          { name: "Athens", blurb: "Acropolis above the laneways of Plaka." },
          { name: "Thessaloniki", blurb: "Byzantine walls and waterfront White Tower." },
          { name: "Heraklion", blurb: "Minoan Knossos palace and a Venetian harbor fort." },
          { name: "Nafplio", blurb: "Seaside old town below Palamidi fortress." },
          { name: "Rhodes", blurb: "Medieval Knights' walled city on the Aegean." },
          { name: "Chania", blurb: "Venetian-era harbor with a slender Egyptian lighthouse." },
        ],
      },
      {
        name: "Malta",
        cities: [
          { name: "Valletta", blurb: "Baroque walled capital built by the Knights of St John." },
          { name: "Mdina", blurb: "Silent medieval citadel on an inland limestone ridge." },
          { name: "Sliema", blurb: "Seafront promenade looking across to Valletta's bastions." },
          { name: "Victoria", blurb: "Gozo's hilltop Citadella town and Sunday food market." },
        ],
      },
    ],
  },
  {
    slug: "northern-europe-scandinavia",
    label: "Northern Europe / Scandinavia",
    blurb: "Design-forward capitals, fjord coastlines, and long summer twilights.",
    countries: [
      {
        name: "Sweden",
        cities: [
          { name: "Stockholm", blurb: "14 islands of old town, palaces, and design shops." },
          { name: "Gothenburg", blurb: "Seafood harbor town with tram-lined canals." },
          { name: "Malmö", blurb: "Turning Torso tower on an Øresund-bridge city." },
          { name: "Uppsala", blurb: "Historic university with a twin-spired cathedral." },
          { name: "Visby", blurb: "Hanseatic walled town on Gotland island." },
        ],
      },
      {
        name: "Norway",
        cities: [
          { name: "Oslo", blurb: "Fjord-front Opera House and Vigeland sculpture park." },
          { name: "Bergen", blurb: "Bryggen wooden wharves framed by seven mountains." },
          { name: "Tromsø", blurb: "Arctic cathedral and prime Northern-Lights viewing." },
          { name: "Trondheim", blurb: "Nidaros Cathedral and Old Town bridge over the Nidelva." },
          { name: "Stavanger", blurb: "Wooden old town and Pulpit Rock hike gateway." },
        ],
      },
      {
        name: "Denmark",
        cities: [
          { name: "Copenhagen", blurb: "Nyhavn townhouses and Tivoli pleasure gardens." },
          { name: "Aarhus", blurb: "ARoS rainbow panorama and old-town open-air museum." },
          { name: "Odense", blurb: "Hans Christian Andersen's childhood cobbled streets." },
          { name: "Aalborg", blurb: "Waterfront musikkens-hus and Jomfru Ane Gade bars." },
        ],
      },
      {
        name: "Finland",
        cities: [
          { name: "Helsinki", blurb: "Neoclassical Senate Square and Suomenlinna sea fortress." },
          { name: "Turku", blurb: "Riverside medieval castle and oldest Finnish city." },
          { name: "Rovaniemi", blurb: "Lapland base with Santa Claus Village on the Arctic Circle." },
          { name: "Tampere", blurb: "Red-brick mill town between two glacial lakes." },
        ],
      },
      {
        name: "Iceland",
        cities: [
          { name: "Reykjavík", blurb: "Hallgrímskirkja and colorful tin-clad old-town houses." },
          { name: "Akureyri", blurb: "Northern fjord town with botanical gardens." },
          { name: "Vík", blurb: "Black-sand beaches under basalt-column sea cliffs." },
          { name: "Húsavík", blurb: "Whale-watching harbor on Skjálfandi Bay." },
        ],
      },
    ],
  },
  {
    slug: "balkans",
    label: "Balkans",
    blurb: "Ottoman bridges, Adriatic old towns, and some of Europe's wildest mountains.",
    countries: [
      {
        name: "Croatia",
        cities: [
          { name: "Dubrovnik", blurb: "Marble-paved walled city above the Adriatic." },
          { name: "Split", blurb: "Old town built inside Diocletian's Roman palace." },
          { name: "Zagreb", blurb: "Austro-Hungarian upper town and funicular." },
          { name: "Rovinj", blurb: "Istrian fishing port with Venetian campanile." },
          { name: "Zadar", blurb: "Sea Organ pipes play with the Adriatic waves." },
        ],
      },
      {
        name: "Slovenia",
        cities: [
          { name: "Ljubljana", blurb: "Plečnik's Triple Bridge below a hilltop castle." },
          { name: "Bled", blurb: "Island church in a glacial lake under Alpine peaks." },
          { name: "Piran", blurb: "Venetian-Gothic port on a narrow Adriatic tongue." },
          { name: "Maribor", blurb: "Wine country town with the world's oldest grapevine." },
        ],
      },
      {
        name: "Bosnia and Herzegovina",
        cities: [
          { name: "Sarajevo", blurb: "Ottoman Baščaršija bazaar next to Habsburg avenues." },
          { name: "Mostar", blurb: "Arched Stari Most bridge over the emerald Neretva." },
          { name: "Trebinje", blurb: "Leafy Herzegovina square under an Ottoman old bridge." },
          { name: "Banja Luka", blurb: "Kastel fortress on the Vrbas river." },
        ],
      },
      {
        name: "Montenegro",
        cities: [
          { name: "Kotor", blurb: "Fortified old town on a dramatic Adriatic bay." },
          { name: "Budva", blurb: "Beach resort with a compact Venetian-era citadel." },
          { name: "Cetinje", blurb: "Former royal capital of monasteries and museums." },
          { name: "Perast", blurb: "Baroque captains' houses facing two small islets." },
        ],
      },
      {
        name: "Albania",
        cities: [
          { name: "Tirana", blurb: "Colorful communist-era blocks and Skanderbeg Square." },
          { name: "Berat", blurb: "White Ottoman houses stacked up a river gorge." },
          { name: "Gjirokastër", blurb: "Stone-roofed hillside town under a vast castle." },
          { name: "Sarandë", blurb: "Albanian Riviera base across from Corfu." },
        ],
      },
      {
        name: "North Macedonia",
        cities: [
          { name: "Skopje", blurb: "Stone Bridge linking Ottoman bazaar and statue-filled center." },
          { name: "Ohrid", blurb: "Byzantine churches above an ancient deep lake." },
          { name: "Bitola", blurb: "Consular pedestrian boulevard with Heraclea ruins nearby." },
          { name: "Prilep", blurb: "Tobacco town under the Marko's Towers rock spires." },
        ],
      },
    ],
  },
  {
    slug: "british-isles",
    label: "British Isles",
    blurb: "Pub-lined lanes, storied universities, and windswept coastlines.",
    countries: [
      {
        name: "United Kingdom",
        cities: [
          { name: "London", blurb: "Tower of London, West End, and riverside South Bank." },
          { name: "Edinburgh", blurb: "Royal Mile between volcanic castle and Holyrood Palace." },
          { name: "Bath", blurb: "Georgian crescents and Roman thermal bathing complex." },
          { name: "York", blurb: "Medieval walled city with the Gothic Minster." },
          { name: "Oxford", blurb: "Honey-stoned colleges and Radcliffe Camera library." },
          { name: "Cambridge", blurb: "Punting on the Cam behind King's College Chapel." },
          { name: "Glasgow", blurb: "Mackintosh School of Art and a riverside Riverside Museum." },
        ],
      },
      {
        name: "Ireland",
        cities: [
          { name: "Dublin", blurb: "Trinity's Book of Kells and Georgian doors on Merrion Square." },
          { name: "Galway", blurb: "Pubs, trad sessions, and a gateway to Connemara." },
          { name: "Cork", blurb: "English Market and the Blarney Stone up the road." },
          { name: "Kilkenny", blurb: "Medieval Norman castle above the river Nore." },
          { name: "Killarney", blurb: "Lake-and-mountain base for the Ring of Kerry drive." },
        ],
      },
      {
        name: "Scotland",
        cities: [
          { name: "Inverness", blurb: "Gateway to Loch Ness and the Highlands." },
          { name: "Stirling", blurb: "Wallace Monument above a strategic castle rock." },
          { name: "St Andrews", blurb: "Golf's ancient Old Course and ruined seaside cathedral." },
          { name: "Aberdeen", blurb: "Silver granite city on the rugged North Sea coast." },
        ],
      },
      {
        name: "Wales",
        cities: [
          { name: "Cardiff", blurb: "Victorian arcades and a Gothic-revival Cardiff Castle." },
          { name: "Swansea", blurb: "Dylan Thomas harbor and Gower peninsula beaches." },
          { name: "Conwy", blurb: "Walled town beneath a massive Edwardian castle." },
          { name: "Caernarfon", blurb: "Polygonal-tower castle on the Menai Strait." },
        ],
      },
    ],
  },
  {
    slug: "southeast-asia",
    label: "Southeast Asia",
    blurb: "Temple complexes, night markets, and tropical archipelagos.",
    countries: [
      {
        name: "Thailand",
        cities: [
          { name: "Bangkok", blurb: "Grand Palace, klong canals, and street-food sois." },
          { name: "Chiang Mai", blurb: "Old city wats ringed by a square moat." },
          { name: "Ayutthaya", blurb: "Ruined former capital of prang-topped stupas." },
          { name: "Krabi", blurb: "Limestone karsts over emerald Andaman beaches." },
          { name: "Sukhothai", blurb: "Graceful 13th-century Buddha fields of the first kingdom." },
        ],
      },
      {
        name: "Vietnam",
        cities: [
          { name: "Hanoi", blurb: "36-streets Old Quarter and Hoàn Kiếm Lake." },
          { name: "Ho Chi Minh City", blurb: "Colonial-era cafés beside frantic Ben Thanh market." },
          { name: "Hội An", blurb: "Lantern-lit riverside town of tailors and merchants." },
          { name: "Huế", blurb: "Walled Nguyễn citadel on the Perfume River." },
          { name: "Đà Nẵng", blurb: "Dragon Bridge between beaches and Marble Mountains." },
        ],
      },
      {
        name: "Indonesia",
        cities: [
          { name: "Ubud", blurb: "Bali's artsy hill town among rice terraces." },
          { name: "Yogyakarta", blurb: "Gateway to Borobudur and a living sultan's kraton." },
          { name: "Jakarta", blurb: "Old Batavia colonial square and Kota Tua museums." },
          { name: "Bandung", blurb: "Cool-highland Art Deco capital of West Java." },
          { name: "Seminyak", blurb: "Bali's sunset-bar and surf-break beach strip." },
        ],
      },
      {
        name: "Cambodia",
        cities: [
          { name: "Siem Reap", blurb: "Base for exploring the Angkor temple complex." },
          { name: "Phnom Penh", blurb: "Silver Pagoda royal palace on the Tonlé Sap confluence." },
          { name: "Battambang", blurb: "French-era shophouses and a countryside bamboo train." },
          { name: "Kampot", blurb: "Sleepy pepper-country river town on the south coast." },
        ],
      },
      {
        name: "Malaysia",
        cities: [
          { name: "Kuala Lumpur", blurb: "Petronas Towers above colonial Merdeka Square." },
          { name: "George Town", blurb: "Penang's shophouses, street art, and hawker food." },
          { name: "Malacca", blurb: "Portuguese, Dutch, and Peranakan layered port town." },
          { name: "Kota Kinabalu", blurb: "Borneo base for Mount Kinabalu climbs and island hops." },
        ],
      },
      {
        name: "Philippines",
        cities: [
          { name: "Manila", blurb: "Spanish Intramuros walls and a buzzing Makati skyline." },
          { name: "Cebu City", blurb: "Magellan's Cross and jumping-off for Bohol and Mactan." },
          { name: "Vigan", blurb: "Cobblestoned Spanish-colonial mestizo quarter on Luzon." },
          { name: "Puerto Princesa", blurb: "Gateway to the UNESCO subterranean Palawan river." },
        ],
      },
    ],
  },
  {
    slug: "east-asia",
    label: "East Asia",
    blurb: "Megacities, imperial palaces, and mountain monasteries.",
    countries: [
      {
        name: "Japan",
        cities: [
          { name: "Tokyo", blurb: "Shibuya scramble, Shinjuku lanes, and Asakusa temples." },
          { name: "Kyoto", blurb: "Thousand-torii Fushimi Inari and Higashiyama machiya." },
          { name: "Osaka", blurb: "Dōtonbori neon and castle-park cherry blossoms." },
          { name: "Hiroshima", blurb: "Peace Memorial Park and nearby Miyajima torii island." },
          { name: "Nara", blurb: "Great Buddha of Tōdai-ji and free-roaming deer." },
          { name: "Kanazawa", blurb: "Kenroku-en garden and preserved geisha Higashi Chaya." },
        ],
      },
      {
        name: "South Korea",
        cities: [
          { name: "Seoul", blurb: "Gyeongbokgung palace and Bukchon hanok alleys." },
          { name: "Busan", blurb: "Haeundae beach and cliffside Gamcheon culture village." },
          { name: "Gyeongju", blurb: "Silla tumuli and the Seokguram grotto Buddha." },
          { name: "Jeonju", blurb: "Hanok village and birthplace of bibimbap." },
          { name: "Incheon", blurb: "Chinatown and the Songdo waterfront skyline." },
        ],
      },
      {
        name: "China",
        cities: [
          { name: "Beijing", blurb: "Forbidden City, Tiananmen, and Great Wall day trips." },
          { name: "Shanghai", blurb: "Bund colonial waterfront facing Pudong skyscrapers." },
          { name: "Xi'an", blurb: "Walled city beside the Terracotta Army." },
          { name: "Chengdu", blurb: "Panda base and Sichuan hotpot teahouses." },
          { name: "Guilin", blurb: "Karst peaks along the Li River cruise route." },
          { name: "Hangzhou", blurb: "West Lake causeways and Longjing tea hills." },
        ],
      },
      {
        name: "Taiwan",
        cities: [
          { name: "Taipei", blurb: "Taipei 101 tower and Shilin night-market snacks." },
          { name: "Tainan", blurb: "Island's oldest city of temples and Dutch forts." },
          { name: "Kaohsiung", blurb: "Harbor metropolis with a Love River promenade." },
          { name: "Hualien", blurb: "Gateway to Taroko Gorge's marble canyon." },
          { name: "Jiufen", blurb: "Mountain tea-house town of lanterns over the sea." },
        ],
      },
      {
        name: "Mongolia",
        cities: [
          { name: "Ulaanbaatar", blurb: "Ger-fringed capital with Gandan monastery." },
          { name: "Kharkhorin", blurb: "Ruined 13th-century capital of Genghis Khan's empire." },
          { name: "Erdenet", blurb: "Northern copper-mining town near Bürengiin Nuruu." },
          { name: "Khovd", blurb: "Kazakh-majority trade hub in the western Altai." },
        ],
      },
    ],
  },
  {
    slug: "south-asia",
    label: "South Asia",
    blurb: "Mughal monuments, temple cities, and Himalayan trailheads.",
    countries: [
      {
        name: "India",
        cities: [
          { name: "Delhi", blurb: "Mughal Red Fort and the Lutyens-designed capital." },
          { name: "Agra", blurb: "Marble Taj Mahal rising above the Yamuna riverbank." },
          { name: "Jaipur", blurb: "Pink-washed walled city of palaces and bazaars." },
          { name: "Varanasi", blurb: "Ghat-lined pilgrim city on the Ganges." },
          { name: "Udaipur", blurb: "Lake Palace city of marble havelis and arched bridges." },
          { name: "Mumbai", blurb: "Gateway of India arch and Bandra seafront promenades." },
          { name: "Kochi", blurb: "Chinese fishing nets and Jewish-quarter spice warehouses." },
        ],
      },
      {
        name: "Nepal",
        cities: [
          { name: "Kathmandu", blurb: "Durbar Square pagodas and Swayambhunath stupa." },
          { name: "Pokhara", blurb: "Phewa Lake town beneath the Annapurna massif." },
          { name: "Bhaktapur", blurb: "Medieval Newari town of carved windows and potteries." },
          { name: "Lumbini", blurb: "Sacred birthplace of the Buddha with monastic zone." },
          { name: "Patan", blurb: "Royal square of Newari temples just south of Kathmandu." },
        ],
      },
      {
        name: "Sri Lanka",
        cities: [
          { name: "Colombo", blurb: "Seaside capital of colonial forts and Pettah markets." },
          { name: "Kandy", blurb: "Hill-country Temple of the Tooth beside a lake." },
          { name: "Galle", blurb: "Dutch-walled fort on the tropical south coast." },
          { name: "Sigiriya", blurb: "Frescoed rock fortress rising from dry-zone forest." },
          { name: "Ella", blurb: "Tea-country viewpoint reached by a famous train ride." },
        ],
      },
      {
        name: "Bhutan",
        cities: [
          { name: "Thimphu", blurb: "Traffic-light-free capital with a towering golden Buddha." },
          { name: "Paro", blurb: "Valley of dzongs and Tiger's Nest cliff monastery." },
          { name: "Punakha", blurb: "Dzong at the junction of the mother-and-father rivers." },
          { name: "Bumthang", blurb: "Spiritual heartland of central Bhutanese valleys." },
        ],
      },
      {
        name: "Maldives",
        cities: [
          { name: "Malé", blurb: "Dense capital island with a coral-block Friday mosque." },
          { name: "Hulhumalé", blurb: "Reclaimed neighbor island of planned beachfront blocks." },
          { name: "Addu City", blurb: "Southern atoll of linked islands and WWII relics." },
          { name: "Fuvahmulah", blurb: "Single-island city known for tiger-shark diving." },
        ],
      },
    ],
  },
  {
    slug: "central-asia",
    label: "Central Asia",
    blurb: "Silk Road oasis cities, turquoise madrasas, and vast steppe horizons.",
    countries: [
      {
        name: "Uzbekistan",
        cities: [
          { name: "Samarkand", blurb: "Registan square of tile-blazed Timurid madrasas." },
          { name: "Bukhara", blurb: "Ark fortress and Kalyan minaret on the Silk Road." },
          { name: "Khiva", blurb: "Walled Itchan Kala of slave-market minarets." },
          { name: "Tashkent", blurb: "Soviet-modern capital with a chandeliered metro." },
          { name: "Shakhrisabz", blurb: "Timur's birthplace and ruined Ak-Saray palace gate." },
        ],
      },
      {
        name: "Kazakhstan",
        cities: [
          { name: "Almaty", blurb: "Leafy former capital beneath the Tian Shan peaks." },
          { name: "Astana", blurb: "Futurist steppe capital of Norman Foster showpieces." },
          { name: "Shymkent", blurb: "Southern bazaar city near Turkestan's Yasawi mausoleum." },
          { name: "Turkestan", blurb: "Pilgrim city around the monumental Yasawi tomb." },
        ],
      },
      {
        name: "Kyrgyzstan",
        cities: [
          { name: "Bishkek", blurb: "Soviet-grid capital of leafy squares and bazaars." },
          { name: "Osh", blurb: "Ancient Ferghana Valley city below Solomon's Throne hill." },
          { name: "Karakol", blurb: "Wooden Orthodox church and Issyk-Kul trek base." },
          { name: "Cholpon-Ata", blurb: "Issyk-Kul beach town with petroglyph field." },
        ],
      },
      {
        name: "Tajikistan",
        cities: [
          { name: "Dushanbe", blurb: "Grand Rudaki Avenue and one of the world's tallest flagpoles." },
          { name: "Khujand", blurb: "Fergana-edge city of an Alexander-era fortress." },
          { name: "Khorog", blurb: "Pamir gateway town in the high Gorno-Badakhshan." },
          { name: "Penjikent", blurb: "Excavated Sogdian ruins above a Zeravshan oasis." },
        ],
      },
      {
        name: "Turkmenistan",
        cities: [
          { name: "Ashgabat", blurb: "White-marble capital lined with golden statues." },
          { name: "Mary", blurb: "Base for the Silk Road ruins of Merv." },
          { name: "Türkmenbaşy", blurb: "Caspian port city under arid coastal cliffs." },
          { name: "Daşoguz", blurb: "Khwarezm-region trade city near Konye-Urgench ruins." },
        ],
      },
    ],
  },
  {
    slug: "middle-east",
    label: "Middle East",
    blurb: "Ancient bazaars, desert citadels, and modern Gulf skylines.",
    countries: [
      {
        name: "Turkey",
        cities: [
          { name: "Istanbul", blurb: "Hagia Sophia and Grand Bazaar straddling the Bosphorus." },
          { name: "Cappadocia", blurb: "Hot-air balloons over fairy-chimney tuff valleys." },
          { name: "Antalya", blurb: "Roman harbor and Hadrian's Gate on the Turquoise Coast." },
          { name: "Ephesus", blurb: "Ruined Library of Celsus in a Roman provincial capital." },
          { name: "Bursa", blurb: "Ottoman first capital below Mount Uludağ." },
        ],
      },
      {
        name: "Jordan",
        cities: [
          { name: "Amman", blurb: "Downtown Roman theater below a hilltop citadel." },
          { name: "Petra", blurb: "Nabataean rock-cut Treasury at the end of a narrow siq." },
          { name: "Wadi Rum", blurb: "Red-sand desert of Lawrence-of-Arabia sandstone arches." },
          { name: "Aqaba", blurb: "Red Sea coral-reef town at the kingdom's only port." },
          { name: "Jerash", blurb: "Best-preserved Roman provincial city in the Near East." },
        ],
      },
      {
        name: "Israel",
        cities: [
          { name: "Jerusalem", blurb: "Walled old city sacred to three Abrahamic faiths." },
          { name: "Tel Aviv", blurb: "Bauhaus White City on a Mediterranean beach strip." },
          { name: "Haifa", blurb: "Bahá'í terraced gardens cascading down Mount Carmel." },
          { name: "Nazareth", blurb: "Basilica of the Annunciation in Jesus's hometown." },
          { name: "Eilat", blurb: "Red Sea diving resort at the south tip of the Negev." },
        ],
      },
      {
        name: "United Arab Emirates",
        cities: [
          { name: "Dubai", blurb: "Burj Khalifa tower above sprawling malls and dune dunes." },
          { name: "Abu Dhabi", blurb: "Sheikh Zayed Grand Mosque and Louvre Abu Dhabi." },
          { name: "Sharjah", blurb: "Cultural-capital emirate of museums and a heritage souk." },
          { name: "Al Ain", blurb: "Oasis city of falaj channels and a Bronze-Age tomb field." },
        ],
      },
      {
        name: "Oman",
        cities: [
          { name: "Muscat", blurb: "Whitewashed capital tucked between jagged volcanic hills." },
          { name: "Nizwa", blurb: "Historic interior town of falaj and a round-tower fort." },
          { name: "Salalah", blurb: "Monsoon-green Dhofari port of frankincense country." },
          { name: "Sur", blurb: "Dhow-building village on a blue-lagoon cove." },
        ],
      },
      {
        name: "Lebanon",
        cities: [
          { name: "Beirut", blurb: "Corniche promenade and a rebuilt downtown Nejmeh Square." },
          { name: "Byblos", blurb: "Continuously inhabited port with a crusader castle." },
          { name: "Baalbek", blurb: "Monumental Roman temples of Jupiter and Bacchus." },
          { name: "Tripoli", blurb: "Mamluk-era souks and a seaside crusader fortress." },
        ],
      },
    ],
  },
  {
    slug: "north-africa",
    label: "North Africa",
    blurb: "Medinas, Saharan dunes, and Pharaonic temples along the Nile.",
    countries: [
      {
        name: "Morocco",
        cities: [
          { name: "Marrakech", blurb: "Jemaa el-Fnaa square and the walls of the Medina." },
          { name: "Fes", blurb: "Labyrinthine tanneries in the world's largest car-free medina." },
          { name: "Chefchaouen", blurb: "Rif-mountain town washed in shades of blue." },
          { name: "Casablanca", blurb: "Ocean-facing Hassan II Mosque and Art Deco downtown." },
          { name: "Essaouira", blurb: "Windy Atlantic ramparts and a Gnawa-music fishing port." },
        ],
      },
      {
        name: "Egypt",
        cities: [
          { name: "Cairo", blurb: "Khan el-Khalili bazaar below the Giza pyramids." },
          { name: "Luxor", blurb: "Karnak temple and Valley of the Kings tombs." },
          { name: "Aswan", blurb: "Felucca sails around Nile-island Nubian villages." },
          { name: "Alexandria", blurb: "Mediterranean corniche and the Bibliotheca Alexandrina." },
          { name: "Sharm El Sheikh", blurb: "Red Sea reef-diving resort on the Sinai peninsula." },
        ],
      },
      {
        name: "Tunisia",
        cities: [
          { name: "Tunis", blurb: "Medina souks beside the ancient ruins of Carthage." },
          { name: "Sidi Bou Said", blurb: "Blue-and-white cliff village above the Gulf of Tunis." },
          { name: "Kairouan", blurb: "Holy city with a 9th-century Great Mosque." },
          { name: "Sousse", blurb: "Ribat-fortress medina beside long Mediterranean beaches." },
          { name: "Douz", blurb: "Saharan gateway for camel-caravan trips into the Grand Erg." },
        ],
      },
      {
        name: "Algeria",
        cities: [
          { name: "Algiers", blurb: "Hilltop Casbah above French colonial boulevards." },
          { name: "Oran", blurb: "Mediterranean port and birthplace of rai music." },
          { name: "Constantine", blurb: "Bridged city spanning a dramatic Rhumel-river gorge." },
          { name: "Ghardaïa", blurb: "Pentapolis of Mzab valley of cube-and-dome houses." },
        ],
      },
    ],
  },
  {
    slug: "east-africa",
    label: "East Africa",
    blurb: "Safari plains, Rift Valley lakes, and Indian Ocean trade ports.",
    countries: [
      {
        name: "Kenya",
        cities: [
          { name: "Nairobi", blurb: "Urban safari capital bordering a national park." },
          { name: "Mombasa", blurb: "Swahili coast port with Portuguese-era Fort Jesus." },
          { name: "Malindi", blurb: "Beach town near Gede ruins and coral reefs." },
          { name: "Lamu", blurb: "Car-free Swahili island of coral-rag alleys and dhows." },
          { name: "Nakuru", blurb: "Rift Valley town by pink-flamingo soda lakes." },
        ],
      },
      {
        name: "Tanzania",
        cities: [
          { name: "Dar es Salaam", blurb: "Indian Ocean trade city and Zanzibar ferry hub." },
          { name: "Stone Town", blurb: "Zanzibar's UNESCO medina of carved doors and markets." },
          { name: "Arusha", blurb: "Northern safari base near Kilimanjaro and the Ngorongoro." },
          { name: "Dodoma", blurb: "Central plateau capital ringed by vineyards and granite kopjes." },
          { name: "Moshi", blurb: "Coffee-country town under the snow dome of Kilimanjaro." },
        ],
      },
      {
        name: "Ethiopia",
        cities: [
          { name: "Addis Ababa", blurb: "Merkato and the National Museum's Lucy fossil." },
          { name: "Lalibela", blurb: "Twelve rock-hewn monolithic churches in the highlands." },
          { name: "Gondar", blurb: "Walled royal compound of 17th-century castles." },
          { name: "Axum", blurb: "Ancient stelae field of the kingdom of Aksum." },
          { name: "Harar", blurb: "Walled Muslim trading city of 82 mosques." },
        ],
      },
      {
        name: "Uganda",
        cities: [
          { name: "Kampala", blurb: "Seven-hills capital near Lake Victoria." },
          { name: "Entebbe", blurb: "Lakeside botanical-garden town with the main airport." },
          { name: "Jinja", blurb: "White-water rafting at the source of the Nile." },
          { name: "Fort Portal", blurb: "Crater-lake base for Rwenzori treks and chimpanzees." },
        ],
      },
      {
        name: "Rwanda",
        cities: [
          { name: "Kigali", blurb: "Ridge-top capital with the Genocide Memorial Centre." },
          { name: "Musanze", blurb: "Base for Virunga mountain-gorilla trekking permits." },
          { name: "Gisenyi", blurb: "Lake Kivu beach town across from Goma." },
          { name: "Huye", blurb: "University town with the Ethnographic Museum." },
        ],
      },
    ],
  },
  {
    slug: "southern-africa",
    label: "Southern Africa",
    blurb: "Cape vineyards, game-rich parks, and Zambezi-river thunder.",
    countries: [
      {
        name: "South Africa",
        cities: [
          { name: "Cape Town", blurb: "Table Mountain above the Bo-Kaap pastel quarter." },
          { name: "Johannesburg", blurb: "Apartheid Museum and Soweto heritage tours." },
          { name: "Durban", blurb: "Golden Mile beachfront and fragrant Indian-spice market." },
          { name: "Stellenbosch", blurb: "Cape Dutch wine town under oak-lined streets." },
          { name: "Port Elizabeth", blurb: "Sunshine-coast gateway to Addo Elephant Park." },
          { name: "Knysna", blurb: "Garden Route lagoon town between two sandstone heads." },
        ],
      },
      {
        name: "Namibia",
        cities: [
          { name: "Windhoek", blurb: "German-colonial capital under the Eros mountains." },
          { name: "Swakopmund", blurb: "Atlantic dune-coast town of half-timbered bakeries." },
          { name: "Walvis Bay", blurb: "Flamingo lagoon beside the Namib's highest dunes." },
          { name: "Lüderitz", blurb: "Art-Nouveau diamond-rush town by ghost-town Kolmanskop." },
        ],
      },
      {
        name: "Botswana",
        cities: [
          { name: "Gaborone", blurb: "Modern capital near the Kgale Hill viewpoint." },
          { name: "Maun", blurb: "Gateway for mokoro trips into the Okavango Delta." },
          { name: "Kasane", blurb: "Chobe-riverfront town of elephant herds at dusk." },
          { name: "Francistown", blurb: "Old mining town near the Tuli Block bush reserves." },
        ],
      },
      {
        name: "Zimbabwe",
        cities: [
          { name: "Victoria Falls", blurb: "Mosi-oa-Tunya thundering spray on the Zambezi." },
          { name: "Harare", blurb: "Jacaranda-lined capital of galleries and craft markets." },
          { name: "Bulawayo", blurb: "Colonial-era grid near Matobo granite hills and rock art." },
          { name: "Mutare", blurb: "Border town below the green Eastern Highlands." },
        ],
      },
      {
        name: "Mozambique",
        cities: [
          { name: "Maputo", blurb: "Portuguese-era capital of Art Deco along the bay." },
          { name: "Tofo", blurb: "Whale-shark beach base on the Inhambane coast." },
          { name: "Ilha de Moçambique", blurb: "UNESCO stone-and-reed trading island of the north." },
          { name: "Pemba", blurb: "Mafia-archipelago port with some of Africa's finest reefs." },
        ],
      },
    ],
  },
  {
    slug: "west-africa",
    label: "West Africa",
    blurb: "Coastal slave-trade forts, griot music, and Sahel mud-brick mosques.",
    countries: [
      {
        name: "Senegal",
        cities: [
          { name: "Dakar", blurb: "Atlantic capital on a cape opposite Gorée Island." },
          { name: "Saint-Louis", blurb: "Colonial island city at the mouth of the Senegal River." },
          { name: "Thiès", blurb: "Craft-town tapestry workshops east of Dakar." },
          { name: "Ziguinchor", blurb: "Casamance-region river port of palm-shaded boulevards." },
        ],
      },
      {
        name: "Ghana",
        cities: [
          { name: "Accra", blurb: "Makola market and the Nkrumah memorial capital." },
          { name: "Cape Coast", blurb: "Whitewashed Atlantic slave-trade fortress of cold dungeons." },
          { name: "Kumasi", blurb: "Ashanti royal seat with the Manhyia Palace museum." },
          { name: "Elmina", blurb: "Portuguese-built São Jorge castle on a fishing harbor." },
        ],
      },
      {
        name: "Nigeria",
        cities: [
          { name: "Lagos", blurb: "Sprawling Atlantic megacity of beaches and Afrobeats clubs." },
          { name: "Abuja", blurb: "Purpose-built capital under the monolithic Aso Rock." },
          { name: "Ibadan", blurb: "Ancient Yoruba city of rust-roofed brown-tin houses." },
          { name: "Calabar", blurb: "Cross River port known for its yearly carnival." },
        ],
      },
      {
        name: "Mali",
        cities: [
          { name: "Bamako", blurb: "Niger-river capital of live kora and desert blues." },
          { name: "Timbuktu", blurb: "Sahel scholarly city of mud-brick Djinguereber mosque." },
          { name: "Djenné", blurb: "Monday market beside the largest mud-brick building on earth." },
          { name: "Ségou", blurb: "Niger-banks pottery town of annual arts festival." },
        ],
      },
      {
        name: "Côte d'Ivoire",
        cities: [
          { name: "Abidjan", blurb: "Lagoon skyline and a buzzing Plateau business district." },
          { name: "Yamoussoukro", blurb: "Planned capital of the vast Basilica of Our Lady of Peace." },
          { name: "Grand-Bassam", blurb: "Former colonial capital of pastel seaside houses." },
          { name: "Man", blurb: "Western mountain town near liana bridges and waterfalls." },
        ],
      },
    ],
  },
  {
    slug: "north-america",
    label: "North America",
    blurb: "Glacier parks, jazz cities, and Pacific-to-Atlantic megalopolis culture.",
    countries: [
      {
        name: "United States",
        cities: [
          { name: "New York", blurb: "Central Park, Broadway, and five-borough neighborhoods." },
          { name: "San Francisco", blurb: "Cable cars under the orange Golden Gate Bridge." },
          { name: "New Orleans", blurb: "French Quarter jazz and Creole Garden District mansions." },
          { name: "Chicago", blurb: "Art Institute lions and the Willis Tower skyline." },
          { name: "Los Angeles", blurb: "Hollywood Hills sign and Venice Boardwalk sunsets." },
          { name: "Washington", blurb: "Mall monuments and the Smithsonian museum complex." },
          { name: "Seattle", blurb: "Pike Place Market under the Space Needle spire." },
          { name: "Boston", blurb: "Freedom Trail through America's colonial birthplace." },
        ],
      },
      {
        name: "Canada",
        cities: [
          { name: "Toronto", blurb: "CN Tower above a multicultural neighborhood patchwork." },
          { name: "Montreal", blurb: "Cobbled Vieux-Port and Mile End bagel-and-bistro scene." },
          { name: "Vancouver", blurb: "Stanley Park seawall between ocean and North Shore peaks." },
          { name: "Quebec City", blurb: "Walled old town of Château Frontenac above the St. Lawrence." },
          { name: "Ottawa", blurb: "Gothic-revival Parliament Hill on the Rideau Canal." },
          { name: "Banff", blurb: "Turquoise-lake mountain town in the Canadian Rockies." },
        ],
      },
      {
        name: "Mexico",
        cities: [
          { name: "Mexico City", blurb: "Zócalo cathedral above Aztec Templo Mayor ruins." },
          { name: "Oaxaca", blurb: "Colonial green-stone city of mezcal and Monte Albán ruins." },
          { name: "Guanajuato", blurb: "Silver-mining town of tunnels and callejones." },
          { name: "Mérida", blurb: "White Yucatán capital near Mayan pyramid sites." },
          { name: "San Miguel de Allende", blurb: "Pink-spired parroquia on a colonial hilltop." },
          { name: "Puebla", blurb: "Talavera-tiled churches and the original chile-en-nogada." },
        ],
      },
    ],
  },
  {
    slug: "central-america-and-caribbean",
    label: "Central America & Caribbean",
    blurb: "Maya ruins, cloud forests, and turquoise Caribbean reef coasts.",
    countries: [
      {
        name: "Costa Rica",
        cities: [
          { name: "San José", blurb: "National Theatre and pre-Columbian gold museum capital." },
          { name: "La Fortuna", blurb: "Hot-spring base town beneath Arenal Volcano." },
          { name: "Monteverde", blurb: "Mist-shrouded cloud-forest canopy walkways." },
          { name: "Tamarindo", blurb: "Pacific surf town on the Nicoya Peninsula." },
          { name: "Puerto Viejo", blurb: "Afro-Caribbean beach village on the Talamanca coast." },
        ],
      },
      {
        name: "Guatemala",
        cities: [
          { name: "Antigua", blurb: "Cobblestoned colonial town ringed by three volcanoes." },
          { name: "Guatemala City", blurb: "Sprawling capital of Mayan-textile markets and ruins." },
          { name: "Flores", blurb: "Tiny island town base for Tikal's jungle pyramids." },
          { name: "Panajachel", blurb: "Lake Atitlán town under three volcanic cones." },
          { name: "Quetzaltenango", blurb: "Highland Xela city of K'iche' markets and hot springs." },
        ],
      },
      {
        name: "Panama",
        cities: [
          { name: "Panama City", blurb: "Skyscraper skyline across from Casco Viejo old quarter." },
          { name: "Bocas del Town", blurb: "Caribbean stilt-houses gateway to Bocas del Toro reefs." },
          { name: "Boquete", blurb: "Highland coffee town near Barú Volcano cloud forests." },
          { name: "Colón", blurb: "Atlantic-side port at the northern end of the Panama Canal." },
        ],
      },
      {
        name: "Cuba",
        cities: [
          { name: "Havana", blurb: "Vintage-car Malecón sea wall and baroque old plazas." },
          { name: "Trinidad", blurb: "Preserved sugar-era colonial town of pastel one-story houses." },
          { name: "Viñales", blurb: "Mogote-karst tobacco valley of ox-plowed red-earth fields." },
          { name: "Santiago de Cuba", blurb: "Eastern capital of Afro-Cuban son music and a hill fort." },
          { name: "Cienfuegos", blurb: "French-founded bay city with a neoclassical Tomás Terry theater." },
        ],
      },
      {
        name: "Dominican Republic",
        cities: [
          { name: "Santo Domingo", blurb: "Oldest European colonial city in the Americas." },
          { name: "Punta Cana", blurb: "Palm-lined turquoise beaches on the east coast." },
          { name: "Puerto Plata", blurb: "Amber-museum port town below Mount Isabel de Torres." },
          { name: "Santiago", blurb: "Cibao-valley cultural capital of cigars and merengue." },
        ],
      },
      {
        name: "Belize",
        cities: [
          { name: "Belize City", blurb: "Colonial-era port and jumping-off for the Barrier Reef." },
          { name: "San Ignacio", blurb: "Cayo-district base for Mayan ATM cave tours." },
          { name: "Caye Caulker", blurb: "Sand-street Caribbean island of go-slow reef life." },
          { name: "San Pedro", blurb: "Ambergris Caye town beside the Blue Hole dive site." },
        ],
      },
    ],
  },
  {
    slug: "south-america",
    label: "South America",
    blurb: "Andes highlands, Amazon headwaters, and Atlantic-coast samba cities.",
    countries: [
      {
        name: "Peru",
        cities: [
          { name: "Cusco", blurb: "Inca navel-of-the-world on Spanish-built plazas." },
          { name: "Lima", blurb: "Cliff-edge Miraflores district above a Pacific surf break." },
          { name: "Arequipa", blurb: "White-volcanic-stone cathedral on Plaza de Armas." },
          { name: "Puno", blurb: "Lake Titicaca altiplano port for floating-reed islands." },
          { name: "Trujillo", blurb: "North-coast city near Chan Chan adobe ruins." },
        ],
      },
      {
        name: "Argentina",
        cities: [
          { name: "Buenos Aires", blurb: "Tango bars, Recoleta tombs, and wide Porteño boulevards." },
          { name: "Mendoza", blurb: "Malbec vineyards in the Andean foothills." },
          { name: "Bariloche", blurb: "Swiss-chalet lake town in the Argentine Patagonia." },
          { name: "Córdoba", blurb: "Jesuit-block university city in the central sierras." },
          { name: "Ushuaia", blurb: "Self-titled end of the world port for Antarctic cruises." },
        ],
      },
      {
        name: "Brazil",
        cities: [
          { name: "Rio de Janeiro", blurb: "Sugarloaf, Christ the Redeemer, and Copacabana beach." },
          { name: "São Paulo", blurb: "Paulista Avenue megacity of museums and restaurants." },
          { name: "Salvador", blurb: "Pelourinho's Afro-Brazilian pastel-colored baroque upper town." },
          { name: "Florianópolis", blurb: "Island capital of southern surf beaches and lagoons." },
          { name: "Manaus", blurb: "Belle-époque opera house deep in the Amazon basin." },
        ],
      },
      {
        name: "Chile",
        cities: [
          { name: "Santiago", blurb: "Andean-backdrop capital of historic Lastarria and Bellavista." },
          { name: "Valparaíso", blurb: "Funicular-connected mural hills above a Pacific harbor." },
          { name: "San Pedro de Atacama", blurb: "Adobe village base for salt flats and geyser fields." },
          { name: "Puerto Varas", blurb: "German-heritage lake town under the Osorno volcano." },
          { name: "Punta Arenas", blurb: "Strait of Magellan city and Torres del Paine gateway." },
        ],
      },
      {
        name: "Colombia",
        cities: [
          { name: "Bogotá", blurb: "Gold Museum and La Candelaria Andean old quarter." },
          { name: "Cartagena", blurb: "Walled Caribbean old town of bougainvillea balconies." },
          { name: "Medellín", blurb: "Aburrá-valley city of Metrocable gondolas and comuna murals." },
          { name: "Cali", blurb: "Capital of salsa clubs in the Cauca valley." },
          { name: "Santa Marta", blurb: "Caribbean port near the Lost City Tayrona trek." },
        ],
      },
      {
        name: "Ecuador",
        cities: [
          { name: "Quito", blurb: "UNESCO colonial old town at 2,850 meters." },
          { name: "Cuenca", blurb: "Four-rivers highland city of Panama-hat workshops." },
          { name: "Guayaquil", blurb: "Pacific coast port with a Malecón 2000 riverwalk." },
          { name: "Baños", blurb: "Waterfall-filled thermal-springs town under Tungurahua volcano." },
          { name: "Otavalo", blurb: "Andean indigenous-market town of woven textiles." },
        ],
      },
    ],
  },
  {
    slug: "oceania-pacific",
    label: "Oceania / Pacific",
    blurb: "Coral atolls, red-rock outback, and harbor-city sailing capitals.",
    countries: [
      {
        name: "Australia",
        cities: [
          { name: "Sydney", blurb: "Harbor Bridge and Opera House white-shell sails." },
          { name: "Melbourne", blurb: "Laneway coffee and the MCG sports-stadium city." },
          { name: "Brisbane", blurb: "Subtropical South Bank parklands on a winding river." },
          { name: "Perth", blurb: "Indian Ocean capital beside Kings Park bushland." },
          { name: "Cairns", blurb: "Great Barrier Reef and Daintree rainforest gateway." },
          { name: "Hobart", blurb: "Tasmanian sandstone port beneath Mount Wellington." },
        ],
      },
      {
        name: "New Zealand",
        cities: [
          { name: "Auckland", blurb: "Volcano-studded isthmus city between two harbors." },
          { name: "Wellington", blurb: "Windy cable-car capital with Te Papa national museum." },
          { name: "Queenstown", blurb: "Adventure-sport town on alpine Lake Wakatipu." },
          { name: "Christchurch", blurb: "Canterbury plains garden city of tram-lined streets." },
          { name: "Rotorua", blurb: "Geothermal Maori cultural town of geysers and marae." },
        ],
      },
      {
        name: "Fiji",
        cities: [
          { name: "Suva", blurb: "Lush-hilled capital on the southeast of Viti Levu." },
          { name: "Nadi", blurb: "International-airport gateway to the Mamanuca islands." },
          { name: "Lautoka", blurb: "Sugar City port on Viti Levu's west coast." },
          { name: "Savusavu", blurb: "Hidden-bay town of hot springs on Vanua Levu." },
        ],
      },
      {
        name: "French Polynesia",
        cities: [
          { name: "Papeete", blurb: "Tahitian capital with a waterfront Le Marché market." },
          { name: "Bora Bora", blurb: "Overwater-bungalow lagoon under Mount Otemanu." },
          { name: "Moorea", blurb: "Heart-shaped volcanic island with Opunohu Bay." },
          { name: "Huahine", blurb: "Quiet twin-island paradise of archaeological marae sites." },
        ],
      },
      {
        name: "Papua New Guinea",
        cities: [
          { name: "Port Moresby", blurb: "National Museum and Bomana WWII cemetery capital." },
          { name: "Lae", blurb: "Morobe port at the start of the Highlands Highway." },
          { name: "Mount Hagen", blurb: "Highland-province town famous for its cultural sing-sing." },
          { name: "Madang", blurb: "Island-dotted harbor town on the Bismarck Sea." },
        ],
      },
    ],
  },
  {
    slug: "russia-and-caucasus",
    label: "Russia & Caucasus",
    blurb: "Onion-dome cathedrals, Soviet metros, and mountain wine cultures.",
    countries: [
      {
        name: "Russia",
        cities: [
          { name: "Moscow", blurb: "Kremlin towers and GUM arcade on Red Square." },
          { name: "Saint Petersburg", blurb: "Hermitage palace on a Baltic network of canals." },
          { name: "Kazan", blurb: "Tatar capital with a white-walled Kremlin mosque." },
          { name: "Vladivostok", blurb: "Pacific end of the Trans-Siberian Railway." },
          { name: "Suzdal", blurb: "Golden Ring town of wooden izbas and monasteries." },
        ],
      },
      {
        name: "Georgia",
        cities: [
          { name: "Tbilisi", blurb: "Sulfur-bath old town under the Narikala fortress." },
          { name: "Batumi", blurb: "Black Sea boulevard of neon subtropical skyscrapers." },
          { name: "Mtskheta", blurb: "Ancient royal capital at the confluence of two rivers." },
          { name: "Kutaisi", blurb: "Gateway to Gelati monastery and the Imereti vineyards." },
          { name: "Sighnaghi", blurb: "Walled Kakheti wine town overlooking the Alazani valley." },
        ],
      },
      {
        name: "Armenia",
        cities: [
          { name: "Yerevan", blurb: "Pink-tuff Republic Square under the dome of Ararat." },
          { name: "Gyumri", blurb: "Earthquake-rebuilt arts city of black-tuff mansions." },
          { name: "Dilijan", blurb: "Forested spa town of wooden-balcony Old Dilijan street." },
          { name: "Vanadzor", blurb: "Lori-valley industrial town ringed by pine hills." },
        ],
      },
      {
        name: "Azerbaijan",
        cities: [
          { name: "Baku", blurb: "Walled Icherisheher beside three Flame-Tower skyscrapers." },
          { name: "Sheki", blurb: "Silk-road town of Khan's Palace stained-glass shebeke." },
          { name: "Ganja", blurb: "Poet Nizami's mausoleum city in the western lowlands." },
          { name: "Quba", blurb: "Apple-orchard town near the Jewish mountain village of Krasnaya Sloboda." },
        ],
      },
    ],
  },
];

export function getRegionBySlug(slug: string): CatalogRegion | undefined {
  return REGION_CATALOG.find((region) => region.slug === slug);
}

export function getRegionByLabel(label: string): CatalogRegion | undefined {
  return REGION_CATALOG.find((region) => region.label === label);
}

export function allCitiesInRegions(labels: string[]): CatalogCity[] {
  const seen = new Set<string>();
  const result: CatalogCity[] = [];
  for (const label of labels) {
    const region = getRegionByLabel(label);
    if (!region) continue;
    for (const country of region.countries) {
      for (const city of country.cities) {
        if (seen.has(city.name)) continue;
        seen.add(city.name);
        result.push(city);
      }
    }
  }
  return result;
}
