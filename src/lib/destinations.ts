/**
 * Destinations data layer.
 *
 * Source of truth for all programmatic destination & itinerary pages.
 * Each entry is hand-curated with real, well-known places to avoid the
 * "thin AI content" trap that gets programmatic SEO sites penalized.
 *
 * To add a new destination: append to DESTINATIONS, run `next build`, and
 * the sitemap + static params will pick it up automatically.
 */

export type DestinationRegion =
  | "Europe"
  | "Asia"
  | "Americas"
  | "Africa"
  | "Oceania"
  | "Middle East";

export type ExperienceType =
  | "landmark"
  | "food"
  | "culture"
  | "nature"
  | "nightlife"
  | "shopping"
  | "neighborhood";

export type Destination = {
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  region: DestinationRegion;
  latitude: number;
  longitude: number;
  currency: string;
  language: string;
  timezone: string;
  bestMonths: string[];
  bestTimeBlurb: string;
  avgDailyBudgetUSD: { budget: number; mid: number; luxury: number };
  heroBlurb: string;
  longDescription: string;
  neighborhoods: { name: string; description: string }[];
  experiences: {
    name: string;
    description: string;
    type: ExperienceType;
  }[];
  faqs: { question: string; answer: string }[];
  themes: string[];
  gradient: [string, string]; // hero gradient (tailwind-friendly)
};

export const TRIP_LENGTHS = [2, 3, 4, 5, 7, 10] as const;
export type TripLength = (typeof TRIP_LENGTHS)[number];

export const DESTINATIONS: Destination[] = [
  // ============================================================
  // EUROPE
  // ============================================================
  {
    slug: "paris",
    name: "Paris",
    country: "France",
    countryCode: "FR",
    region: "Europe",
    latitude: 48.8566,
    longitude: 2.3522,
    currency: "EUR",
    language: "French",
    timezone: "Europe/Paris",
    bestMonths: ["April", "May", "June", "September", "October"],
    bestTimeBlurb:
      "Late spring and early autumn deliver Paris at its most romantic — café terraces are full, the Seine sparkles, and you avoid both the August exodus and winter drizzle.",
    avgDailyBudgetUSD: { budget: 90, mid: 220, luxury: 600 },
    heroBlurb:
      "The City of Light is a moveable feast of Haussmann boulevards, world-class museums, and effortless café culture.",
    longDescription:
      "Paris rewards both first-time visitors checking off the Eiffel Tower and the Louvre, and repeat travelers who come back for the small things — a buttery croissant in the 11th, a quiet hour at the Musée Rodin, the way the light hits Sacré-Cœur at sunset. The city is compact, walkable, and built for wandering. Twenty distinct arrondissements spiral outward from the Île de la Cité, and each has its own personality, from the bohemian charm of Montmartre to the polished elegance of Saint-Germain-des-Prés.",
    neighborhoods: [
      {
        name: "Le Marais",
        description:
          "Cobblestoned, queer-friendly, packed with vintage boutiques, falafel windows, and the Picasso Museum. The Place des Vosges anchors it.",
      },
      {
        name: "Saint-Germain-des-Prés",
        description:
          "Left Bank intellectual heartland — Café de Flore, Les Deux Magots, antique galleries, and the tree-lined Boulevard Saint-Germain.",
      },
      {
        name: "Montmartre",
        description:
          "Hilltop village vibe topped by Sacré-Cœur. Touristy on the main square but still magical on the back streets at dawn.",
      },
      {
        name: "Canal Saint-Martin",
        description:
          "10th arrondissement hangout for the cool kids. Iron footbridges, picnics on the canal banks, and natural-wine bars.",
      },
      {
        name: "Latin Quarter",
        description:
          "Sorbonne students, narrow medieval streets, the Panthéon, and Shakespeare and Company bookshop facing Notre-Dame.",
      },
    ],
    experiences: [
      {
        name: "Louvre Museum",
        description:
          "The world's most-visited museum. Book a timed entry, beeline for the Mona Lisa early, then lose yourself in the Egyptian wing.",
        type: "culture",
      },
      {
        name: "Eiffel Tower",
        description:
          "Yes, it's worth it. Best photographed from Trocadéro across the river, best experienced at the hour-on-the-hour sparkle after sunset.",
        type: "landmark",
      },
      {
        name: "Musée d'Orsay",
        description:
          "Impressionist heaven inside a converted Belle Époque train station. Smaller and more digestible than the Louvre.",
        type: "culture",
      },
      {
        name: "Sainte-Chapelle",
        description:
          "A 13th-century jewel box of stained glass tucked inside the Palais de Justice. Go on a sunny morning.",
        type: "landmark",
      },
      {
        name: "Marché des Enfants Rouges",
        description:
          "Paris's oldest covered market in the Marais. Moroccan tagines, fresh oysters, and natural wine on tap.",
        type: "food",
      },
      {
        name: "Père Lachaise Cemetery",
        description:
          "Atmospheric, leafy, and home to Jim Morrison, Oscar Wilde, Édith Piaf, and Chopin.",
        type: "culture",
      },
      {
        name: "Versailles",
        description:
          "A 30-minute RER ride out of the city. Pre-book the palace and bring a picnic for the gardens.",
        type: "landmark",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Paris?",
        answer:
          "Three days is the minimum to hit the highlights without rushing. Five days lets you mix in day trips like Versailles or Giverny and explore neighborhoods at a leisurely pace. A week is ideal for a first-time visit.",
      },
      {
        question: "Is Paris expensive?",
        answer:
          "Paris is mid-to-high cost. Budget travelers can manage on $90/day with hostels and bakery meals; mid-range travelers should plan $200–250/day for a comfortable hotel and two restaurant meals.",
      },
      {
        question: "Do I need to speak French in Paris?",
        answer:
          "No, but learning 'bonjour' and 'merci' goes a long way. Most service workers in tourist areas speak passable English and are far friendlier when you start in French, even badly.",
      },
      {
        question: "What's the best way to get around Paris?",
        answer:
          "The Métro is fast, cheap, and reaches everywhere. Buy a Navigo Easy card for stored-value rides, or a Paris Visite pass if you'll ride more than five times a day.",
      },
      {
        question: "When should I avoid visiting Paris?",
        answer:
          "August: many local restaurants close as Parisians flee for vacation, and the city can feel empty in a sad way. November and February are also quiet but cold and gray.",
      },
    ],
    themes: ["art", "food", "romance", "architecture", "fashion"],
    gradient: ["#D4734A", "#7D3218"],
  },

  {
    slug: "rome",
    name: "Rome",
    country: "Italy",
    countryCode: "IT",
    region: "Europe",
    latitude: 41.9028,
    longitude: 12.4964,
    currency: "EUR",
    language: "Italian",
    timezone: "Europe/Rome",
    bestMonths: ["April", "May", "September", "October"],
    bestTimeBlurb:
      "Shoulder-season Rome means warm days, long evenings outside, and crowds that haven't yet swallowed the Trevi Fountain whole. Avoid August: the heat is brutal and many trattorias close.",
    avgDailyBudgetUSD: { budget: 80, mid: 180, luxury: 500 },
    heroBlurb:
      "Three thousand years of history layered over each other — and the best carbonara on Earth at the bottom of it all.",
    longDescription:
      "Rome is unlike any other European capital because the past doesn't sit politely behind glass — it interrupts your walk to dinner. A 2,000-year-old aqueduct cuts across a residential street; a Bernini fountain marks the corner of an unassuming square. Spend your mornings hitting the headline ruins, your afternoons wandering Trastevere or Monti, and your evenings doing what Romans do: a long, loud meal that ends with a digestivo and a slow walk home.",
    neighborhoods: [
      {
        name: "Trastevere",
        description:
          "Ivy-draped, cobblestoned, and alive at night. The neighborhood Romans bring their dates to. Eat at Da Enzo (book ahead).",
      },
      {
        name: "Monti",
        description:
          "Boho-chic district between the Colosseum and Termini. Vintage shops, aperitivo bars, the perfect base for first-timers.",
      },
      {
        name: "Centro Storico",
        description:
          "The historic core: Pantheon, Piazza Navona, Campo de' Fiori. Touristy but unmissable.",
      },
      {
        name: "Testaccio",
        description:
          "Working-class neighborhood with Rome's best food market and the city's most serious Roman cuisine.",
      },
      {
        name: "Prati",
        description:
          "Quieter, residential, walking distance to the Vatican. Stay here if you want a calmer base.",
      },
    ],
    experiences: [
      {
        name: "Colosseum & Roman Forum",
        description:
          "The 2,000-year-old beating heart of ancient Rome. Book a guided tour with arena floor access — the difference is night and day.",
        type: "landmark",
      },
      {
        name: "Vatican Museums & Sistine Chapel",
        description:
          "Reserve the earliest possible entry slot. The Sistine Chapel is the climax — don't power-walk to it.",
        type: "culture",
      },
      {
        name: "Pantheon",
        description:
          "The best-preserved building from antiquity, free to enter, with an oculus that still drops rain straight onto the marble floor.",
        type: "landmark",
      },
      {
        name: "Borghese Gallery",
        description:
          "Bernini's marble that looks like silk. Tickets sell out a week in advance — book early.",
        type: "culture",
      },
      {
        name: "Trevi Fountain at dawn",
        description:
          "Go before 8am to actually see the marble. By 10am it's a wall of phones.",
        type: "landmark",
      },
      {
        name: "Cacio e pepe in Trastevere",
        description:
          "The city's signature pasta — pecorino, black pepper, hot pasta water. Da Enzo, Tonnarello, or Felice a Testaccio do it best.",
        type: "food",
      },
      {
        name: "Appian Way bike ride",
        description:
          "Rent a bike at Caffè dell'Appia Antica and cycle the original Roman road past tombs, catacombs, and umbrella pines.",
        type: "nature",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Rome?",
        answer:
          "Three full days covers the highlights: ancient Rome, Vatican, and the historic center. Five days lets you slow down, eat better, and add day trips like Tivoli or Ostia Antica.",
      },
      {
        question: "Is Rome safe?",
        answer:
          "Yes, but pickpockets work the metro Line A and the area around the Colosseum and Termini station hard. Wear your bag in front and keep your phone off restaurant tables.",
      },
      {
        question: "Do I need to book the Colosseum in advance?",
        answer:
          "Absolutely. Same-day tickets are nearly impossible in season. Book on the official CoopCulture site at least a week ahead — and pay extra for arena floor access if available.",
      },
      {
        question: "What should I avoid eating in Rome?",
        answer:
          "Skip restaurants with multilingual menus and waiters waving you in — those are tourist traps. Look for crowds of locals, handwritten daily menus, and a coperto (cover charge) on the bill.",
      },
      {
        question: "Can you drink the tap water in Rome?",
        answer:
          "Yes, and you should. The nasoni (cast-iron public fountains) all over the city dispense free, cold, drinkable water from the Roman aqueducts.",
      },
    ],
    themes: ["history", "food", "art", "architecture"],
    gradient: ["#C4522A", "#7D3218"],
  },

  {
    slug: "barcelona",
    name: "Barcelona",
    country: "Spain",
    countryCode: "ES",
    region: "Europe",
    latitude: 41.3851,
    longitude: 2.1734,
    currency: "EUR",
    language: "Catalan & Spanish",
    timezone: "Europe/Madrid",
    bestMonths: ["May", "June", "September", "October"],
    bestTimeBlurb:
      "May and September are Barcelona's sweet spot — Mediterranean warmth without August's wall-to-wall crowds and sky-high prices.",
    avgDailyBudgetUSD: { budget: 75, mid: 170, luxury: 450 },
    heroBlurb:
      "Gaudí's surreal architecture, a 4km city beach, and tapas bars that don't fill until midnight.",
    longDescription:
      "Barcelona is the rare city that delivers culture, beach, food, and nightlife inside the same 30-minute walk. Gaudí's Sagrada Família and Park Güell define its modernist skyline; the Gothic Quarter winds through 1,000-year-old alleys; the beach at Barceloneta is genuinely swimmable. The Catalan capital eats late, parties later, and treats lunch like a religious ceremony — embrace the rhythm.",
    neighborhoods: [
      {
        name: "Gothic Quarter (Barri Gòtic)",
        description:
          "Medieval maze of stone alleys, tucked-away squares, and the Cathedral. Touristy but irresistibly atmospheric.",
      },
      {
        name: "El Born",
        description:
          "Hipper neighbor to the Gothic Quarter. Picasso Museum, cocktail bars, the Santa Maria del Mar basilica, and the city's best concept stores.",
      },
      {
        name: "Eixample",
        description:
          "Grid of grand 19th-century blocks that hosts most of Gaudí's masterpieces. Stay here for easy walking access to everything.",
      },
      {
        name: "Gràcia",
        description:
          "Bohemian, leafy, residential. Plaça del Sol fills with locals on warm evenings. Park Güell sits on its northern edge.",
      },
      {
        name: "Barceloneta",
        description:
          "The beach neighborhood. Old fisherman's tenements, paella restaurants, and the Mediterranean two minutes from the metro.",
      },
    ],
    experiences: [
      {
        name: "Sagrada Família",
        description:
          "Gaudí's still-unfinished basilica. Book the timed entry with tower access — the stained-glass interior at midday is unforgettable.",
        type: "landmark",
      },
      {
        name: "Park Güell",
        description:
          "Mosaic-covered terraces and gingerbread gatehouses. Buy timed tickets in advance to enter the monumental zone.",
        type: "landmark",
      },
      {
        name: "Casa Batlló & La Pedrera",
        description:
          "Two more Gaudí houses on Passeig de Gràcia. Casa Batlló's interactive tour is worth the splurge.",
        type: "landmark",
      },
      {
        name: "Mercat de la Boqueria",
        description:
          "Off La Rambla, cathedral-like food market. Skip the Instagram juices at the front and head deep for jamón, oysters, and tapas counters.",
        type: "food",
      },
      {
        name: "Picasso Museum",
        description:
          "Five medieval mansions strung together to house the world's best collection of Picasso's early work.",
        type: "culture",
      },
      {
        name: "Bunkers del Carmel",
        description:
          "Free hilltop viewpoint with the best panorama of the city. Bring a picnic and time it for sunset.",
        type: "nature",
      },
      {
        name: "Tapas crawl in El Born",
        description:
          "Hop between Cal Pep, El Xampanyet, and Bormuth. Stand at the bar, order vermut, and graze.",
        type: "food",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Barcelona?",
        answer:
          "Four days is ideal — two for Gaudí and the historic core, one for the beach and Barceloneta, and one for Montjuïc or a day trip to Montserrat.",
      },
      {
        question: "Is Barcelona safe?",
        answer:
          "Generally yes, but pickpocketing is among the worst in Europe. The metro, La Rambla, and crowded beaches are hotspots. Carry only what you need.",
      },
      {
        question: "What's the deal with Catalan vs Spanish?",
        answer:
          "Both are official. Signs are usually in Catalan first, Spanish second. Locals appreciate Catalan greetings ('hola', 'bon dia') but every server speaks Spanish too.",
      },
      {
        question: "When does Barcelona eat?",
        answer:
          "Late. Lunch starts at 2pm; dinner rarely before 9pm. Restaurants that seat tourists at 7pm are usually mediocre — wait until 9 and eat where the locals do.",
      },
      {
        question: "Do I need to book Sagrada Família?",
        answer:
          "Yes, and book early. Same-day tickets often sell out. Reserve directly on sagradafamilia.org at least a week in advance, two in summer.",
      },
    ],
    themes: ["architecture", "beach", "food", "nightlife"],
    gradient: ["#D4734A", "#C4522A"],
  },

  {
    slug: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    countryCode: "PT",
    region: "Europe",
    latitude: 38.7223,
    longitude: -9.1393,
    currency: "EUR",
    language: "Portuguese",
    timezone: "Europe/Lisbon",
    bestMonths: ["April", "May", "June", "September", "October"],
    bestTimeBlurb:
      "Lisbon's mild Atlantic climate makes shoulder seasons spectacular: warm enough for Sintra, cool enough to walk the seven hills without melting.",
    avgDailyBudgetUSD: { budget: 65, mid: 140, luxury: 380 },
    heroBlurb:
      "Pastel-tiled hills, melancholy fado, perfect custard tarts, and the cheapest great food in Western Europe.",
    longDescription:
      "Lisbon has been rediscovered in the last decade and has every right to be — it's stunningly beautiful, refreshingly affordable by Western European standards, and packs more atmosphere per square mile than capitals twice its size. The city sprawls across seven hills overlooking the Tagus, with yellow trams clattering up impossible inclines, miradouros (viewpoints) at every turn, and a food scene that punches absurdly above its weight.",
    neighborhoods: [
      {
        name: "Alfama",
        description:
          "Lisbon's oldest neighborhood — a labyrinth of medieval lanes, fado houses, and laundry strung between balconies. Tram 28 runs through it.",
      },
      {
        name: "Bairro Alto & Chiado",
        description:
          "Upper town. Chic shopping by day, raucous bar-hopping at night. Stay here if you want walkable access to everything.",
      },
      {
        name: "Príncipe Real",
        description:
          "The city's coolest neighborhood. Concept stores, garden cafés, and Lisbon's queer nightlife center.",
      },
      {
        name: "LX Factory",
        description:
          "Converted industrial complex under the 25 de Abril Bridge. Bookshops, restaurants, street art, Sunday market.",
      },
      {
        name: "Belém",
        description:
          "Riverside district with Lisbon's most important monuments — and the original Pastéis de Belém bakery.",
      },
    ],
    experiences: [
      {
        name: "Tram 28",
        description:
          "The iconic yellow tram route through Alfama, Graça, and Estrela. Board early at Martim Moniz to actually get a seat.",
        type: "landmark",
      },
      {
        name: "Jerónimos Monastery",
        description:
          "Manueline-Gothic masterpiece in Belém. Buy combined tickets with the Tower of Belém to skip the line.",
        type: "landmark",
      },
      {
        name: "Pastéis de Belém",
        description:
          "The original 1837 recipe pastel de nata, served warm with cinnamon and powdered sugar. Skip the indoor line and grab from the takeaway counter.",
        type: "food",
      },
      {
        name: "Time Out Market",
        description:
          "Curated food hall in Mercado da Ribeira showcasing the city's best chefs in one space. Great for a low-stakes tasting tour.",
        type: "food",
      },
      {
        name: "Castelo de São Jorge",
        description:
          "Hilltop Moorish castle with the city's best panorama. Time your visit for golden hour.",
        type: "landmark",
      },
      {
        name: "Day trip to Sintra",
        description:
          "Forty-minute train ride to a mountain town of fairytale palaces. Book Pena Palace tickets in advance and start with Quinta da Regaleira to beat the crowds.",
        type: "nature",
      },
      {
        name: "Fado night in Alfama",
        description:
          "Portugal's mournful national music. Tasca do Chico and Mesa de Frades are atmospheric, intimate venues.",
        type: "culture",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Lisbon?",
        answer:
          "Three days for the city itself, plus one or two extra for day trips to Sintra and Cascais. Five days total is the sweet spot.",
      },
      {
        question: "Is Lisbon walkable?",
        answer:
          "Yes, but be ready for the hills — they're real, and the iconic limestone calçada cobblestones get slippery in rain. Bring grippy shoes.",
      },
      {
        question: "Is Lisbon cheap?",
        answer:
          "Compared to Paris, London, or Amsterdam — yes. A great dinner with wine runs $30-40 per person; a strong coffee costs $1.50. Hotels have crept up but are still reasonable.",
      },
      {
        question: "Do I need a car?",
        answer:
          "No. The metro, trams, and buses cover the city, and trains reach Sintra, Cascais, and Belém in under 40 minutes.",
      },
      {
        question: "When does Lisbon get crowded?",
        answer:
          "July-August are peak. April, May, September, and October offer better weather without the bus-tour crush.",
      },
    ],
    themes: ["food", "architecture", "music", "viewpoints"],
    gradient: ["#F5D5A8", "#D4734A"],
  },

  {
    slug: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    countryCode: "NL",
    region: "Europe",
    latitude: 52.3676,
    longitude: 4.9041,
    currency: "EUR",
    language: "Dutch",
    timezone: "Europe/Amsterdam",
    bestMonths: ["April", "May", "June", "September"],
    bestTimeBlurb:
      "Spring brings tulip season at nearby Keukenhof; early autumn delivers warm canals without the summer bachelor-party density.",
    avgDailyBudgetUSD: { budget: 95, mid: 210, luxury: 520 },
    heroBlurb:
      "A 17th-century canal city built for bicycles, with world-class museums tucked behind every other gabled facade.",
    longDescription:
      "Amsterdam packs more into its compact center than any other European capital — Rembrandts and Van Goghs, canal-side cafés, Jordaan side-streets, and a bicycle-first urban design that makes every other city feel slightly dysfunctional by comparison. Skip the things you've been told to skip (the Red Light District at midnight, the coffee shops on Damstraat) and focus on what makes the city actually great: the museums, the canals, the brown cafés, and the weird joy of pedaling everywhere.",
    neighborhoods: [
      {
        name: "Jordaan",
        description:
          "The most charming district — narrow canals, indie galleries, the Anne Frank House, Saturday morning organic market at Noordermarkt.",
      },
      {
        name: "De Pijp",
        description:
          "Foodie central south of the museums. Albert Cuyp Market, ethnic restaurants, neighborhood vibe.",
      },
      {
        name: "Museum Quarter",
        description:
          "Home to the Rijksmuseum, Van Gogh Museum, and Stedelijk. Stay here if museums are your priority.",
      },
      {
        name: "Oost (East)",
        description:
          "Up-and-coming, multicultural, with the Tropenmuseum and Oosterpark. Less touristy.",
      },
      {
        name: "Noord",
        description:
          "Across the IJ on a free ferry. Industrial-cool with the EYE film museum and street-art hangars.",
      },
    ],
    experiences: [
      {
        name: "Rijksmuseum",
        description:
          "Holds Vermeer's Milkmaid, Rembrandt's Night Watch, and 800 years of Dutch art. Plan three hours minimum.",
        type: "culture",
      },
      {
        name: "Van Gogh Museum",
        description:
          "The world's largest Van Gogh collection in chronological order. Book a timed entry online — walk-ups are routinely turned away.",
        type: "culture",
      },
      {
        name: "Anne Frank House",
        description:
          "Tickets are released exactly six weeks in advance and sell out within minutes. Set a calendar reminder.",
        type: "culture",
      },
      {
        name: "Canal cruise at dusk",
        description:
          "Skip the giant glass boats. Book a small open electric boat through Those Dam Boat Guys or Sloep Huren.",
        type: "landmark",
      },
      {
        name: "Vondelpark",
        description:
          "Amsterdam's Central Park. Ride a bike loop, grab a beer at Het Blauwe Theehuis, watch the locals picnic.",
        type: "nature",
      },
      {
        name: "Foodhallen",
        description:
          "Indoor food market in a converted tram depot. Bitterballen, dim sum, craft beer all under one roof.",
        type: "food",
      },
    ],
    faqs: [
      {
        question: "Should I rent a bike in Amsterdam?",
        answer:
          "Yes — but only if you're confident in traffic. The bike infrastructure is excellent, but the locals ride fast and have zero patience for hesitating tourists. Stick to your lane and signal.",
      },
      {
        question: "How many days do you need in Amsterdam?",
        answer:
          "Three days hits the major museums and key neighborhoods comfortably. Add a day for a trip to Zaanse Schans, Haarlem, or Utrecht.",
      },
      {
        question: "Is Amsterdam safe at night?",
        answer:
          "Very. Even the Red Light District is more annoying than dangerous. Watch for bikes when you cross any street and you'll be fine.",
      },
      {
        question: "Do I need cash in Amsterdam?",
        answer:
          "No — most places are card-only and many won't even accept Mastercard (Maestro is king). Bring a debit card with a chip.",
      },
      {
        question: "When are the tulips in bloom?",
        answer:
          "Mid-April to early May at Keukenhof, the famous tulip garden 30 minutes from Amsterdam. Book the shuttle bus + entry combo in advance.",
      },
    ],
    themes: ["art", "canals", "cycling", "museums"],
    gradient: ["#7FA384", "#425744"],
  },

  {
    slug: "london",
    name: "London",
    country: "United Kingdom",
    countryCode: "GB",
    region: "Europe",
    latitude: 51.5074,
    longitude: -0.1278,
    currency: "GBP",
    language: "English",
    timezone: "Europe/London",
    bestMonths: ["May", "June", "July", "September"],
    bestTimeBlurb:
      "London is at its best from late spring through early autumn, when parks are full, beer gardens overflow, and you actually get evening daylight.",
    avgDailyBudgetUSD: { budget: 110, mid: 260, luxury: 700 },
    heroBlurb:
      "A global city of staggering scale where ancient royal pageantry coexists with the world's best theater, food, and nightlife.",
    longDescription:
      "London is enormous, layered, and impossible to fully see — which is why it rewards repeat visits. First-timers should focus on the high-density historic core (Westminster, the City, the South Bank) and one or two of the markets and museums. Don't try to do everything. The Underground will get you anywhere you need, the museums are mostly free, and the pubs are still the city's true social center.",
    neighborhoods: [
      {
        name: "Soho & Covent Garden",
        description:
          "Theater, restaurants, and the West End. Touristy but central and walkable to everywhere.",
      },
      {
        name: "Shoreditch",
        description:
          "East London's creative hub — street art, vintage markets, and the city's best Sunday brunch scene at Brick Lane.",
      },
      {
        name: "Notting Hill",
        description:
          "Pastel townhouses, Portobello Road antiques market, and the famous bookshop. Quieter than central London.",
      },
      {
        name: "South Bank",
        description:
          "Riverside walking strip from the London Eye to Tower Bridge. Tate Modern, Borough Market, and unbeatable views.",
      },
      {
        name: "Marylebone",
        description:
          "Polished, walkable, with great independent shops on Marylebone High Street and Regent's Park nearby.",
      },
    ],
    experiences: [
      {
        name: "British Museum",
        description:
          "Free entry to one of the world's great encyclopedic collections — the Rosetta Stone, Parthenon Marbles, and 8 million objects.",
        type: "culture",
      },
      {
        name: "Tower of London",
        description:
          "900-year-old fortress holding the Crown Jewels. Book the Yeoman Warder ('Beefeater') tour — they're hilarious.",
        type: "landmark",
      },
      {
        name: "Borough Market",
        description:
          "London's oldest food market by London Bridge. Go hungry on a Friday or Saturday and graze your way through.",
        type: "food",
      },
      {
        name: "West End theater",
        description:
          "Cheaper and often better than Broadway. Use TodayTix or the TKTS booth in Leicester Square for same-day discount tickets.",
        type: "culture",
      },
      {
        name: "Tate Modern",
        description:
          "Free contemporary art in a converted power station on the South Bank. The view from the top floor is one of London's best.",
        type: "culture",
      },
      {
        name: "Hampstead Heath",
        description:
          "800 acres of wild parkland in north London with one of the city's best skyline views from Parliament Hill.",
        type: "nature",
      },
      {
        name: "Sunday roast in a proper pub",
        description:
          "The Harwood Arms (Fulham), The Anchor & Hope (Waterloo), or any good gastropub. Book ahead.",
        type: "food",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in London?",
        answer:
          "Four days for first-timers — and you'll still leave wanting more. A week lets you actually slow down and explore beyond the headline attractions.",
      },
      {
        question: "Is London expensive?",
        answer:
          "Yes — among the most expensive cities in Europe for hotels and dining. Save money by eating at pubs and food markets, using contactless on the Tube, and visiting the (free) major museums.",
      },
      {
        question: "What's the best way to get around London?",
        answer:
          "Tap your contactless card or phone on the Underground, buses, and Overground. No need for an Oyster card anymore — daily caps apply automatically.",
      },
      {
        question: "When is the best time to visit London?",
        answer:
          "May, June, and September offer the best weather. Avoid August (peak tourist crush) and January-February (cold, dark, miserable).",
      },
      {
        question: "Do I need to book restaurants in London?",
        answer:
          "For anywhere good, yes — at least a few days ahead, sometimes weeks. ResDiary and OpenTable cover most.",
      },
    ],
    themes: ["history", "museums", "theater", "food"],
    gradient: ["#6B8F71", "#425744"],
  },

  {
    slug: "prague",
    name: "Prague",
    country: "Czech Republic",
    countryCode: "CZ",
    region: "Europe",
    latitude: 50.0755,
    longitude: 14.4378,
    currency: "CZK",
    language: "Czech",
    timezone: "Europe/Prague",
    bestMonths: ["April", "May", "September", "October"],
    bestTimeBlurb:
      "Spring and fall are gorgeous in Prague — cool enough for layers, warm enough for outdoor beer, and quieter than the summer crush.",
    avgDailyBudgetUSD: { budget: 55, mid: 130, luxury: 350 },
    heroBlurb:
      "A perfectly preserved medieval and Baroque fairy tale, with the world's best beer at $2 a pint.",
    longDescription:
      "Prague survived World War II largely unbombed, and it shows — the Old Town, Lesser Town, and Castle district form one of the most architecturally complete historic centers in Europe. It's also the birthplace of pilsner, has a thriving contemporary art scene, and remains genuinely affordable by Western European standards. Avoid Old Town Square at peak hours and head for Vinohrady or Žižkov for the city locals actually live in.",
    neighborhoods: [
      {
        name: "Staré Město (Old Town)",
        description:
          "The medieval heart with the Astronomical Clock, Charles Bridge, and the Old Town Square. Touristy but worth the time.",
      },
      {
        name: "Malá Strana (Lesser Town)",
        description:
          "Baroque palaces and gardens at the foot of the castle. Quieter than the Old Town, especially in the evenings.",
      },
      {
        name: "Vinohrady",
        description:
          "Leafy residential district with the city's best café culture, art nouveau apartments, and Náměstí Míru square.",
      },
      {
        name: "Žižkov",
        description:
          "Bohemian, gritty, full of dive bars and the famous TV Tower. Where actual Praguers drink.",
      },
      {
        name: "Holešovice",
        description:
          "Up-and-coming district north of the river with the National Gallery, DOX contemporary art center, and Letná Park's beer garden.",
      },
    ],
    experiences: [
      {
        name: "Prague Castle",
        description:
          "The largest ancient castle complex in the world. Buy ticket Circuit B for the highlights (St. Vitus, Old Royal Palace, Golden Lane).",
        type: "landmark",
      },
      {
        name: "Charles Bridge at sunrise",
        description:
          "The 14th-century stone bridge with 30 baroque saints. Go before 7am to actually experience it without the crowd.",
        type: "landmark",
      },
      {
        name: "Old Town Square",
        description:
          "The Astronomical Clock chimes every hour — underwhelming, but the square itself with the Týn Church is genuinely beautiful.",
        type: "landmark",
      },
      {
        name: "Letná Beer Garden",
        description:
          "Hilltop biergarten with sweeping views of the city's bridges. Order a half-liter of Pilsner Urquell and stay an afternoon.",
        type: "food",
      },
      {
        name: "U Fleků",
        description:
          "A 500-year-old beer hall brewing its own dark lager since 1499. Touristy but historic and the beer is fantastic.",
        type: "food",
      },
      {
        name: "Jewish Quarter (Josefov)",
        description:
          "Old-New Synagogue, the haunting Jewish Cemetery with stones piled six layers deep, and the Pinkas Synagogue memorial.",
        type: "culture",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Prague?",
        answer:
          "Three days is perfect — one for the castle and Lesser Town, one for the Old Town and Jewish Quarter, one for the local neighborhoods like Vinohrady.",
      },
      {
        question: "Is Prague cheap?",
        answer:
          "Yes by European standards — beer is $2-3, full restaurant meals run $10-15, and good hotels start around $80.",
      },
      {
        question: "Do they use the Euro in Prague?",
        answer:
          "No — Czech koruna (CZK). Some tourist spots accept Euros at terrible rates. Pay in CZK with a card or withdraw from a bank ATM (avoid the standalone yellow Euronet machines).",
      },
      {
        question: "Is Prague crowded?",
        answer:
          "The Old Town is mobbed midday in summer. Go early morning, late evening, or in shoulder season, and explore Vinohrady, Žižkov, and Holešovice for breathing room.",
      },
      {
        question: "Is Prague safe?",
        answer:
          "Very safe overall. The main risk is getting overcharged by dodgy taxis and tourist-trap currency exchanges. Use Bolt or Liftago instead of street taxis.",
      },
    ],
    themes: ["architecture", "beer", "history", "affordable"],
    gradient: ["#9BB59F", "#425744"],
  },

  {
    slug: "santorini",
    name: "Santorini",
    country: "Greece",
    countryCode: "GR",
    region: "Europe",
    latitude: 36.3932,
    longitude: 25.4615,
    currency: "EUR",
    language: "Greek",
    timezone: "Europe/Athens",
    bestMonths: ["May", "June", "September", "October"],
    bestTimeBlurb:
      "May, June, and September deliver Santorini at its most photogenic — warm seas, blooming bougainvillea, and crowds that haven't yet hit August's chaos.",
    avgDailyBudgetUSD: { budget: 100, mid: 280, luxury: 800 },
    heroBlurb:
      "The famous whitewashed cliffside village above an indigo caldera — earned every Instagram cliché.",
    longDescription:
      "Santorini is the half-collapsed rim of a volcanic caldera, with white Cycladic villages perched 300 meters above the water. The island is small enough to drive across in 30 minutes, with each side offering something different: Oia's sunset crowds in the northwest, Fira's nightlife at the center, the black-sand beaches of Perissa and Kamari to the southeast, and the ancient Akrotiri site at the southern tip. Stay on the caldera side at least one night for the view — it's the entire reason people come.",
    neighborhoods: [
      {
        name: "Oia",
        description:
          "The famous sunset village — most photogenic, most expensive, most crowded at dusk. Stay overnight to enjoy it before and after the day-trippers.",
      },
      {
        name: "Fira",
        description:
          "The capital, livelier than Oia, with restaurants, bars, the cable car down to the old port, and easier bus connections.",
      },
      {
        name: "Imerovigli",
        description:
          "Highest point on the caldera. Quieter than Fira and Oia, with arguably the best views and the famous Skaros Rock walk.",
      },
      {
        name: "Pyrgos",
        description:
          "Inland medieval village with traditional Cycladic architecture and a fraction of the crowds.",
      },
      {
        name: "Perissa & Kamari",
        description:
          "Black-sand beach towns on the east coast. More affordable, more relaxed, less iconic.",
      },
    ],
    experiences: [
      {
        name: "Oia sunset",
        description:
          "The view from the castle ruins is iconic for a reason. Arrive at least 90 minutes early to claim a spot.",
        type: "nature",
      },
      {
        name: "Caldera hike from Fira to Oia",
        description:
          "Three-hour cliffside walk with non-stop volcano views. Start early to avoid the heat and end with lunch in Oia.",
        type: "nature",
      },
      {
        name: "Akrotiri archaeological site",
        description:
          "The 'Greek Pompeii' — a Bronze Age city buried by the same eruption that formed the caldera. Remarkably preserved frescoes inside.",
        type: "culture",
      },
      {
        name: "Caldera sailing trip",
        description:
          "Half-day catamaran cruise stopping at the hot springs, Red Beach, and White Beach with onboard meal. Book sunset for the magic-hour return.",
        type: "nature",
      },
      {
        name: "Wine tasting at Santo Wines",
        description:
          "Volcanic-soil Assyrtiko wines on a cliff terrace overlooking the caldera. The flight-plus-platter combo is the move.",
        type: "food",
      },
      {
        name: "Red Beach",
        description:
          "Iron-rich red cliffs above a black volcanic shore. Dramatic, photogenic, and easily reached from Akrotiri.",
        type: "nature",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Santorini?",
        answer:
          "Three to four nights is ideal. Two is rushed; a week starts to feel slow unless you're island-hopping or honeymooning.",
      },
      {
        question: "Is Santorini overrated?",
        answer:
          "It can feel that way in August when 18,000 cruise passengers offload daily. Visit in May, June, late September, or October and stay overnight to see why it earned its reputation.",
      },
      {
        question: "Do I need a car in Santorini?",
        answer:
          "An ATV or small car helps if you want to explore beaches and inland villages. If you're staying in Oia or Fira and only need the highlights, the bus and walking work fine.",
      },
      {
        question: "What's the best month for Santorini?",
        answer:
          "Late May to early June, or September. Warm enough to swim, wild flowers everywhere, and the August chaos either hasn't started or has just ended.",
      },
      {
        question: "Where should I stay in Santorini?",
        answer:
          "At least one night on the caldera side (Oia, Imerovigli, or Fira) for the view. If budget is tight, base in Pyrgos or Megalochori inland.",
      },
    ],
    themes: ["beach", "romance", "viewpoints", "wine"],
    gradient: ["#7FA384", "#FDF6EC"],
  },

  // ============================================================
  // ASIA
  // ============================================================
  {
    slug: "tokyo",
    name: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    region: "Asia",
    latitude: 35.6762,
    longitude: 139.6503,
    currency: "JPY",
    language: "Japanese",
    timezone: "Asia/Tokyo",
    bestMonths: ["March", "April", "May", "October", "November"],
    bestTimeBlurb:
      "Late March to early April brings the cherry blossoms; November delivers koyo (autumn leaves) and crisp blue-sky days. Both are peak seasons — book far ahead.",
    avgDailyBudgetUSD: { budget: 90, mid: 200, luxury: 550 },
    heroBlurb:
      "The greatest city on Earth for food, design, and the small daily rituals that make a place feel civilized.",
    longDescription:
      "Tokyo is staggeringly large — 13 million people across 23 wards — but it doesn't feel chaotic. It feels meticulously organized. Crossing Shibuya at rush hour, eating tempura at a 100-year-old counter, riding the Yamanote line in silence — Tokyo is a city of small, perfect experiences. First-time visitors should base in Shinjuku or Shibuya for the convenience, build their days around two or three neighborhoods at a time, and trust that even the random side-street ramen shop will be excellent.",
    neighborhoods: [
      {
        name: "Shinjuku",
        description:
          "The ultimate Tokyo experience — neon canyons, Golden Gai's micro-bars, the Tokyo Metropolitan Government observation deck, and the world's busiest train station.",
      },
      {
        name: "Shibuya",
        description:
          "The famous scramble crossing, youth fashion, izakayas under the train tracks, and the Shibuya Sky observation deck.",
      },
      {
        name: "Harajuku & Aoyama",
        description:
          "Takeshita Street's kawaii fashion, Meiji Shrine's quiet forest, and the Omotesando shopping boulevard.",
      },
      {
        name: "Asakusa",
        description:
          "Old Tokyo with Senso-ji temple, traditional craft shops, and street food along Nakamise. Great for first impressions.",
      },
      {
        name: "Shimokitazawa",
        description:
          "Indie record shops, vintage stores, tiny live houses, and laid-back cafés. Tokyo's bohemian side.",
      },
      {
        name: "Yanaka",
        description:
          "One of the few neighborhoods that survived WWII intact. Wooden houses, cat-filled lanes, and old-school shotengai shopping streets.",
      },
    ],
    experiences: [
      {
        name: "Senso-ji Temple",
        description:
          "Tokyo's oldest temple, founded in 645. Walk up Nakamise-dori through the souvenir stalls and aim for an early morning visit.",
        type: "landmark",
      },
      {
        name: "Tsukiji Outer Market",
        description:
          "The wholesale tuna auction has moved to Toyosu, but Tsukiji's outer market remains a paradise of sushi breakfasts, fresh wasabi, and tamagoyaki on a stick.",
        type: "food",
      },
      {
        name: "TeamLab Planets",
        description:
          "Immersive digital art installation where you walk barefoot through water gardens. Book tickets weeks in advance.",
        type: "culture",
      },
      {
        name: "Shibuya Sky",
        description:
          "Open-air rooftop observation deck atop Shibuya Scramble Square. The best Tokyo view, especially at sunset.",
        type: "landmark",
      },
      {
        name: "Golden Gai",
        description:
          "Six narrow alleys of 200 micro-bars, each seating 5-8 people. Most charge a small cover. Pop into 2-3 over an evening.",
        type: "nightlife",
      },
      {
        name: "Sushi at a counter",
        description:
          "Splurge on omakase at a small counter — Sushi Saito or Sushi Yoshitake at the high end, Tsuta or Manten Sushi for accessible mid-range bookings.",
        type: "food",
      },
      {
        name: "Day trip to Hakone",
        description:
          "Two hours by train. Lake Ashi, Mount Fuji views (on a clear day), and traditional ryokan onsen baths.",
        type: "nature",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Tokyo?",
        answer:
          "Five days minimum for a first visit, and you'll still feel like you barely scratched the surface. Seven to ten days lets you mix in day trips to Kamakura, Nikko, or Hakone.",
      },
      {
        question: "Is Tokyo expensive?",
        answer:
          "Less than people expect. Hotels and trains are pricey, but a great ramen costs $9, convenience-store food is genuinely good, and most temples and shrines are free.",
      },
      {
        question: "Do I need to speak Japanese?",
        answer:
          "No, but Tokyo English fluency is lower than European capitals. Google Translate's camera mode handles menus, and most train signs include English.",
      },
      {
        question: "Should I get a JR Pass?",
        answer:
          "Only if you're combining Tokyo with Kyoto, Osaka, or Hiroshima. For Tokyo-only trips, the metro IC card (Suica or Pasmo) is all you need.",
      },
      {
        question: "When is cherry blossom season?",
        answer:
          "Typically March 25 – April 5 in central Tokyo, but it shifts by a week each year. Watch the Japan Meteorological Corporation forecast in February.",
      },
    ],
    themes: ["food", "culture", "shopping", "design", "nightlife"],
    gradient: ["#C4522A", "#1A1A1A"],
  },

  {
    slug: "kyoto",
    name: "Kyoto",
    country: "Japan",
    countryCode: "JP",
    region: "Asia",
    latitude: 35.0116,
    longitude: 135.7681,
    currency: "JPY",
    language: "Japanese",
    timezone: "Asia/Tokyo",
    bestMonths: ["March", "April", "May", "October", "November"],
    bestTimeBlurb:
      "Kyoto's two iconic seasons are sakura (late March to early April) and koyo, the autumn leaves (mid-November). Both are spectacular, both are crowded — book lodging months ahead.",
    avgDailyBudgetUSD: { budget: 85, mid: 210, luxury: 600 },
    heroBlurb:
      "Japan's old imperial capital — 1,600 temples, geisha districts, and the country's most refined kaiseki cooking.",
    longDescription:
      "If Tokyo is the future, Kyoto is the past you came to Japan looking for. The city was the imperial capital for over a thousand years and largely escaped WWII bombing, leaving a wealth of temples, gardens, traditional wooden machiya houses, and the only intact geisha districts. Slow down here. The point of Kyoto isn't to checklist temples — it's to drink matcha in a 400-year-old tea house, walk a moss garden in the rain, and let the city work on you.",
    neighborhoods: [
      {
        name: "Gion",
        description:
          "The famous geisha district. Wooden tea houses, lantern-lit alleys, and the chance to see a maiko hurrying to an appointment at dusk.",
      },
      {
        name: "Higashiyama",
        description:
          "The temple-rich eastern hills. Kiyomizu-dera, Yasaka Shrine, and the preserved Sannenzaka and Ninenzaka lanes.",
      },
      {
        name: "Arashiyama",
        description:
          "Western edge of the city with the famous bamboo grove, Tenryu-ji temple, and the Hozugawa river.",
      },
      {
        name: "Nishijin",
        description:
          "Quiet, traditional weaving district where many machiya houses survive. Stay in a kyo-machiya guesthouse here.",
      },
      {
        name: "Pontocho",
        description:
          "Narrow lantern-lit alley between the Kamo River and Kawaramachi. Lined with intimate restaurants — book ahead.",
      },
    ],
    experiences: [
      {
        name: "Fushimi Inari Shrine",
        description:
          "Ten thousand vermilion torii gates winding up Mt. Inari. Go at dawn or after 5pm to escape the crowds and get the corridor shot.",
        type: "landmark",
      },
      {
        name: "Kinkaku-ji (Golden Pavilion)",
        description:
          "The famous gold-leafed temple reflecting in its own pond. Crowded but quick — 30 minutes is enough.",
        type: "landmark",
      },
      {
        name: "Arashiyama Bamboo Grove",
        description:
          "Best at sunrise, before the tour buses. Pair with a visit to Tenryu-ji's gardens and lunch at a yudofu restaurant.",
        type: "nature",
      },
      {
        name: "Kiyomizu-dera",
        description:
          "Wooden stage temple with sweeping city views. The walk up through Sannenzaka is the experience.",
        type: "landmark",
      },
      {
        name: "Nishiki Market",
        description:
          "'Kyoto's kitchen' — five blocks of pickles, yuba (tofu skin), wagashi sweets, and grilled fish on a stick.",
        type: "food",
      },
      {
        name: "Kaiseki dinner",
        description:
          "Multi-course traditional cuisine — Kyoto is the world capital. Splurge once at Kikunoi, Hyotei, or a quality ryokan.",
        type: "food",
      },
      {
        name: "Philosopher's Path",
        description:
          "Two-kilometer canalside walk between Ginkaku-ji and Nanzen-ji. Sublime in cherry blossom season.",
        type: "nature",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Kyoto?",
        answer:
          "Three full days minimum for the highlights. Four or five if you want to slow down, take a day trip to Nara, and not feel like you're sprinting between temples.",
      },
      {
        question: "Should I do Tokyo or Kyoto first?",
        answer:
          "Tokyo first works well — you adjust to Japan in a high-energy city, then decompress in Kyoto. Bullet train between them is just over two hours.",
      },
      {
        question: "How do I see geisha in Kyoto?",
        answer:
          "Genuine geiko (Kyoto's term) appear briefly between appointments in Gion at dusk. Be respectful — no flash, no chasing, no touching. Better: book a traditional ozashiki dinner experience through your hotel.",
      },
      {
        question: "Is Kyoto walkable?",
        answer:
          "Parts are. Higashiyama and Gion are best on foot. For the western temples (Arashiyama, Kinkaku-ji), use the bus or rent a bike for the day.",
      },
      {
        question: "When is cherry blossom season in Kyoto?",
        answer:
          "Peak bloom is typically late March to early April, but varies by week. Check the JMC sakura forecast.",
      },
    ],
    themes: ["temples", "gardens", "food", "tradition"],
    gradient: ["#9BB59F", "#7D3218"],
  },

  {
    slug: "bangkok",
    name: "Bangkok",
    country: "Thailand",
    countryCode: "TH",
    region: "Asia",
    latitude: 13.7563,
    longitude: 100.5018,
    currency: "THB",
    language: "Thai",
    timezone: "Asia/Bangkok",
    bestMonths: ["November", "December", "January", "February"],
    bestTimeBlurb:
      "The cool dry season (November-February) is by far the most pleasant time. March-May is brutally hot; June-October is monsoon-prone but quieter and cheaper.",
    avgDailyBudgetUSD: { budget: 35, mid: 95, luxury: 280 },
    heroBlurb:
      "The world's best street-food city, layered with golden temples, riverside slums, gleaming skyscrapers, and chaotic charm.",
    longDescription:
      "Bangkok is overwhelming on first arrival and unforgettable a week later. The city refuses to be just one thing: ancient temples next to Hyatt bars, 50-baht noodle stalls beside Michelin-starred fine dining, traffic jams that have their own gravity. Lean in. Use the BTS Skytrain and the river boats to bypass the worst of the traffic, eat at the place with the most plastic stools, and accept that no itinerary survives Bangkok's beautiful chaos intact.",
    neighborhoods: [
      {
        name: "Sukhumvit",
        description:
          "Modern Bangkok — Skytrain access, international dining, rooftop bars, and the city's best mid-range hotels.",
      },
      {
        name: "Banglamphu & Khao San Road",
        description:
          "Old town backpacker district. Khao San itself is a clichéd party street, but the surrounding area has the city's best old temples.",
      },
      {
        name: "Chinatown (Yaowarat)",
        description:
          "After-dark street-food paradise. Come hungry around 7pm for grilled seafood, dim sum, and bird's nest soup.",
      },
      {
        name: "Thonburi (west bank)",
        description:
          "Quieter side of the river — canals (klongs), Wat Arun, and traditional neighborhoods accessible by ferry.",
      },
      {
        name: "Ari",
        description:
          "Trendy local neighborhood north of the center. Cafés, indie boutiques, and the city's cool kids — minimal tourists.",
      },
    ],
    experiences: [
      {
        name: "Grand Palace & Wat Phra Kaew",
        description:
          "The former royal residence and home of the Emerald Buddha. Dress code is strict (covered shoulders, long pants/skirts).",
        type: "landmark",
      },
      {
        name: "Wat Pho",
        description:
          "The 46-meter reclining Buddha and the country's oldest massage school. Cheap traditional Thai massage on-site.",
        type: "landmark",
      },
      {
        name: "Wat Arun at sunset",
        description:
          "The Temple of Dawn on the river — but actually best at golden hour from across the water. Catch the cross-river ferry.",
        type: "landmark",
      },
      {
        name: "Chatuchak Weekend Market",
        description:
          "15,000 stalls, 200,000 shoppers, and the country's best souvenir hunting. Saturdays and Sundays only.",
        type: "shopping",
      },
      {
        name: "Street food crawl in Chinatown",
        description:
          "Start at Texas Suki, hit Nai Mong Hoi Tod for oyster omelets, and end at T&K Seafood. Bring cash.",
        type: "food",
      },
      {
        name: "Long-tail boat through the klongs",
        description:
          "Ninety minutes on the canals of Thonburi gives you a glimpse of how Bangkok looked a century ago. Negotiate the fare upfront.",
        type: "nature",
      },
      {
        name: "Rooftop bar at sunset",
        description:
          "Vertigo at the Banyan Tree, Sky Bar at Lebua, or Octave at the Marriott. Dress code applies — no flip-flops.",
        type: "nightlife",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Bangkok?",
        answer:
          "Three days for first-time visitors covers the temples, Chinatown, and a market or two. Add a fourth day for a Khlong Lat Mayom or Damnoen Saduak day trip.",
      },
      {
        question: "Is Bangkok safe?",
        answer:
          "Yes, very. The main hazards are tuk-tuk and gem scams (anyone offering you a 'special tour' is running one), motorbike taxis in heavy traffic, and the heat.",
      },
      {
        question: "How do I get around Bangkok?",
        answer:
          "BTS Skytrain and MRT for most distances, river boats and ferries for the old city, Grab (Asia's Uber) for door-to-door. Avoid metered taxis at peak traffic — you'll regret it.",
      },
      {
        question: "Is it OK to eat the street food?",
        answer:
          "Absolutely — and you should. The famous stalls are cleaner than most sit-down restaurants. Look for high turnover and a queue of locals.",
      },
      {
        question: "Do I need to dress modestly in Bangkok?",
        answer:
          "Only at temples — covered shoulders and knees. Elsewhere the city is hot and people dress casually.",
      },
    ],
    themes: ["food", "temples", "shopping", "nightlife", "value"],
    gradient: ["#D4734A", "#C4522A"],
  },

  {
    slug: "bali",
    name: "Bali",
    country: "Indonesia",
    countryCode: "ID",
    region: "Asia",
    latitude: -8.3405,
    longitude: 115.092,
    currency: "IDR",
    language: "Indonesian & Balinese",
    timezone: "Asia/Makassar",
    bestMonths: ["April", "May", "June", "September", "October"],
    bestTimeBlurb:
      "Dry season (April-October) is the obvious win. The shoulder months of April-May and September-October are the sweet spot — dry, less crowded, and slightly cheaper than peak July-August.",
    avgDailyBudgetUSD: { budget: 40, mid: 110, luxury: 350 },
    heroBlurb:
      "Volcanic interior, surf beaches, ancient Hindu temples, and the world's best price-to-luxury ratio.",
    longDescription:
      "Bali has been overhyped, overbuilt in places, and is still genuinely magical if you know where to base yourself. Avoid Kuta entirely. The cultural and spiritual heart is Ubud, surrounded by jungle and rice terraces. The best beach scene is in Canggu (laid-back surfer-yoga vibe) or Seminyak (boutique, polished). For real tropical beauty, head to the Bukit Peninsula in the south or the quieter east coast around Amed and Sidemen.",
    neighborhoods: [
      {
        name: "Ubud",
        description:
          "Cultural heart of Bali — rice terraces, monkey forest, yoga shalas, and the best traditional Balinese cooking.",
      },
      {
        name: "Canggu",
        description:
          "Surfer-yogi-digital-nomad town with black-sand beaches, beach clubs, healthy cafés, and warungs that haven't lost their soul.",
      },
      {
        name: "Seminyak",
        description:
          "Bali's polished side — boutique hotels, beachfront fine dining, and Potato Head Beach Club. Slightly more expensive.",
      },
      {
        name: "Uluwatu",
        description:
          "Cliffside temples, world-class surf breaks (for experts), and dramatic beaches reached by stairs cut into the rock.",
      },
      {
        name: "Sidemen",
        description:
          "The Bali of 30 years ago. Quiet rice-terrace village in the east, no traffic, no nightlife, all soul.",
      },
    ],
    experiences: [
      {
        name: "Tegallalang Rice Terraces",
        description:
          "The classic photo. Get there at sunrise to beat the buses and wear proper shoes — the paths are narrow and slippery.",
        type: "nature",
      },
      {
        name: "Uluwatu Temple at sunset",
        description:
          "Cliffside Hindu temple with the famous kecak fire dance performance at dusk. Hold onto your sunglasses — the monkeys are thieves.",
        type: "landmark",
      },
      {
        name: "Mount Batur sunrise hike",
        description:
          "Two-hour pre-dawn climb up an active volcano. Cold at the top, but the sunrise above the cloud layer is unforgettable.",
        type: "nature",
      },
      {
        name: "Tirta Empul",
        description:
          "Sacred water temple where Balinese have come to purify themselves in the springs for over 1,000 years. Bring a sarong.",
        type: "culture",
      },
      {
        name: "Ubud cooking class",
        description:
          "Most include a market visit and 5-6 dishes. Paon Bali and Casa Luna are well-loved.",
        type: "food",
      },
      {
        name: "Nusa Penida day trip",
        description:
          "Fast boat to Bali's wilder neighbor island. Kelingking Beach (the T-Rex viewpoint) and Angel's Billabong are iconic.",
        type: "nature",
      },
      {
        name: "Surf lesson in Canggu",
        description:
          "Old Man's, Echo Beach, and Berawa have soft beach breaks perfect for beginners. Lessons cost $20-30 with board.",
        type: "nature",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Bali?",
        answer:
          "A week minimum to split between Ubud (3 nights) and a beach base (3-4 nights). Two weeks lets you add Nusa Penida or the east coast.",
      },
      {
        question: "Where should I stay in Bali?",
        answer:
          "First-time: split your stay between Ubud (jungle/culture) and Canggu or Seminyak (beach). Avoid Kuta — it's gone downhill.",
      },
      {
        question: "Is Bali expensive?",
        answer:
          "By Asian standards, no — and you can live well for $80-120/day. Ubud is cheaper than the beach areas. Imported wine is the one thing that's pricey.",
      },
      {
        question: "How do I get around Bali?",
        answer:
          "Hire a driver for full-day excursions ($40-50). Grab and Gojek work in cities. For Ubud and the beaches, scooters are cheap but the traffic is genuinely dangerous if you're not experienced.",
      },
      {
        question: "Do I need a visa for Bali?",
        answer:
          "Most nationalities can buy a visa-on-arrival at Denpasar airport for around $35, valid 30 days and extendable once.",
      },
    ],
    themes: ["beach", "yoga", "nature", "temples", "value"],
    gradient: ["#7FA384", "#D4734A"],
  },

  {
    slug: "singapore",
    name: "Singapore",
    country: "Singapore",
    countryCode: "SG",
    region: "Asia",
    latitude: 1.3521,
    longitude: 103.8198,
    currency: "SGD",
    language: "English",
    timezone: "Asia/Singapore",
    bestMonths: ["February", "March", "April", "July", "August"],
    bestTimeBlurb:
      "Singapore is hot and humid year-round. February-April is the driest stretch; avoid the November-January monsoon if you can.",
    avgDailyBudgetUSD: { budget: 80, mid: 200, luxury: 550 },
    heroBlurb:
      "An impossibly clean, safe, multicultural city-state with the best airport on Earth and hawker centers serving Michelin-starred noodles for $4.",
    longDescription:
      "Singapore is the most efficient city in Asia — and probably the world. The MRT is spotless, the food is extraordinary, and the city packs world-class architecture, gardens, and museums into 280 square miles. It's also small enough to genuinely see in 3-4 days. Stay in Chinatown or Tanjong Pagar for character, eat at hawker centers (not malls), and don't miss Gardens by the Bay after dark.",
    neighborhoods: [
      {
        name: "Marina Bay",
        description:
          "Iconic waterfront with Marina Bay Sands, the ArtScience Museum, and Gardens by the Bay. The skyline shot.",
      },
      {
        name: "Chinatown",
        description:
          "Heritage shophouses, hawker centers, temples, and the city's best preserved street food culture.",
      },
      {
        name: "Tiong Bahru",
        description:
          "Art Deco walk-up apartments, indie cafés, and a famous hawker center. Singapore's hippest neighborhood.",
      },
      {
        name: "Kampong Glam",
        description:
          "Malay-Muslim quarter centered on Sultan Mosque. Haji Lane has indie boutiques and Middle Eastern restaurants.",
      },
      {
        name: "Little India",
        description:
          "Vibrant, chaotic by Singapore standards, with the best dosas and biryanis outside India itself.",
      },
    ],
    experiences: [
      {
        name: "Gardens by the Bay",
        description:
          "Futuristic park with the Supertree Grove (free light show at 7:45 and 8:45 nightly) and the climate-controlled Cloud Forest dome.",
        type: "nature",
      },
      {
        name: "Marina Bay Sands SkyPark",
        description:
          "The infinity pool is hotel guests only, but the observation deck is open to all and offers the iconic skyline.",
        type: "landmark",
      },
      {
        name: "Hawker center crawl",
        description:
          "Maxwell, Lau Pa Sat, Tiong Bahru — Singapore's hawker centers are UNESCO-listed and serve some of the world's best $4 meals.",
        type: "food",
      },
      {
        name: "Sentosa Island",
        description:
          "Mostly skip the resorts, but Universal Studios and S.E.A. Aquarium are solid for families. Take the cable car for the views.",
        type: "landmark",
      },
      {
        name: "ArtScience Museum",
        description:
          "TeamLab's permanent Future World installation lives here. Book timed entry online.",
        type: "culture",
      },
      {
        name: "Singapore Botanic Gardens",
        description:
          "UNESCO-listed, free, and home to the National Orchid Garden. A green respite from the city heat.",
        type: "nature",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Singapore?",
        answer:
          "Three days is enough to see the highlights without rushing. Two days works as a stopover; four days lets you slow down and explore the neighborhoods.",
      },
      {
        question: "Is Singapore expensive?",
        answer:
          "Hotels and alcohol are expensive — among the priciest in Asia. But hawker food, public transport, and museums are reasonable. Eat hawker, drink at home, and you'll do fine.",
      },
      {
        question: "Is Singapore safe?",
        answer:
          "Among the safest major cities on Earth. Crime is rare, the laws are strict, and walking alone at night is a non-issue.",
      },
      {
        question: "What's the best hawker center?",
        answer:
          "Maxwell (Hainanese chicken rice at Tian Tian), Lau Pa Sat (Satay Street comes alive after 7pm), Tiong Bahru (chwee kueh and pork rib soup), Old Airport Road (huge variety).",
      },
      {
        question: "Do I need cash in Singapore?",
        answer:
          "Mostly no — cards and contactless work everywhere. Hawker centers are increasingly cashless too. Bring SGD 50 for emergencies.",
      },
    ],
    themes: ["food", "architecture", "modern", "gardens"],
    gradient: ["#9BB59F", "#7FA384"],
  },

  {
    slug: "seoul",
    name: "Seoul",
    country: "South Korea",
    countryCode: "KR",
    region: "Asia",
    latitude: 37.5665,
    longitude: 126.978,
    currency: "KRW",
    language: "Korean",
    timezone: "Asia/Seoul",
    bestMonths: ["April", "May", "September", "October"],
    bestTimeBlurb:
      "Spring brings cherry blossoms and mild weather; fall delivers crisp blue skies and brilliant foliage in the palaces. Summer is humid and rainy; winter is brutally cold.",
    avgDailyBudgetUSD: { budget: 70, mid: 170, luxury: 450 },
    heroBlurb:
      "K-pop, palaces, late-night BBQ, and a city that feels like it's running on fast-forward in the best way.",
    longDescription:
      "Seoul moves faster than Tokyo and stays open later. Joseon-dynasty palaces sit in the shadow of glass towers, traditional hanok villages survive a few blocks from the trendiest cocktail bars in Asia, and the food culture — KBBQ at 1am, banchan-laden hansik lunch, fried chicken and beer (chimaek) in any back alley — is the real reason to come.",
    neighborhoods: [
      {
        name: "Myeongdong",
        description:
          "Tourist-friendly shopping district with K-beauty flagships, street food, and central transit access.",
      },
      {
        name: "Hongdae",
        description:
          "University area with indie music venues, late-night clubs, vintage shops, and the city's best young energy.",
      },
      {
        name: "Itaewon",
        description:
          "International district with great restaurants, craft cocktail bars, and the city's queer nightlife on Homo Hill.",
      },
      {
        name: "Bukchon Hanok Village",
        description:
          "Traditional Joseon-era houses on a hillside between Gyeongbokgung and Changdeokgung. Quiet and photogenic.",
      },
      {
        name: "Seongsu",
        description:
          "Former industrial district turned cool-kid playground — concept stores, third-wave coffee, and Brooklyn-style warehouses.",
      },
    ],
    experiences: [
      {
        name: "Gyeongbokgung Palace",
        description:
          "The grandest of Seoul's five palaces. Time your visit for the changing of the guard at 10am or 2pm.",
        type: "landmark",
      },
      {
        name: "Bukchon Hanok Village walk",
        description:
          "Wander the lanes around Gyedong-gil for the iconic photo with skyline-and-tile-roofs. Be quiet — people live here.",
        type: "culture",
      },
      {
        name: "Korean BBQ in Mapo",
        description:
          "Mapo and Hongdae have the city's best samgyeopsal (pork belly) joints. Look for tables full of Koreans and order soju.",
        type: "food",
      },
      {
        name: "Gwangjang Market",
        description:
          "Traditional market famous for bindae-tteok (mung bean pancakes), mayak gimbap, and live octopus if you dare.",
        type: "food",
      },
      {
        name: "N Seoul Tower",
        description:
          "Atop Namsan, with a 360° view of the city. Take the cable car up and walk down through Namsan Park.",
        type: "landmark",
      },
      {
        name: "DMZ tour",
        description:
          "Half-day or full-day tour to the Korean Demilitarized Zone. Surreal, sobering, and only an hour from the city.",
        type: "culture",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Seoul?",
        answer:
          "Four days hits the palaces, key neighborhoods, food scene, and a DMZ tour. Five lets you slow down and add a Bukhansan hike.",
      },
      {
        question: "Do I need to speak Korean?",
        answer:
          "Helpful but not essential. English signage is good in central Seoul, and Papago (Korea's Google Translate equivalent) is excellent.",
      },
      {
        question: "Is Seoul cheap?",
        answer:
          "Cheaper than Tokyo, similar to Taipei. Hotels are reasonable, food is excellent value, and the metro is one of the world's best for $1-2 a ride.",
      },
      {
        question: "What's the best month to visit Seoul?",
        answer:
          "October is unbeatable — clear skies, cool weather, beautiful palace foliage. April for cherry blossoms is a close second.",
      },
      {
        question: "Should I get a T-money card?",
        answer:
          "Yes — it works on the metro, buses, and even some convenience stores. Buy and load it at any subway station.",
      },
    ],
    themes: ["food", "culture", "shopping", "nightlife"],
    gradient: ["#7D3218", "#C4522A"],
  },

  // ============================================================
  // AMERICAS
  // ============================================================
  {
    slug: "new-york-city",
    name: "New York City",
    country: "United States",
    countryCode: "US",
    region: "Americas",
    latitude: 40.7128,
    longitude: -74.006,
    currency: "USD",
    language: "English",
    timezone: "America/New_York",
    bestMonths: ["April", "May", "June", "September", "October"],
    bestTimeBlurb:
      "Spring and fall are perfect — mild weather, full park life, no August humidity, no January wind tunnels.",
    avgDailyBudgetUSD: { budget: 130, mid: 320, luxury: 800 },
    heroBlurb:
      "The most concentrated dose of art, food, and human energy in North America.",
    longDescription:
      "New York is exhausting on purpose — that's the point. The five boroughs contain more world-class everything (museums, restaurants, theater, music, neighborhoods) than any first visit can absorb. Pace yourself, stay in walkable areas like the West Village or Lower East Side, and ride the subway like a local. Don't try to see all five boroughs on a first visit — focus on Manhattan below 110th Street and one or two neighborhoods in Brooklyn (Williamsburg, Dumbo, Park Slope).",
    neighborhoods: [
      {
        name: "West Village",
        description:
          "Tree-lined townhouse blocks, the city's most charming streets, and the best spot to base for first-time visitors.",
      },
      {
        name: "Lower East Side",
        description:
          "Tenement history, the best dive bars and natural-wine bars, late-night dim sum, and the New Museum.",
      },
      {
        name: "Williamsburg, Brooklyn",
        description:
          "Hipster origin story, but still home to great restaurants, the Brooklyn Brewery, and Smorgasburg flea markets.",
      },
      {
        name: "Upper West Side",
        description:
          "Family-friendly, classic NYC, with the Museum of Natural History and the best edge of Central Park.",
      },
      {
        name: "Soho & Tribeca",
        description:
          "Cobblestoned cast-iron architecture, designer shopping, and the city's poshest residential lofts.",
      },
    ],
    experiences: [
      {
        name: "Central Park",
        description:
          "Don't just walk through — enter at 72nd Street, see Bethesda Terrace, the Bow Bridge, the Mall, and Sheep Meadow. Bring a picnic.",
        type: "nature",
      },
      {
        name: "Metropolitan Museum of Art",
        description:
          "Three hours minimum. Hit the Egyptian Wing, the European paintings, and the rooftop garden for the Central Park view.",
        type: "culture",
      },
      {
        name: "MoMA",
        description:
          "Van Gogh's Starry Night, Picasso's Demoiselles, and the best modern art collection in the Americas.",
        type: "culture",
      },
      {
        name: "Brooklyn Bridge walk",
        description:
          "Walk Brooklyn-to-Manhattan (not the other way) for the iconic skyline approach. Start at Dumbo for breakfast.",
        type: "landmark",
      },
      {
        name: "A Broadway show",
        description:
          "Use TodayTix or the TKTS booth in Times Square for same-day discounts. Catch any straight play, not just musicals.",
        type: "culture",
      },
      {
        name: "Pizza crawl",
        description:
          "Joe's (West Village), Lucali (Carroll Gardens), Di Fara (Midwood), Roberta's (Bushwick). Two slices each, max.",
        type: "food",
      },
      {
        name: "9/11 Memorial & Museum",
        description:
          "The twin reflecting pools are free and quietly devastating. The museum below is moving but emotionally heavy.",
        type: "culture",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in NYC?",
        answer:
          "Five days for first-time visitors hits the highlights without burning out. Three days is doable but rushed. A week lets you add Brooklyn, Queens, and slower neighborhood time.",
      },
      {
        question: "Is NYC dangerous?",
        answer:
          "Manhattan and most of Brooklyn are very safe day and night. Be aware on subway platforms late at night and watch your phone in crowded areas.",
      },
      {
        question: "Should I take the subway?",
        answer:
          "Yes — it's the fastest way to move. Get an OMNY-compatible contactless card or just tap your phone. The 24/7 service is genuinely useful.",
      },
      {
        question: "How much should I tip in NYC?",
        answer:
          "20% standard at sit-down restaurants, $1-2 per drink at bars, 15-20% in taxis. Tipping less feels rude here in a way it doesn't elsewhere.",
      },
      {
        question: "Where should I stay in NYC?",
        answer:
          "Below 14th Street in Manhattan if you want walkability and character. Midtown is convenient but soulless. Williamsburg or Park Slope in Brooklyn for a more local feel.",
      },
    ],
    themes: ["culture", "food", "art", "shopping", "nightlife"],
    gradient: ["#1A1A1A", "#2D2D2D"],
  },

  {
    slug: "san-francisco",
    name: "San Francisco",
    country: "United States",
    countryCode: "US",
    region: "Americas",
    latitude: 37.7749,
    longitude: -122.4194,
    currency: "USD",
    language: "English",
    timezone: "America/Los_Angeles",
    bestMonths: ["September", "October", "April", "May"],
    bestTimeBlurb:
      "Counter-intuitively, September and October are San Francisco's best months — warm, sunny, and free of the famous summer fog ('Karl').",
    avgDailyBudgetUSD: { budget: 110, mid: 270, luxury: 700 },
    heroBlurb:
      "Hilly, foggy, food-obsessed, and packed into 49 walkable square miles between two bridges.",
    longDescription:
      "San Francisco is small (only 47 square miles), distinctly weird, and the most beautiful US city by some distance. The fog rolls through the Golden Gate, the cable cars still climb California Street, and the food scene punches well above the city's size. Don't drive — the parking is impossible and the public transit is good. Wear layers, eat dim sum in Chinatown, ride a streetcar down Market Street, and walk somewhere across the Golden Gate Bridge.",
    neighborhoods: [
      {
        name: "Mission District",
        description:
          "Latino heritage, the city's best food scene, murals along Balmy Alley, and Dolores Park on a sunny Saturday.",
      },
      {
        name: "Castro",
        description:
          "Historic queer neighborhood with the Castro Theatre, rainbow crosswalks, and a community vibe that survived the tech boom.",
      },
      {
        name: "North Beach",
        description:
          "Italian heritage, City Lights bookstore, espresso bars on Columbus Avenue, and easy walking access to Coit Tower.",
      },
      {
        name: "Hayes Valley",
        description:
          "Compact, walkable, with the best independent shops, cafés, and Smitten Ice Cream.",
      },
      {
        name: "Russian Hill",
        description:
          "Famous Lombard Street, panoramic views, and walking distance to Fisherman's Wharf without staying in the tourist core.",
      },
    ],
    experiences: [
      {
        name: "Walk the Golden Gate Bridge",
        description:
          "Park at Crissy Field, walk across (it's 1.7 miles each way), and reward yourself with hot chocolate at Sausalito on the other side. Bring a windbreaker.",
        type: "landmark",
      },
      {
        name: "Alcatraz",
        description:
          "Book the Cellhouse Audio Tour weeks in advance — it's narrated by former inmates and guards. Genuinely moving.",
        type: "culture",
      },
      {
        name: "Cable car on Powell-Hyde line",
        description:
          "The historic line that runs over Russian Hill and down to Aquatic Park. Pay the conductor, hang off the side.",
        type: "landmark",
      },
      {
        name: "Mission burritos",
        description:
          "La Taqueria, El Farolito, or Taqueria Cancún. Order al pastor, super (with avocado), and don't put it down.",
        type: "food",
      },
      {
        name: "Ferry Building Marketplace",
        description:
          "Embarcadero food hall on Saturday morning during the farmers market. Cowgirl Creamery, Hog Island Oysters, Acme Bread.",
        type: "food",
      },
      {
        name: "Muir Woods + Sausalito day trip",
        description:
          "Drive north over the Golden Gate Bridge to a redwood grove, then lunch at Sausalito's waterfront. Half-day total.",
        type: "nature",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in San Francisco?",
        answer:
          "Three full days hits the highlights. Add a fourth for Muir Woods, Napa, or Half Moon Bay.",
      },
      {
        question: "Is San Francisco safe?",
        answer:
          "Generally yes, but Tenderloin and parts of SoMa can feel rough — Google your hotel address before booking. Car break-ins are common; never leave anything visible in a parked car.",
      },
      {
        question: "Should I rent a car in San Francisco?",
        answer:
          "Not for the city itself — parking is brutal. Rent only for day trips north or south. BART, Muni, and the cable cars cover the city.",
      },
      {
        question: "What's with the fog?",
        answer:
          "Cold Pacific water + warm inland air = 'Karl the Fog' rolling through the Golden Gate, especially May-August. Layers are non-negotiable.",
      },
      {
        question: "Is the food scene really that good?",
        answer:
          "Yes — among the top three in the US. The Mission burrito, the dim sum at Yank Sing, the dungeness crab, and the third-wave coffee culture are all world-class.",
      },
    ],
    themes: ["food", "nature", "architecture", "tech"],
    gradient: ["#D4734A", "#6B8F71"],
  },

  {
    slug: "mexico-city",
    name: "Mexico City",
    country: "Mexico",
    countryCode: "MX",
    region: "Americas",
    latitude: 19.4326,
    longitude: -99.1332,
    currency: "MXN",
    language: "Spanish",
    timezone: "America/Mexico_City",
    bestMonths: ["March", "April", "May", "October", "November"],
    bestTimeBlurb:
      "The dry season (October-May) is best — cool mornings, warm afternoons, blue skies. Avoid June-September if you can; the daily afternoon thunderstorms are intense.",
    avgDailyBudgetUSD: { budget: 50, mid: 130, luxury: 350 },
    heroBlurb:
      "The world's best food city most people haven't visited, with leafy art-filled neighborhoods and 700-year-old Aztec ruins downtown.",
    longDescription:
      "Mexico City has quietly become one of the most exciting cities on Earth. The food — taquerías, market stalls, fine-dining temples, mezcal cantinas — is stunning. The neighborhoods Roma, Condesa, and Coyoacán are leafy and walkable. The art is everywhere (Frida Kahlo's house, the Anthropology Museum, contemporary galleries in San Miguel Chapultepec). And the prices are still mostly reasonable. Stay in Roma Norte or Condesa, take Ubers (cheap and safe), drink the tap water filtered, and eat everything.",
    neighborhoods: [
      {
        name: "Roma Norte",
        description:
          "Tree-lined Art Nouveau streets, the city's best restaurant and bar scene, and easy walking access to Condesa.",
      },
      {
        name: "Condesa",
        description:
          "Sister neighborhood to Roma — slightly more residential, with two big oval parks and great brunch.",
      },
      {
        name: "Centro Histórico",
        description:
          "The old colonial core with the Zócalo, the cathedral, and the Templo Mayor Aztec ruins. Touristy but unmissable.",
      },
      {
        name: "Coyoacán",
        description:
          "Charming southern neighborhood with Frida Kahlo's blue house, cobblestone streets, and a famous traditional market.",
      },
      {
        name: "Polanco",
        description:
          "The city's polished side — luxury hotels, the Soumaya Museum, and Pujol (Mexico's most famous restaurant).",
      },
    ],
    experiences: [
      {
        name: "Museo Nacional de Antropología",
        description:
          "Among the best museums in the Americas. Plan three hours and don't skip the Aztec Sun Stone or the Mayan exhibits.",
        type: "culture",
      },
      {
        name: "Frida Kahlo Museum (Casa Azul)",
        description:
          "Frida's home and studio in Coyoacán. Buy timed tickets online weeks in advance — they sell out daily.",
        type: "culture",
      },
      {
        name: "Teotihuacán pyramids",
        description:
          "An hour outside the city. Climb the Pyramid of the Sun (third largest in the world) early to beat the heat.",
        type: "landmark",
      },
      {
        name: "Mercado de San Juan",
        description:
          "Gourmet market with insect snacks, exotic meats, and the city's best cheese counters. Lunch at one of the prepared-food stalls.",
        type: "food",
      },
      {
        name: "Taquería tour",
        description:
          "El Tizoncito for tacos al pastor, El Califa for late-night carne asada, El Vilsito (a mechanic shop by day, taquería by night).",
        type: "food",
      },
      {
        name: "Xochimilco trajinera",
        description:
          "Brightly painted boats on the canals south of the city. Great with a group — bring snacks, drinks, and a mariachi if you want one.",
        type: "nature",
      },
      {
        name: "Lucha libre at Arena México",
        description:
          "Mexican wrestling matches Tuesday/Friday/Sunday nights. Pure spectacle — masks, capes, drama.",
        type: "nightlife",
      },
    ],
    faqs: [
      {
        question: "Is Mexico City safe?",
        answer:
          "The neighborhoods tourists frequent (Roma, Condesa, Polanco, Coyoacán, Centro) are very safe day and night. Use Uber instead of street taxis and you'll be fine.",
      },
      {
        question: "How many days do you need in Mexico City?",
        answer:
          "Four to five days minimum. The city is enormous and the day trip to Teotihuacán is essential.",
      },
      {
        question: "Can I drink the water?",
        answer:
          "No — stick to bottled or filtered. Most restaurants use purified water for ice and washing produce, and stomach issues are less common than visitors fear.",
      },
      {
        question: "Do I need to speak Spanish?",
        answer:
          "Helpful but not essential in Roma, Condesa, and Polanco where many service workers speak English. Outside those areas, basic Spanish goes a long way.",
      },
      {
        question: "What about the altitude?",
        answer:
          "Mexico City sits at 7,350 feet (2,240m). Some travelers feel mild headaches or fatigue the first day. Drink water, take it easy, and lay off the mezcal until day two.",
      },
    ],
    themes: ["food", "art", "history", "value"],
    gradient: ["#C4522A", "#7D3218"],
  },

  {
    slug: "rio-de-janeiro",
    name: "Rio de Janeiro",
    country: "Brazil",
    countryCode: "BR",
    region: "Americas",
    latitude: -22.9068,
    longitude: -43.1729,
    currency: "BRL",
    language: "Portuguese",
    timezone: "America/Sao_Paulo",
    bestMonths: ["April", "May", "September", "October", "November"],
    bestTimeBlurb:
      "Shoulder seasons (April-May and September-November) deliver warm beach weather without the December-February heat or crowds. Carnival in February is incredible but absurdly expensive.",
    avgDailyBudgetUSD: { budget: 60, mid: 160, luxury: 450 },
    heroBlurb:
      "Sugarloaf, Christ the Redeemer, and the world's most beautiful urban beach scene — wrapped in samba.",
    longDescription:
      "Rio is geographically one of the most stunning cities on Earth — the Atlantic, the granite mountains, the curving beaches, the favelas climbing the hills. Stay in Copacabana, Ipanema, or Leblon for the safest base, take the cable car up Sugarloaf at sunset, climb (or train up) to Christ the Redeemer on a clear day, and spend your evenings at a botequim eating petiscos and drinking caipirinhas. Be mindful with valuables; Rio's beauty comes with real street-crime risks.",
    neighborhoods: [
      {
        name: "Ipanema",
        description:
          "The most famous beach, the most desirable neighborhood, the best base for first-time visitors. Walk to everything.",
      },
      {
        name: "Leblon",
        description:
          "Quieter, more upscale extension of Ipanema. Best restaurants, fewer tourists, same beach.",
      },
      {
        name: "Copacabana",
        description:
          "Iconic 4km crescent beach. Slightly grittier than Ipanema but still touristy in a manageable way.",
      },
      {
        name: "Santa Teresa",
        description:
          "Hilltop bohemian neighborhood with cobblestone streets, art studios, and the famous yellow tram (bondinho).",
      },
      {
        name: "Lapa",
        description:
          "Nightlife central — samba clubs, the famous arches (Arcos da Lapa), and Saturday street parties.",
      },
    ],
    experiences: [
      {
        name: "Christ the Redeemer (Cristo Redentor)",
        description:
          "Take the cog train up Corcovado mountain. Go on a clear morning — clouds can completely hide the view.",
        type: "landmark",
      },
      {
        name: "Sugarloaf cable car at sunset",
        description:
          "Two-stage cable car up to Pão de Açúcar. Time it for golden hour to see Rio light up below.",
        type: "landmark",
      },
      {
        name: "Ipanema beach day",
        description:
          "Arrive by 10am, rent a chair (R$30), order an açaí bowl from a wandering vendor, and stay until sunset over Two Brothers mountain.",
        type: "nature",
      },
      {
        name: "Selarón Steps",
        description:
          "The famous mosaic staircase by Chilean artist Jorge Selarón connecting Lapa and Santa Teresa. Free, photogenic, takes 20 minutes.",
        type: "landmark",
      },
      {
        name: "Tijuca National Forest",
        description:
          "The world's largest urban rainforest, right in the city. Hike Pedra Bonita for hang-gliders' views of the coastline.",
        type: "nature",
      },
      {
        name: "Samba night in Lapa",
        description:
          "Rio Scenarium and Carioca da Gema are the classics — live samba, dancing, caipirinhas. Saturdays are wild.",
        type: "nightlife",
      },
      {
        name: "Favela tour (responsible)",
        description:
          "Book through community-run operators like Favela Adventures in Rocinha. Avoid jeep tours that treat residents like a zoo.",
        type: "culture",
      },
    ],
    faqs: [
      {
        question: "Is Rio de Janeiro safe?",
        answer:
          "Mixed. Ipanema, Leblon, and most of Copacabana are safe in daylight. Avoid wearing jewelry or flashing phones. After dark, take Ubers everywhere and never walk on the beach itself.",
      },
      {
        question: "How many days do you need in Rio?",
        answer:
          "Four to five days — two for the iconic sights, one for a beach day, one for a hike, one for a day trip to Búzios or Petrópolis.",
      },
      {
        question: "When is Carnival in Rio?",
        answer:
          "Five days leading up to Ash Wednesday — typically late February or early March. Hotels triple in price and book a year ahead.",
      },
      {
        question: "Do I need to speak Portuguese?",
        answer:
          "Some basic Portuguese helps — Brazilian English fluency is lower than Western Europe. 'Obrigado/obrigada' (thank you) and 'por favor' go a long way.",
      },
      {
        question: "Is the water safe to drink?",
        answer:
          "Stick to bottled or filtered. Restaurants are fine; tap water in budget hotels less so.",
      },
    ],
    themes: ["beach", "nature", "music", "nightlife"],
    gradient: ["#D4734A", "#6B8F71"],
  },

  {
    slug: "buenos-aires",
    name: "Buenos Aires",
    country: "Argentina",
    countryCode: "AR",
    region: "Americas",
    latitude: -34.6037,
    longitude: -58.3816,
    currency: "ARS",
    language: "Spanish",
    timezone: "America/Argentina/Buenos_Aires",
    bestMonths: ["October", "November", "March", "April", "May"],
    bestTimeBlurb:
      "Spring (October-November) and fall (March-May) deliver mild weather and tree-lined Palermo at its leafiest. Summer (December-February) is hot and many porteños leave town.",
    avgDailyBudgetUSD: { budget: 45, mid: 115, luxury: 320 },
    heroBlurb:
      "The Paris of South America — grand boulevards, late-night steakhouses, and the world's best tango.",
    longDescription:
      "Buenos Aires is the most European city in the Americas, with French-style architecture, Italian-influenced food, and a café culture that runs on espresso and medialunas until midnight. The city's strength is its neighborhoods (barrios) — each with a distinct personality. Stay in Palermo Soho or Recoleta, eat steak at a real parrilla, drink Malbec, watch a tango show (the touristy ones are fine for a first visit), and learn how to say 'sho' instead of 'yo' to fit in.",
    neighborhoods: [
      {
        name: "Palermo Soho",
        description:
          "Trendy boutiques, third-wave cafés, the city's best restaurants and rooftop bars. Best base for first-timers.",
      },
      {
        name: "Palermo Hollywood",
        description:
          "Sister to Palermo Soho, with more nightlife — cocktail bars, milongas, and late-night parrillas.",
      },
      {
        name: "Recoleta",
        description:
          "Elegant, upscale, with the famous cemetery (Eva Perón is buried here) and the city's best museum, MALBA.",
      },
      {
        name: "San Telmo",
        description:
          "Old-town bohemian district. Sunday antique market on Plaza Dorrego, tango on the cobblestones, the best preserved colonial architecture.",
      },
      {
        name: "Puerto Madero",
        description:
          "Refurbished docklands with steakhouses and modernist hotels. Polished but a bit soulless — visit, don't stay.",
      },
    ],
    experiences: [
      {
        name: "Steak dinner at a parrilla",
        description:
          "Don Julio is world-famous (and worth the wait); La Cabrera and Parrilla Peña are fantastic alternatives. Order bife de chorizo, ojo de bife, and Malbec.",
        type: "food",
      },
      {
        name: "Recoleta Cemetery",
        description:
          "Free, sprawling, surreal — over 6,000 mausoleums housing presidents, generals, and Eva Perón.",
        type: "landmark",
      },
      {
        name: "Tango show in San Telmo",
        description:
          "Café de los Angelitos and El Querandí are the polished tourist productions; for the real thing, find a milonga at La Catedral or Salón Canning.",
        type: "culture",
      },
      {
        name: "MALBA",
        description:
          "Museum of Latin American Art with one of the continent's best collections. Frida Kahlo, Diego Rivera, Tarsila do Amaral.",
        type: "culture",
      },
      {
        name: "La Boca and Caminito",
        description:
          "Brightly painted dockworker houses. Touristy by day, sketchy after dark — visit late morning, then leave.",
        type: "neighborhood",
      },
      {
        name: "Mate in a park",
        description:
          "Buenos Aires runs on yerba mate. Buy a gourd, learn the ritual, and join the locals in Bosques de Palermo on a Sunday.",
        type: "food",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Buenos Aires?",
        answer:
          "Four days hits the major neighborhoods, food, and tango without rushing. Five lets you add a day trip to Tigre or a winery.",
      },
      {
        question: "What's the deal with the Argentine peso?",
        answer:
          "Argentina has multiple exchange rates and inflation is high. Bring USD cash (clean, large bills) and exchange at 'cuevas' or use Western Union for the favorable 'blue dollar' rate. Cards charge a worse official rate.",
      },
      {
        question: "Is Buenos Aires safe?",
        answer:
          "Mostly yes, with normal big-city precautions. Avoid La Boca after dark and keep your phone out of sight in crowded areas.",
      },
      {
        question: "When is the best time to visit?",
        answer:
          "October-November (spring) and March-May (fall). Avoid July's cold rain and December-February's heat exodus.",
      },
      {
        question: "How late do people eat dinner?",
        answer:
          "Late. Parrillas don't fill until 9-10pm; nightlife starts at 1am. Adjust your schedule or you'll be eating alone.",
      },
    ],
    themes: ["food", "music", "architecture", "value"],
    gradient: ["#7FA384", "#C4522A"],
  },

  {
    slug: "cusco",
    name: "Cusco",
    country: "Peru",
    countryCode: "PE",
    region: "Americas",
    latitude: -13.5319,
    longitude: -71.9675,
    currency: "PEN",
    language: "Spanish & Quechua",
    timezone: "America/Lima",
    bestMonths: ["May", "June", "July", "August", "September"],
    bestTimeBlurb:
      "Dry season (May-September) is best for hiking and Machu Picchu. June-August are peak; May and September offer fewer crowds with the same blue skies.",
    avgDailyBudgetUSD: { budget: 50, mid: 130, luxury: 380 },
    heroBlurb:
      "The Inca capital — cobblestoned, Andean, and the gateway to Machu Picchu.",
    longDescription:
      "Cusco was the heart of the Inca empire before the Spanish arrived, and you can still see the masonry walls of pre-Columbian palaces beneath colonial cathedrals. At 11,150 feet, the altitude is no joke — give yourself a day or two to acclimate before doing Machu Picchu or any hiking. Stay in San Blas for the artist-village vibe, eat at Cicciolina or Chicha (Gastón Acurio's restaurant), drink coca tea, and use Cusco as the base for the entire Sacred Valley.",
    neighborhoods: [
      {
        name: "Plaza de Armas",
        description:
          "The colonial main square — cathedrals, restaurants, and the city's geographic center. Touristy but unmissable.",
      },
      {
        name: "San Blas",
        description:
          "Artisan neighborhood on the hill above the plaza. Cobblestones, art studios, the best cafés, and the most charming guesthouses.",
      },
      {
        name: "San Pedro",
        description:
          "Where the central market is — local life, cheap eats, fruit juices, fresh empanadas.",
      },
    ],
    experiences: [
      {
        name: "Machu Picchu",
        description:
          "Take the Vistadome train from Ollantaytambo to Aguas Calientes the night before, then bus up at dawn. Book entry tickets months in advance — you must reserve a circuit.",
        type: "landmark",
      },
      {
        name: "Sacred Valley day trip",
        description:
          "Pisac ruins and market, Ollantaytambo fortress, Chinchero weaving village. Hire a private driver for $80-100 for the day.",
        type: "culture",
      },
      {
        name: "Sacsayhuamán",
        description:
          "Massive Inca fortress on the hill above Cusco with stones the size of cars fitted together without mortar.",
        type: "landmark",
      },
      {
        name: "Rainbow Mountain (Vinicunca)",
        description:
          "Day trip from Cusco — 5,200m altitude and a 90-minute uphill hike. Brutal but unforgettable. Take it slow.",
        type: "nature",
      },
      {
        name: "Coricancha",
        description:
          "The Inca Sun Temple, partially destroyed by the Spanish and rebuilt as Santo Domingo church. The juxtaposition is the point.",
        type: "landmark",
      },
      {
        name: "Cooking class at Marcelo Batata",
        description:
          "Learn to make ceviche, lomo saltado, and pisco sours. Includes a market visit.",
        type: "food",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Cusco?",
        answer:
          "Five to six days minimum if you're including Machu Picchu and the Sacred Valley. Don't rush this region — the altitude alone slows you down.",
      },
      {
        question: "What about altitude sickness?",
        answer:
          "Real and unpleasant for many visitors. Spend your first day resting, drink coca tea, eat lightly, and consider asking your doctor about Diamox before you go.",
      },
      {
        question: "Do I need to book Machu Picchu in advance?",
        answer:
          "Yes — months ahead in high season. Tickets are now circuit-specific; choose Circuit 2 for the classic photo and full ruins experience.",
      },
      {
        question: "Is Cusco safe?",
        answer:
          "Yes, with normal precautions. The main risks are altitude, sketchy taxis (use authorized ones), and being targeted for scams in the Plaza de Armas.",
      },
      {
        question: "Should I do the Inca Trail?",
        answer:
          "Only if you've trained for it and can handle 4 days at altitude. Permits sell out 6 months ahead. The Salkantay Trek is a great alternative with more flexibility.",
      },
    ],
    themes: ["history", "hiking", "culture", "nature"],
    gradient: ["#7D3218", "#425744"],
  },

  // ============================================================
  // MIDDLE EAST & AFRICA
  // ============================================================
  {
    slug: "marrakech",
    name: "Marrakech",
    country: "Morocco",
    countryCode: "MA",
    region: "Africa",
    latitude: 31.6295,
    longitude: -7.9811,
    currency: "MAD",
    language: "Arabic, Berber & French",
    timezone: "Africa/Casablanca",
    bestMonths: ["March", "April", "May", "October", "November"],
    bestTimeBlurb:
      "Spring and fall are perfect — warm days, cool evenings, blooming gardens. Summer is brutal (40°C+); winter is mild but the riads can be cold at night.",
    avgDailyBudgetUSD: { budget: 45, mid: 130, luxury: 400 },
    heroBlurb:
      "An ancient walled city of riads, souks, and a medieval medina that feels like time travel.",
    longDescription:
      "Marrakech is sensory overload in the best way — spice piles in the souks, mint tea in tiled courtyards, snake charmers and storytellers in Jemaa el-Fnaa, and the call to prayer drifting across rose-colored walls. Stay in a traditional riad inside the medina (the walled old city) for the immersion, but plan a day trip out to the cooler Atlas Mountains or the gardens of the new town. The medina is genuinely confusing — embrace getting lost, and don't fight it when local kids offer to guide you back to a landmark for a few dirham.",
    neighborhoods: [
      {
        name: "Medina",
        description:
          "The 1,000-year-old walled old city. Riads, souks, palaces, and the famous Jemaa el-Fnaa square. Stay here.",
      },
      {
        name: "Gueliz",
        description:
          "The French-built new town outside the walls. European-style cafés, contemporary galleries, and Yves Saint Laurent's Jardin Majorelle.",
      },
      {
        name: "Hivernage",
        description:
          "Modern hotel and restaurant district between the medina and Gueliz. Polished but characterless.",
      },
      {
        name: "Mellah",
        description:
          "The old Jewish quarter inside the medina. Quieter, with a different vibe and the city's spice market.",
      },
    ],
    experiences: [
      {
        name: "Jemaa el-Fnaa at sunset",
        description:
          "The world's most theatrical public square. Storytellers, musicians, snake charmers, food stalls firing up at dusk. Sit at a rooftop café for the wide view.",
        type: "landmark",
      },
      {
        name: "Souk shopping",
        description:
          "Get genuinely lost in the alleys north of Jemaa el-Fnaa. Bargain hard (start at 30% of asking), have mint tea with shopkeepers, and don't feel obligated to buy.",
        type: "shopping",
      },
      {
        name: "Bahia Palace",
        description:
          "19th-century palace with intricate carved cedar ceilings, mosaic courtyards, and the best traditional Moroccan craftsmanship in the city.",
        type: "landmark",
      },
      {
        name: "Jardin Majorelle",
        description:
          "Yves Saint Laurent's restored botanical garden in cobalt blue. Buy combined tickets with the YSL Museum next door.",
        type: "nature",
      },
      {
        name: "Hammam",
        description:
          "The traditional Moroccan steam bath ritual — scrub, soap, oil. Splurge at La Mamounia or stay local at a neighborhood hammam.",
        type: "culture",
      },
      {
        name: "Atlas Mountains day trip",
        description:
          "An hour out of the city to Berber villages, waterfalls, and a tagine lunch in the cool mountain air. Imlil is the classic destination.",
        type: "nature",
      },
      {
        name: "Cooking class",
        description:
          "La Maison Arabe and Café Clock both run excellent half-day cooking classes — souk visit, then learning to make tagine and msemen.",
        type: "food",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Marrakech?",
        answer:
          "Three days for the city, plus one or two for an Atlas Mountains or Essaouira day trip. Five days total is ideal.",
      },
      {
        question: "Is Marrakech safe for women?",
        answer:
          "Mostly yes, but be prepared for verbal attention in the souks. Dress modestly (covered shoulders, knees), be assertive, and consider a guided tour for your first medina walk.",
      },
      {
        question: "How aggressive are the touts?",
        answer:
          "Honest answer: aggressive. The medina has scammers, fake guides, and persistent shopkeepers. Be polite but firm. Smile and say 'la, shukran' (no, thank you) and keep walking.",
      },
      {
        question: "Should I stay in a riad?",
        answer:
          "Yes. A riad — a traditional house built around a tiled courtyard — is the experience. Many are stunning and surprisingly affordable. Note that riads can be hard to find on first arrival; arrange a pickup.",
      },
      {
        question: "Do I need to speak Arabic or French?",
        answer:
          "French is more useful than Arabic in the city. English is increasingly common in the tourism trade. Basic French goes a long way.",
      },
    ],
    themes: ["culture", "shopping", "food", "architecture"],
    gradient: ["#D4734A", "#7D3218"],
  },

  {
    slug: "cape-town",
    name: "Cape Town",
    country: "South Africa",
    countryCode: "ZA",
    region: "Africa",
    latitude: -33.9249,
    longitude: 18.4241,
    currency: "ZAR",
    language: "English & Afrikaans",
    timezone: "Africa/Johannesburg",
    bestMonths: ["November", "December", "February", "March", "April"],
    bestTimeBlurb:
      "Cape Town's seasons are flipped — November-April is warm, dry, and ideal for the wine country and beaches. Avoid the windy peak of December-January if you can.",
    avgDailyBudgetUSD: { budget: 65, mid: 160, luxury: 450 },
    heroBlurb:
      "Table Mountain rising over the Atlantic, world-class wine 30 minutes inland, and the most scenically gifted city in Africa.",
    longDescription:
      "Cape Town has everything — a national park inside the city limits, two oceans, beaches, mountains, vineyards, and a food and wine scene that quietly competes with the world's best. Stay in the V&A Waterfront, Camps Bay, or De Waterkant for safety and convenience, plan your activities around the wind (the famous 'Cape Doctor' can shut down Table Mountain), and budget at least one day in the Cape Winelands.",
    neighborhoods: [
      {
        name: "V&A Waterfront",
        description:
          "Polished, safe, and central — restaurants, the Two Oceans Aquarium, and the ferry to Robben Island.",
      },
      {
        name: "City Bowl",
        description:
          "Downtown beneath Table Mountain. Long Street's bars, the Company's Garden, and walking access to most museums.",
      },
      {
        name: "Camps Bay",
        description:
          "Beach suburb with the Twelve Apostles backdrop and the city's most photogenic strip of restaurants. Touristy but stunning.",
      },
      {
        name: "Bo-Kaap",
        description:
          "The brightly painted Cape Malay quarter on Signal Hill — the city's most photographed neighborhood.",
      },
      {
        name: "De Waterkant",
        description:
          "Cobblestoned village within the city. Cafés, design shops, and the city's queer scene.",
      },
    ],
    experiences: [
      {
        name: "Table Mountain cable car",
        description:
          "The flat-topped mountain over the city. Check the cable car website day-of — high winds shut it down regularly.",
        type: "nature",
      },
      {
        name: "Cape of Good Hope",
        description:
          "Day trip down the peninsula via Chapman's Peak Drive. Stop at Boulders Beach (penguins), Simon's Town, and the actual Cape.",
        type: "nature",
      },
      {
        name: "Robben Island",
        description:
          "The prison where Mandela spent 18 years. Ferries leave from the V&A Waterfront. Book online in advance.",
        type: "culture",
      },
      {
        name: "Stellenbosch wine tasting",
        description:
          "Forty-five minutes from Cape Town. Tokara, Delaire Graff, and Babylonstoren are the marquee names. Hire a driver — the tastings add up.",
        type: "food",
      },
      {
        name: "Lion's Head sunrise hike",
        description:
          "Two hours up and down. Start in the dark to catch the sunrise over the city. The chains and ladders near the top make it more adventurous.",
        type: "nature",
      },
      {
        name: "Bo-Kaap walking tour",
        description:
          "Learn the history of the Cape Malay community and try traditional samosas and rotis. The colored houses are the photo op.",
        type: "neighborhood",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Cape Town?",
        answer:
          "Five days lets you do the city, the Cape Peninsula, and a wine country day. A week is even better.",
      },
      {
        question: "Is Cape Town safe?",
        answer:
          "The tourist neighborhoods (Waterfront, Camps Bay, City Bowl) are safe with normal precautions. Use Uber after dark, don't walk in unknown areas at night, and keep valuables hidden.",
      },
      {
        question: "Do I need a car in Cape Town?",
        answer:
          "Helpful for the Cape Peninsula and wine country. In the city itself, Uber is cheap and reliable. Rent a car for your day trips only.",
      },
      {
        question: "What about load shedding?",
        answer:
          "South Africa has scheduled rolling power outages. Most hotels have generators; restaurants are mostly fine. Download EskomSePush to track your area's schedule.",
      },
      {
        question: "When is the best time to visit?",
        answer:
          "October-April for warm weather. December-January is peak summer (and crowds); November and March-April are the sweet spots.",
      },
    ],
    themes: ["nature", "wine", "beach", "hiking"],
    gradient: ["#7FA384", "#C4522A"],
  },

  {
    slug: "dubai",
    name: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    region: "Middle East",
    latitude: 25.2048,
    longitude: 55.2708,
    currency: "AED",
    language: "Arabic & English",
    timezone: "Asia/Dubai",
    bestMonths: ["November", "December", "January", "February", "March"],
    bestTimeBlurb:
      "November to March is the only sane time to visit. Summer (June-September) regularly hits 45°C and most outdoor activities shut down.",
    avgDailyBudgetUSD: { budget: 90, mid: 250, luxury: 800 },
    heroBlurb:
      "Where the desert meets the world's most ambitious skyline, with seven-star hotels, indoor ski slopes, and an old-Arabia heart in the creek.",
    longDescription:
      "Dubai is unapologetically extravagant — and far more interesting than the cliché. Beyond the Burj Khalifa and the malls, the historic Bastakiya quarter, the spice and gold souks across the creek, and the desert just outside the city give you a fuller picture. Stay in Downtown Dubai or DIFC for first-time access, do a desert safari with a reputable operator, and take an abra (water taxi) across the creek for a few dirham — it's the best $0.30 experience in the city.",
    neighborhoods: [
      {
        name: "Downtown Dubai",
        description:
          "Burj Khalifa, Dubai Mall, the dancing fountains. Touristy but central and walkable.",
      },
      {
        name: "Dubai Marina & JBR",
        description:
          "Beachfront skyscraper district. JBR (the beach) and the marina walk are the social heart of expat Dubai.",
      },
      {
        name: "Old Dubai (Deira & Bur Dubai)",
        description:
          "The city before the boom. Spice souk, gold souk, abra rides across the creek. The most underrated part of Dubai.",
      },
      {
        name: "Al Fahidi (Bastakiya)",
        description:
          "Restored historic neighborhood with traditional wind-tower houses, the Dubai Museum, and Arabian Tea House.",
      },
      {
        name: "DIFC",
        description:
          "Dubai International Financial Center — galleries, fine dining, and the best brunch scene in the city.",
      },
    ],
    experiences: [
      {
        name: "Burj Khalifa",
        description:
          "Tallest building in the world. Book the 'At The Top SKY' (148th floor) ticket online for the real view, ideally just before sunset.",
        type: "landmark",
      },
      {
        name: "Desert safari",
        description:
          "Half-day in the dunes — dune bashing, camel ride, sandboarding, and a Bedouin-style dinner under the stars. Book with Platinum Heritage for a less corny experience.",
        type: "nature",
      },
      {
        name: "Gold and spice souks",
        description:
          "Take an abra across Dubai Creek (1 AED) and wander the old markets. Buy saffron, dates, and frankincense. Bargain politely.",
        type: "shopping",
      },
      {
        name: "Al Fahidi historical neighborhood",
        description:
          "Pre-oil Dubai preserved in coral-and-gypsum lanes. Visit the Sheikh Mohammed Centre for Cultural Understanding for an authentic Emirati lunch.",
        type: "culture",
      },
      {
        name: "Jumeirah Beach",
        description:
          "Public beach with the Burj Al Arab in the background. Free, clean, and surprisingly relaxing.",
        type: "nature",
      },
      {
        name: "Dubai Frame",
        description:
          "Skip the Burj and try this — a 150m-tall photo frame with old Dubai on one side and new Dubai on the other.",
        type: "landmark",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Dubai?",
        answer:
          "Three days hits the headline experiences. A fourth day for the desert and old town is worth it.",
      },
      {
        question: "Is Dubai expensive?",
        answer:
          "Mid-range hotels and good food are priced like New York. But taxis are cheap, public transit is excellent, and many of the best things (the souks, the creek, Jumeirah Beach) are nearly free.",
      },
      {
        question: "Is Dubai safe?",
        answer:
          "Among the safest cities in the world. Crime is virtually nil. The main risks are heat exhaustion and sunburn.",
      },
      {
        question: "Can I drink alcohol in Dubai?",
        answer:
          "Yes, but only in licensed venues — hotel bars, restaurants, and nightclubs. Don't drink in public spaces or be visibly drunk. Public intoxication is taken very seriously.",
      },
      {
        question: "What should I wear in Dubai?",
        answer:
          "More relaxed than people expect, but err on the side of modest in old Dubai and at religious sites. Beachwear is fine at hotel pools and beaches.",
      },
    ],
    themes: ["modern", "luxury", "shopping", "desert"],
    gradient: ["#F5D5A8", "#C4522A"],
  },

  // ============================================================
  // OCEANIA
  // ============================================================
  {
    slug: "sydney",
    name: "Sydney",
    country: "Australia",
    countryCode: "AU",
    region: "Oceania",
    latitude: -33.8688,
    longitude: 151.2093,
    currency: "AUD",
    language: "English",
    timezone: "Australia/Sydney",
    bestMonths: ["October", "November", "March", "April"],
    bestTimeBlurb:
      "Spring and fall offer mild weather and uncrowded beaches. December-February is peak (Australian summer) — beautiful but busy. Winter (June-August) is mild but the ocean is too cold to swim.",
    avgDailyBudgetUSD: { budget: 110, mid: 250, luxury: 650 },
    heroBlurb:
      "An outdoor city built around a postcard harbor, with world-class beaches and the world's most photographed opera house.",
    longDescription:
      "Sydney is the most enjoyable major city in the Southern Hemisphere — the harbor, the climate, the food, the beaches, the proximity of nature. Spend a day on the harbor (ferry to Manly is essentially a free cruise), a day on the beach (Bondi to Coogee coastal walk), and a day in the city itself (Opera House, Royal Botanic Garden, the Rocks). The Blue Mountains are 90 minutes by train and worth a day trip if you have time.",
    neighborhoods: [
      {
        name: "The Rocks",
        description:
          "Sydney's oldest neighborhood under the Harbour Bridge. Cobblestoned, touristy, with the best Sunday market.",
      },
      {
        name: "Surry Hills",
        description:
          "Hipster heartland — best brunch, best small bars, walking distance to Central Station.",
      },
      {
        name: "Bondi",
        description:
          "The famous beach. Stay here for surf-town vibes, but it's a 30-minute bus to the city.",
      },
      {
        name: "Newtown",
        description:
          "Inner-west bohemian district — vintage shops, indie bookshops, and the city's best pub scene on King Street.",
      },
      {
        name: "Manly",
        description:
          "Beach suburb across the harbor. The 30-minute ferry ride from Circular Quay is the cheapest harbor cruise on Earth.",
      },
    ],
    experiences: [
      {
        name: "Sydney Opera House tour",
        description:
          "The 1-hour interior tour explains the wild engineering story. Better yet — book a show.",
        type: "landmark",
      },
      {
        name: "Bondi to Coogee coastal walk",
        description:
          "Six kilometers along the cliffs and beaches. Allow 2-3 hours with stops for swims and coffee. The most-recommended thing in Sydney for good reason.",
        type: "nature",
      },
      {
        name: "Manly ferry from Circular Quay",
        description:
          "Thirty minutes across the harbor on a public ferry — past the Opera House, Harbour Bridge, and into open water. Bring sunscreen.",
        type: "landmark",
      },
      {
        name: "Sydney Harbour Bridge climb",
        description:
          "Genuine scary in the best way. BridgeClimb has done over 4 million climbs. Book the dawn or dusk slot.",
        type: "landmark",
      },
      {
        name: "Royal Botanic Garden",
        description:
          "Free, sprawling, with Mrs Macquarie's Chair (the postcard view of Opera House and Bridge together).",
        type: "nature",
      },
      {
        name: "Blue Mountains day trip",
        description:
          "Train to Katoomba (90 min), see the Three Sisters, hike at Wentworth Falls, ride the scenic railway.",
        type: "nature",
      },
      {
        name: "Brunch in Surry Hills",
        description:
          "Single Origin, Bourke Street Bakery, Reuben Hills. Australia invented modern brunch culture; eat in its capital.",
        type: "food",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Sydney?",
        answer:
          "Four days for the city and beaches. Add a day for the Blue Mountains. A week if you want to slow down or fly to the Whitsundays.",
      },
      {
        question: "Is Sydney expensive?",
        answer:
          "Yes — among the most expensive English-speaking cities. Hotels and dining are high; public transport, beaches, and museums are reasonable.",
      },
      {
        question: "Do I need a car in Sydney?",
        answer:
          "Not for the city. Ferries, trains, buses, and Ubers cover everywhere. Rent a car only for the Blue Mountains or coastal road trips.",
      },
      {
        question: "Is Sydney safe?",
        answer:
          "Very. The main risks are sunburn (the UV is brutal — wear SPF 50) and rip currents at unpatrolled beaches.",
      },
      {
        question: "When is Sydney's beach season?",
        answer:
          "December-February is warmest and most crowded. October-April for swimmable water. Bondi locals swim year-round.",
      },
    ],
    themes: ["beach", "harbor", "outdoor", "food"],
    gradient: ["#7FA384", "#9BB59F"],
  },

  {
    slug: "reykjavik",
    name: "Reykjavik",
    country: "Iceland",
    countryCode: "IS",
    region: "Europe",
    latitude: 64.1466,
    longitude: -21.9426,
    currency: "ISK",
    language: "Icelandic",
    timezone: "Atlantic/Reykjavik",
    bestMonths: ["June", "July", "August", "September"],
    bestTimeBlurb:
      "June-August offer the midnight sun and the best weather. September-March give you northern lights chances and cheaper rates, but with cold and limited daylight.",
    avgDailyBudgetUSD: { budget: 120, mid: 280, luxury: 700 },
    heroBlurb:
      "The world's northernmost capital — colorful houses, geothermal lagoons, and the most accessible launchpad for Iceland's wild interior.",
    longDescription:
      "Reykjavik is small (130,000 people) but it's where every Iceland trip starts and ends. The city itself can be done in a day — colorful houses, the iconic Hallgrímskirkja, the harbor, the geothermal pools — but the real reason to come is everything within a 3-hour drive: waterfalls, glaciers, black-sand beaches, geysers, and the Golden Circle. Rent a car. Don't try to do the Ring Road in less than 7 days.",
    neighborhoods: [
      {
        name: "City Center (101)",
        description:
          "The historic core around Laugavegur shopping street, the harbor, and most of the city's restaurants and bars.",
      },
      {
        name: "Old Harbour",
        description:
          "Whale-watching tour departures, fish restaurants, the FlyOver Iceland experience.",
      },
      {
        name: "Grandi",
        description:
          "Recently developed waterfront with the Marshall House (contemporary art), Valdís ice cream, and design studios.",
      },
    ],
    experiences: [
      {
        name: "Blue Lagoon",
        description:
          "The famous geothermal spa. Touristy but worth it — book the earliest morning slot to beat the crowds. Stop on your way to or from the airport.",
        type: "nature",
      },
      {
        name: "Golden Circle day trip",
        description:
          "Þingvellir National Park (where the tectonic plates split), Geysir (the original geyser), Gullfoss (the waterfall). One full day, do it yourself by rental car.",
        type: "nature",
      },
      {
        name: "South Coast day trip",
        description:
          "Seljalandsfoss and Skógafoss waterfalls, Reynisfjara black-sand beach, Sólheimajökull glacier. Long drive — start at sunrise.",
        type: "nature",
      },
      {
        name: "Northern lights hunting",
        description:
          "September-March only, on clear nights away from city lights. Book a guided tour or drive yourself to Þingvellir or further out.",
        type: "nature",
      },
      {
        name: "Hallgrímskirkja",
        description:
          "The landmark concrete church inspired by Iceland's basalt columns. Take the elevator to the tower for the city view.",
        type: "landmark",
      },
      {
        name: "Sky Lagoon",
        description:
          "Newer alternative to the Blue Lagoon, with the seven-step ritual and infinity-edge ocean views. Closer to the city.",
        type: "nature",
      },
      {
        name: "Whale watching",
        description:
          "Departs from the Old Harbour. Spring and summer offer the best chances of seeing humpbacks and minkes.",
        type: "nature",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Reykjavik?",
        answer:
          "Two days for the city itself, plus 3-7 more for day trips and the southern coast. Five days total is the minimum for a satisfying Iceland trip.",
      },
      {
        question: "Is Iceland expensive?",
        answer:
          "Famously yes — among the most expensive countries in the world. Save by self-catering (grocery stores like Bonus and Krónan), drinking less alcohol, and staying outside the city for some nights.",
      },
      {
        question: "Should I rent a car?",
        answer:
          "Yes — almost always. Tours work for the Golden Circle but a car gives you the flexibility for waterfalls, hot springs, and stops along the way. A 4WD is needed for the highlands but not for the Ring Road in summer.",
      },
      {
        question: "When can I see the Northern Lights?",
        answer:
          "September through March, on clear, dark nights with high solar activity. The summer midnight sun makes them invisible from May to August.",
      },
      {
        question: "What's the deal with Icelandic food?",
        answer:
          "The seafood is exceptional (salmon, langoustine, cod). Lamb is excellent. The famous fermented shark (hákarl) is a one-time challenge, not a meal. Reykjavik also has great new-Nordic fine dining.",
      },
    ],
    themes: ["nature", "northern-lights", "hot-springs", "adventure"],
    gradient: ["#9BB59F", "#1A1A1A"],
  },

  {
    slug: "edinburgh",
    name: "Edinburgh",
    country: "Scotland",
    countryCode: "GB",
    region: "Europe",
    latitude: 55.9533,
    longitude: -3.1883,
    currency: "GBP",
    language: "English",
    timezone: "Europe/London",
    bestMonths: ["May", "June", "August", "September"],
    bestTimeBlurb:
      "May-September is the only reasonable window. August is the Festival — magical but utterly packed and expensive. May-June and September are the sweet spots.",
    avgDailyBudgetUSD: { budget: 90, mid: 200, luxury: 500 },
    heroBlurb:
      "A medieval Old Town and a Georgian New Town stacked into one of Europe's most atmospheric capitals.",
    longDescription:
      "Edinburgh is a small city that feels much bigger because the history is so dense. The Old Town's tangle of medieval closes and wynds climbs up the Royal Mile to the castle; below, the elegant Georgian grid of the New Town offers wide boulevards and proper afternoon tea. Three days is enough to see most of it. Time your visit for the Edinburgh Festival in August if you love theater (and don't mind the crush) or come in May for the city without the chaos.",
    neighborhoods: [
      {
        name: "Old Town",
        description:
          "The Royal Mile from the castle to Holyrood Palace. Medieval closes, ghost tours, and the best concentration of pubs.",
      },
      {
        name: "New Town",
        description:
          "Georgian grid laid out in the 18th century. Princes Street, the gardens, and the city's smartest shopping and dining.",
      },
      {
        name: "Stockbridge",
        description:
          "Charming village-y neighborhood north of the New Town. Sunday farmers market, indie shops, and the Water of Leith walk.",
      },
      {
        name: "Leith",
        description:
          "The historic port, once gritty, now home to the city's best restaurants and the Royal Yacht Britannia.",
      },
      {
        name: "Bruntsfield",
        description:
          "Residential, walkable south of the city center. Best for budget-conscious stays with good cafés.",
      },
    ],
    experiences: [
      {
        name: "Edinburgh Castle",
        description:
          "Atop Castle Rock, with the Crown Jewels of Scotland and the One O'Clock Gun. Buy timed tickets online.",
        type: "landmark",
      },
      {
        name: "Walk the Royal Mile",
        description:
          "From the castle down to Holyrood Palace through the medieval Old Town. Detour into closes and try a whisky tasting.",
        type: "neighborhood",
      },
      {
        name: "Arthur's Seat",
        description:
          "Extinct volcano in the city. Forty-five minutes up, vast view from the top. Wear shoes with grip — the path is rocky.",
        type: "nature",
      },
      {
        name: "Real Mary King's Close",
        description:
          "Underground tour of the buried medieval streets beneath the Royal Mile. Atmospheric and surprisingly substantial.",
        type: "culture",
      },
      {
        name: "Whisky tasting",
        description:
          "The Scotch Whisky Experience on the Royal Mile is touristy but a good intro. SMWS members' room or Devil's Advocate for the real deal.",
        type: "food",
      },
      {
        name: "Day trip to the Highlands",
        description:
          "Long day — 12 hours by tour bus or rental car. Glencoe, Loch Ness, and Glenfinnan (the Harry Potter viaduct).",
        type: "nature",
      },
      {
        name: "Edinburgh Festival",
        description:
          "August only. The Fringe, the International Festival, and the Tattoo at the castle. Book accommodation 6+ months ahead.",
        type: "culture",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Edinburgh?",
        answer:
          "Three days covers the city well. Add one or two for a Highlands or St Andrews day trip.",
      },
      {
        question: "Should I visit during the August Festival?",
        answer:
          "If you love theater and energy — yes. If you hate crowds and high prices — no. The Festival doubles every cost in the city.",
      },
      {
        question: "Is the weather as bad as people say?",
        answer:
          "It rains, often briefly, even in summer. Pack a light rain jacket and assume you'll need it. Sunny Edinburgh days are magical.",
      },
      {
        question: "Is Edinburgh walkable?",
        answer:
          "Very — and it's small. You can walk between most attractions in 20 minutes, but the hills are real. Wear comfortable shoes.",
      },
      {
        question: "What's the food like?",
        answer:
          "Scottish food has had a renaissance — Tom Kitchin, The Witchery, and Timberyard are world-class. Try haggis at least once and you'll likely be surprised.",
      },
    ],
    themes: ["history", "architecture", "whisky", "festivals"],
    gradient: ["#425744", "#1A1A1A"],
  },

  {
    slug: "florence",
    name: "Florence",
    country: "Italy",
    countryCode: "IT",
    region: "Europe",
    latitude: 43.7696,
    longitude: 11.2558,
    currency: "EUR",
    language: "Italian",
    timezone: "Europe/Rome",
    bestMonths: ["April", "May", "September", "October"],
    bestTimeBlurb:
      "Spring and fall are gorgeous — warm, blooming, and free of August's furnace. Avoid mid-summer if you can; the heat is genuinely oppressive.",
    avgDailyBudgetUSD: { budget: 80, mid: 180, luxury: 480 },
    heroBlurb:
      "The cradle of the Renaissance — Michelangelo's David, Brunelleschi's dome, and the world's best concentration of art per square mile.",
    longDescription:
      "Florence is a small city (380,000 people) that contains a disproportionate share of Western art history. The Uffizi alone holds Botticelli's Birth of Venus and dozens of other Renaissance masterpieces; the Accademia has the original David; the Duomo's dome was an engineering miracle when Brunelleschi built it in 1436. The historic center is small enough to walk in a day but rewards a few days of slowing down with wine, pasta, and Tuscan light.",
    neighborhoods: [
      {
        name: "Centro Storico",
        description:
          "The UNESCO-listed historic center with the Duomo, Uffizi, and Ponte Vecchio. Touristy but the only logical first-time base.",
      },
      {
        name: "Oltrarno",
        description:
          "South of the Arno — Pitti Palace, Boboli Gardens, artisan workshops, and the best traditional trattorias.",
      },
      {
        name: "Santo Spirito",
        description:
          "Bohemian piazza in Oltrarno with a leafy square, evening aperitivo crowds, and great Florentine cooking at La Casalinga.",
      },
      {
        name: "San Niccolò",
        description:
          "Quiet neighborhood under the city walls with cocktail bars, Piazzale Michelangelo nearby, and tiny artisan shops.",
      },
    ],
    experiences: [
      {
        name: "Uffizi Gallery",
        description:
          "Botticelli's Birth of Venus, da Vinci's Annunciation, Caravaggio's Medusa. Book a timed entry online — same-day tickets are nearly impossible.",
        type: "culture",
      },
      {
        name: "Accademia (David)",
        description:
          "Michelangelo's David is bigger and more arresting in person than any photo prepares you for. Reserve tickets in advance.",
        type: "culture",
      },
      {
        name: "Brunelleschi's Dome",
        description:
          "Climb the 463 steps inside the cupola for an immersive view of the engineering and the city. Book in advance.",
        type: "landmark",
      },
      {
        name: "Ponte Vecchio at sunset",
        description:
          "The medieval bridge of jewelers. Walk it, then view it from Ponte Santa Trinita next door for the better photo.",
        type: "landmark",
      },
      {
        name: "Piazzale Michelangelo",
        description:
          "Hilltop terrace with the city's iconic panorama. Walk up for golden hour and stay for the sunset.",
        type: "nature",
      },
      {
        name: "Bistecca alla Fiorentina",
        description:
          "The famous T-bone steak — order it at Trattoria Mario, Buca Lapi, or Trattoria Sostanza. Sold by weight, served rare.",
        type: "food",
      },
      {
        name: "Day trip to Siena and San Gimignano",
        description:
          "Tuscan hilltop towns an hour by bus. Book a small group tour or rent a car to combine with a winery stop in Chianti.",
        type: "neighborhood",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Florence?",
        answer:
          "Three days hits the major art and the historic center. Four lets you slow down, eat better, and add a Tuscan day trip.",
      },
      {
        question: "Do I need to book the Uffizi in advance?",
        answer:
          "Absolutely. Walk-up lines can be 2-3 hours. Reserve on the official site (Booking.uffizi.it) at least a week ahead.",
      },
      {
        question: "Is Florence walkable?",
        answer:
          "Yes — the historic center is tiny and almost entirely pedestrian. You won't need transit at all.",
      },
      {
        question: "When should I avoid Florence?",
        answer:
          "August: brutal heat and many trattorias close for vacation. November-February: cold and gray.",
      },
      {
        question: "Where should I stay in Florence?",
        answer:
          "Centro Storico for first-time convenience. Oltrarno for quieter charm and easier dinner reservations.",
      },
    ],
    themes: ["art", "architecture", "food", "wine"],
    gradient: ["#7D3218", "#C4522A"],
  },

  {
    slug: "vienna",
    name: "Vienna",
    country: "Austria",
    countryCode: "AT",
    region: "Europe",
    latitude: 48.2082,
    longitude: 16.3738,
    currency: "EUR",
    language: "German",
    timezone: "Europe/Vienna",
    bestMonths: ["April", "May", "June", "September", "October", "December"],
    bestTimeBlurb:
      "Late spring and early fall for Vienna at its leafiest. December for the famous Christmas markets — magical but cold.",
    avgDailyBudgetUSD: { budget: 90, mid: 200, luxury: 500 },
    heroBlurb:
      "Imperial palaces, world-class concerts, the most famous cafés in Europe, and a quality of life that consistently tops global rankings.",
    longDescription:
      "Vienna was the capital of an empire that stretched from the Alps to the Adriatic, and its scale, grandeur, and confidence still reflect that. The Ringstraße loops around the historic center past the Hofburg, the State Opera, the Parliament, and the Hofgarten. The city is impeccably organized, museum-rich, and built around coffee-house culture (the Kaffeehaus is a UNESCO-recognized institution). Spend mornings on Klimt and Schiele, afternoons in cafés, and evenings at a Wiener Schnitzel dinner or a cheap student standing-room ticket at the Staatsoper.",
    neighborhoods: [
      {
        name: "Innere Stadt (1st District)",
        description:
          "The historic core inside the Ringstraße — Stephansdom cathedral, Hofburg, all the major museums.",
      },
      {
        name: "Neubau (7th District)",
        description:
          "Hipper, younger neighborhood with the MuseumsQuartier, indie boutiques, and the city's best independent cafés.",
      },
      {
        name: "Leopoldstadt (2nd District)",
        description:
          "Across the canal — Augarten park, the Prater amusement park, and emerging restaurant scene.",
      },
      {
        name: "Wieden (4th District)",
        description:
          "The Naschmarkt food market and a relaxed mix of locals and visitors. Great for an afternoon wander.",
      },
    ],
    experiences: [
      {
        name: "Schönbrunn Palace",
        description:
          "The Habsburg summer palace. Book the Imperial Tour, walk the gardens up to the Gloriette for the panoramic view.",
        type: "landmark",
      },
      {
        name: "Belvedere Palace (Klimt)",
        description:
          "Home to Klimt's The Kiss and other gold-period masterpieces. Plus the palace itself is a Baroque jewel.",
        type: "culture",
      },
      {
        name: "Kunsthistorisches Museum",
        description:
          "Bruegel's Tower of Babel, Vermeer's Art of Painting, and one of the great encyclopedic European collections.",
        type: "culture",
      },
      {
        name: "Opera at the Staatsoper",
        description:
          "Book in advance, or queue for €15 standing-room tickets sold 80 minutes before showtime. Either is unforgettable.",
        type: "culture",
      },
      {
        name: "Vienna coffee house",
        description:
          "Café Central, Café Sperl, Café Demel, Café Hawelka — each is a Viennese institution. Order a Melange and a slice of Sachertorte.",
        type: "food",
      },
      {
        name: "Naschmarkt",
        description:
          "Long open-air market with Middle Eastern, Asian, and traditional Viennese stalls. Best on Saturday morning for the flea market alongside it.",
        type: "food",
      },
      {
        name: "Heuriger in Grinzing",
        description:
          "Take tram 38 to the wine villages on Vienna's edge. Heurige are family wine taverns serving the year's young wine and cold platters.",
        type: "food",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Vienna?",
        answer:
          "Three days is the minimum for the headline art and palaces. Four lets you breathe, hit a Heuriger, and explore Neubau.",
      },
      {
        question: "Is Vienna expensive?",
        answer:
          "Mid-priced for Western Europe — cheaper than Paris and London, similar to Berlin. Public transit is excellent and museum entry is the main cost.",
      },
      {
        question: "Do I need to speak German?",
        answer:
          "No. English is widely spoken in tourism, hospitality, and most shops. A polite 'Grüß Gott' (hello) goes a long way.",
      },
      {
        question: "When are the Christmas markets?",
        answer:
          "Mid-November through Christmas Eve. The Rathausplatz market is the most famous; Spittelberg and Schönbrunn are more atmospheric.",
      },
      {
        question: "Should I get a Vienna Pass?",
        answer:
          "Only if you're hitting many ticketed attractions in 2-3 days. For most travelers, individual tickets and a Wiener Linien transit pass are better value.",
      },
    ],
    themes: ["art", "music", "architecture", "coffee"],
    gradient: ["#7D3218", "#425744"],
  },

  {
    slug: "berlin",
    name: "Berlin",
    country: "Germany",
    countryCode: "DE",
    region: "Europe",
    latitude: 52.52,
    longitude: 13.405,
    currency: "EUR",
    language: "German",
    timezone: "Europe/Berlin",
    bestMonths: ["May", "June", "July", "August", "September"],
    bestTimeBlurb:
      "Berlin truly comes alive in summer — beer gardens, lakes, open-air clubbing. Spring and early fall are also lovely. Winter is cold and gray; only come in December for Weihnachtsmärkte.",
    avgDailyBudgetUSD: { budget: 75, mid: 170, luxury: 420 },
    heroBlurb:
      "Europe's most affordable major capital — a city of layered history, world-class clubs, and creative energy that hasn't been priced out yet.",
    longDescription:
      "Berlin is a city in constant rebellion against polish. The history is everywhere — the Wall, the bunkers, the bombed-and-rebuilt churches — but so is a creative scene that has made the city the cultural capital of Europe for the under-40 set. Stay in Mitte, Kreuzberg, or Neukölln; eat döner kebab from a Turkish stand; spend an afternoon at Museum Island; and at least one evening in a bar that might still be open at 8am the next day.",
    neighborhoods: [
      {
        name: "Mitte",
        description:
          "The historic center — Brandenburg Gate, Museum Island, Reichstag, the best concentration of attractions for first-timers.",
      },
      {
        name: "Kreuzberg",
        description:
          "Turkish heritage, immigrant cool, the best döner and the most famous club (Berghain on the eastern edge).",
      },
      {
        name: "Neukölln",
        description:
          "Sister to Kreuzberg, even more bohemian — cafés, art spaces, and the Tempelhofer Feld park (a former airport).",
      },
      {
        name: "Prenzlauer Berg",
        description:
          "Once-radical East Berlin neighborhood now polished and family-friendly. Cobblestones, indie boutiques, Sunday brunches.",
      },
      {
        name: "Friedrichshain",
        description:
          "Former East with the East Side Gallery (the painted Wall section) and Berlin's wildest nightlife around Warschauer Strasse.",
      },
    ],
    experiences: [
      {
        name: "Brandenburg Gate & Reichstag",
        description:
          "The iconic gate and the dome of the German parliament. Book the Reichstag dome free in advance — it's worth it for the view.",
        type: "landmark",
      },
      {
        name: "Memorial to the Murdered Jews of Europe",
        description:
          "Peter Eisenman's field of 2,711 concrete stelae. The underground information center is essential.",
        type: "culture",
      },
      {
        name: "Museum Island",
        description:
          "Five major museums on a UNESCO-listed island — the Pergamon (when reopened), the Neues, the Altes, the Bode. The Pergamon Altar and the Bust of Nefertiti are the highlights.",
        type: "culture",
      },
      {
        name: "East Side Gallery",
        description:
          "1.3km of the Berlin Wall covered in murals along the Spree. Free, open-air, and surprisingly moving.",
        type: "culture",
      },
      {
        name: "Berghain (or trying)",
        description:
          "The world's most famous techno club. Notoriously selective at the door; dress in black, go in small groups, don't speak English in line.",
        type: "nightlife",
      },
      {
        name: "Tempelhofer Feld",
        description:
          "Former airport turned vast public park. Bike the runways, BBQ in the meadows, watch kite-surfers.",
        type: "nature",
      },
      {
        name: "Currywurst & döner",
        description:
          "Curry 36 (Kreuzberg) for currywurst, Mustafa's Gemüse Kebap (Mehringdamm) for the city's most famous döner. Both worth the queue.",
        type: "food",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Berlin?",
        answer:
          "Four days minimum — there's a lot of history to absorb and the city sprawls. A week lets you explore neighborhoods and not feel rushed.",
      },
      {
        question: "Is Berlin cheap?",
        answer:
          "Cheaper than Paris, London, or Amsterdam. Hotels, food, and drinks are reasonable; museums are well priced.",
      },
      {
        question: "Is Berlin safe?",
        answer:
          "Yes, with normal big-city precautions. Even the famously edgy clubs and bar areas are safe to walk around.",
      },
      {
        question: "How is the public transport?",
        answer:
          "Excellent. U-Bahn, S-Bahn, trams, buses — all run on the same ticket. Buy a daily or weekly pass and use it freely.",
      },
      {
        question: "Should I learn German?",
        answer:
          "Helpful but not essential. English fluency in Berlin is among the highest in Germany — most service workers under 40 speak it well.",
      },
    ],
    themes: ["history", "nightlife", "art", "affordable"],
    gradient: ["#2D2D2D", "#425744"],
  },

  {
    slug: "copenhagen",
    name: "Copenhagen",
    country: "Denmark",
    countryCode: "DK",
    region: "Europe",
    latitude: 55.6761,
    longitude: 12.5683,
    currency: "DKK",
    language: "Danish",
    timezone: "Europe/Copenhagen",
    bestMonths: ["May", "June", "July", "August", "September"],
    bestTimeBlurb:
      "Late spring through early fall is when Copenhagen unfolds — long daylight, harbor swimming, café terraces. Winter is dark and the city closes up early.",
    avgDailyBudgetUSD: { budget: 110, mid: 250, luxury: 600 },
    heroBlurb:
      "Compact, bike-mad, design-obsessed — and home to more Michelin stars per capita than any city in Scandinavia.",
    longDescription:
      "Copenhagen is the model for what a 21st-century city can look like — clean, walkable, bikeable, with a public realm that prioritizes humans over cars. The Danish concept of hygge is real: it shows up in the candle-lit cafés, the harbor sauna culture, the polite quiet on the trains. Spend three days here exploring on foot and bike, eating at smørrebrød counters and new-Nordic restaurants, and swimming in the genuinely clean harbor in summer.",
    neighborhoods: [
      {
        name: "Indre By (City Center)",
        description:
          "The historic core with the pedestrian Strøget, royal palaces, Tivoli, and the tightest concentration of attractions.",
      },
      {
        name: "Nørrebro",
        description:
          "Hip, multicultural, with the city's coolest bars and cafés. Jægersborggade is the must-walk street.",
      },
      {
        name: "Vesterbro",
        description:
          "Former meatpacking district now full of restaurants, bars, and boutiques. Stay here for an evening scene without Indre By prices.",
      },
      {
        name: "Christianshavn",
        description:
          "Canal-laced 17th-century neighborhood. Houseboats, Noma, the alternative free city of Christiania.",
      },
      {
        name: "Østerbro",
        description:
          "Quiet, residential, family-friendly. Stay here for a more local experience and easy access to the harbor swims.",
      },
    ],
    experiences: [
      {
        name: "Nyhavn",
        description:
          "The famous colored 17th-century townhouses along the canal. Touristy but unmissable. Get a beer at the harbor edge.",
        type: "landmark",
      },
      {
        name: "Tivoli Gardens",
        description:
          "The world's second-oldest amusement park, dating to 1843. Magical at dusk when the lights come on.",
        type: "landmark",
      },
      {
        name: "Christiania",
        description:
          "The 'free city' that's been a self-governing community since 1971. Pusher Street is famous (and not for the right reasons); the rest is leafy and surprising.",
        type: "neighborhood",
      },
      {
        name: "Harbor swimming",
        description:
          "Yes, the harbor is clean enough to swim in. Islands Brygge and Sandkaj have free public baths in summer.",
        type: "nature",
      },
      {
        name: "Bike around the city",
        description:
          "Copenhagen is the world's most bike-friendly capital. Rent a Donkey Republic or Swapfiets and ride everywhere.",
        type: "neighborhood",
      },
      {
        name: "Smørrebrød lunch",
        description:
          "Open-faced rye bread sandwiches — Aamanns 1921, Schønnemann, or Ida Davidsen. The classic Copenhagen lunch.",
        type: "food",
      },
      {
        name: "Louisiana Museum of Modern Art",
        description:
          "Forty minutes by train up the coast. Sculpture park overlooking the sea, world-class contemporary collection. Worth the day.",
        type: "culture",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Copenhagen?",
        answer:
          "Three days for the city, plus a day for Louisiana Museum or Helsingør (Hamlet's castle). Four days total is the sweet spot.",
      },
      {
        question: "Is Copenhagen expensive?",
        answer:
          "Yes — among the most expensive cities in Europe for restaurants and alcohol. Save by self-catering breakfast, biking instead of taxis, and hitting smørrebrød lunches instead of dinners.",
      },
      {
        question: "Should I rent a bike?",
        answer:
          "Yes — Copenhagen makes you a confident cyclist within an hour. The infrastructure is the best in the world. Use Donkey Republic or Bycyklen (the city bike).",
      },
      {
        question: "Do I need cash in Copenhagen?",
        answer:
          "No — the city is essentially cashless. Cards (and Apple Pay) work everywhere. Bring DKK 200 only as a backup.",
      },
      {
        question: "When is the best time to visit?",
        answer:
          "June and July deliver the long daylight (sunset at 10pm) and harbor swimming weather. September is also lovely with thinner crowds.",
      },
    ],
    themes: ["design", "food", "cycling", "modern"],
    gradient: ["#9BB59F", "#7FA384"],
  },

  {
    slug: "hong-kong",
    name: "Hong Kong",
    country: "Hong Kong",
    countryCode: "HK",
    region: "Asia",
    latitude: 22.3193,
    longitude: 114.1694,
    currency: "HKD",
    language: "Cantonese & English",
    timezone: "Asia/Hong_Kong",
    bestMonths: ["October", "November", "December", "March", "April"],
    bestTimeBlurb:
      "Late autumn and early spring deliver Hong Kong at its most pleasant — dry, mild, and clear. Avoid the summer typhoons and humidity.",
    avgDailyBudgetUSD: { budget: 80, mid: 200, luxury: 550 },
    heroBlurb:
      "The world's most vertical city, where 7 million people stack onto a string of mountainous islands — and serve the world's best dim sum.",
    longDescription:
      "Hong Kong is geography you wouldn't believe in a film — green peaks, dense skyscrapers, ferries crossing Victoria Harbour, hiking trails 30 minutes from the financial district. Spend your days alternating between the iconic city core (Central, Tsim Sha Tsui, the Peak), traditional neighborhoods like Sham Shui Po and Mong Kok, and the surprisingly accessible nature on Lantau Island and the New Territories. Eat dim sum, ride the Star Ferry, and walk the Mid-Levels escalator down the hill at sunset.",
    neighborhoods: [
      {
        name: "Central",
        description:
          "The financial heart of Hong Kong on the island. Skyscrapers, the Mid-Levels escalator, IFC mall, and walking access to most things.",
      },
      {
        name: "Tsim Sha Tsui (Kowloon)",
        description:
          "Across Victoria Harbour, with the city's best skyline view (looking back at the island), the Star Ferry pier, and the Avenue of Stars.",
      },
      {
        name: "Sheung Wan",
        description:
          "Old neighborhood west of Central — antique shops, dried seafood markets, cool cafés on Tai Ping Shan Street.",
      },
      {
        name: "Mong Kok",
        description:
          "Densest neighborhood on Earth. Markets, neon, street food, the Ladies' Market. Pure Hong Kong intensity.",
      },
      {
        name: "Sham Shui Po",
        description:
          "Working-class Kowloon district with the city's best traditional food and electronics markets. Off the tourist track.",
      },
    ],
    experiences: [
      {
        name: "Victoria Peak",
        description:
          "Take the Peak Tram to the top of the island. Skip the touristy Sky Terrace and walk the free Lugard Road loop for the better view.",
        type: "landmark",
      },
      {
        name: "Star Ferry",
        description:
          "Cross Victoria Harbour from Central to Tsim Sha Tsui for HK$4. The cheapest great experience in the city.",
        type: "landmark",
      },
      {
        name: "Dim sum at Tim Ho Wan",
        description:
          "The world's cheapest Michelin-starred restaurant. Order the BBQ pork buns and the rice noodle rolls.",
        type: "food",
      },
      {
        name: "Tian Tan Buddha & Po Lin Monastery",
        description:
          "Take the Ngong Ping cable car on Lantau Island to a 34m bronze Buddha and a working monastery. Make a half-day of it.",
        type: "landmark",
      },
      {
        name: "Dragon's Back hike",
        description:
          "Easy 4km ridge hike with views of the South China Sea, ending at Big Wave Bay for a swim. Surprisingly close to Central.",
        type: "nature",
      },
      {
        name: "Temple Street Night Market",
        description:
          "Kowloon's after-dark market — fortune tellers, dai pai dong (open-air food stalls), and counterfeit watches. Energy first, shopping second.",
        type: "shopping",
      },
      {
        name: "Symphony of Lights",
        description:
          "Free harbor light show every night at 8pm. Watch from the Avenue of Stars in Tsim Sha Tsui.",
        type: "landmark",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Hong Kong?",
        answer:
          "Three full days hits the highlights, including a Lantau or hiking day. Four to five lets you slow down and explore the New Territories or Macau.",
      },
      {
        question: "Is Hong Kong expensive?",
        answer:
          "Hotels are pricey — among the highest in Asia. But food is excellent value (dim sum, noodles, local restaurants), and public transit is cheap.",
      },
      {
        question: "How is the public transport?",
        answer:
          "World-class. The MTR is fast, clean, and reaches everywhere. Buy an Octopus card on arrival for the metro, buses, ferries, and even convenience stores.",
      },
      {
        question: "Do I need to speak Cantonese?",
        answer:
          "No — English is an official language and widely spoken in business and tourism. Outside the central districts, basic Cantonese phrases help.",
      },
      {
        question: "When should I avoid Hong Kong?",
        answer:
          "July-September: hot, humid, and typhoon-prone. Hotels are cheaper but the weather can shut down activities.",
      },
    ],
    themes: ["food", "skyline", "shopping", "nature"],
    gradient: ["#1A1A1A", "#C4522A"],
  },

  {
    slug: "istanbul",
    name: "Istanbul",
    country: "Türkiye",
    countryCode: "TR",
    region: "Middle East",
    latitude: 41.0082,
    longitude: 28.9784,
    currency: "TRY",
    language: "Turkish",
    timezone: "Europe/Istanbul",
    bestMonths: ["April", "May", "September", "October"],
    bestTimeBlurb:
      "Spring and fall are perfect — warm, dry, and free of the summer crowds at Hagia Sophia and the Grand Bazaar.",
    avgDailyBudgetUSD: { budget: 50, mid: 130, luxury: 400 },
    heroBlurb:
      "The only city on two continents — Byzantine cathedrals, Ottoman mosques, the Bosphorus, and the world's greatest bazaar.",
    longDescription:
      "Istanbul straddles Europe and Asia across the Bosphorus and has been a capital of empires for nearly 2,000 years. Hagia Sophia, the Blue Mosque, Topkapı Palace, and the Grand Bazaar are all within walking distance in the historic Sultanahmet district. The contemporary city across the Golden Horn — Beyoğlu, Karaköy, Galata — has the best food, bars, and design hotels. Take a Bosphorus ferry, eat your way through the markets, and embrace the call to prayer drifting across the city five times a day.",
    neighborhoods: [
      {
        name: "Sultanahmet",
        description:
          "The historic peninsula. Hagia Sophia, the Blue Mosque, Topkapı, Basilica Cistern, the Grand Bazaar — all within walking distance.",
      },
      {
        name: "Beyoğlu (Galata, Karaköy)",
        description:
          "The cosmopolitan modern center across the Golden Horn. Galata Tower, İstiklal Avenue, the city's best dining and nightlife.",
      },
      {
        name: "Beşiktaş & Ortaköy",
        description:
          "Bosphorus-front neighborhoods with cafés on the water and the iconic Ortaköy Mosque under the bridge.",
      },
      {
        name: "Kadıköy (Asian side)",
        description:
          "Across the water on the Asian continent. Hipster cafés, markets, no tourists. Take the ferry over for an afternoon.",
      },
      {
        name: "Balat & Fener",
        description:
          "The old Greek and Jewish quarters along the Golden Horn. Painted houses, antique shops, Instagram-worthy without being polished.",
      },
    ],
    experiences: [
      {
        name: "Hagia Sophia",
        description:
          "1,500-year-old former cathedral, then mosque, then museum, now mosque again. The interior is breathtaking. Free; cover hair (women) and shoulders.",
        type: "landmark",
      },
      {
        name: "Blue Mosque",
        description:
          "Sultan Ahmed Mosque — six minarets and 20,000 hand-painted blue tiles. Free, but closed during prayer times.",
        type: "landmark",
      },
      {
        name: "Topkapı Palace",
        description:
          "Ottoman royal residence for 400 years. Don't skip the Harem (separate ticket) — it's the most atmospheric part.",
        type: "landmark",
      },
      {
        name: "Grand Bazaar",
        description:
          "4,000 shops in 60 covered streets. Carpets, jewelry, ceramics, leather. Bargain hard, accept the tea, walk away if needed.",
        type: "shopping",
      },
      {
        name: "Bosphorus ferry",
        description:
          "Take the public ferry to Anadolu Kavağı (90 minutes each way). Cheap, scenic, no tourist trap.",
        type: "nature",
      },
      {
        name: "Turkish bath (hammam)",
        description:
          "Çemberlitaş Hamamı (built 1584) is the most atmospheric historic option. Newer hammams are less authentic but more comfortable.",
        type: "culture",
      },
      {
        name: "Spice Bazaar & street food crawl",
        description:
          "Eminönü's spice bazaar, plus the surrounding street food — balık ekmek (fish sandwiches at the Galata Bridge) and Turkish delight stalls.",
        type: "food",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Istanbul?",
        answer:
          "Four days minimum. Three is rushed; five lets you see both the historic core and the contemporary city without sprinting.",
      },
      {
        question: "Is Istanbul safe?",
        answer:
          "Generally yes, with normal big-city precautions. Watch for pickpockets in the Grand Bazaar and around tourist sites. Avoid obvious tourist scams (shoe-shiners, restaurant touts).",
      },
      {
        question: "What's the deal with the Turkish lira?",
        answer:
          "High inflation has made Turkey extremely affordable for foreign visitors. Use a card with no foreign transaction fees and pay in lira, not dollars.",
      },
      {
        question: "Do I need to dress modestly?",
        answer:
          "Only at mosques (women cover hair and shoulders, everyone covers knees). Elsewhere, normal Western dress is fine.",
      },
      {
        question: "Should I hire a guide for the historic sites?",
        answer:
          "Yes — Hagia Sophia and Topkapı reward an expert telling you what you're seeing. Book a half-day private guide through Withlocals or a reputable agency.",
      },
    ],
    themes: ["history", "food", "shopping", "culture"],
    gradient: ["#7D3218", "#C4522A"],
  },

  // ============================================================
  // EUROPE — round 2
  // ============================================================
  {
    slug: "madrid",
    name: "Madrid",
    country: "Spain",
    countryCode: "ES",
    region: "Europe",
    latitude: 40.4168,
    longitude: -3.7038,
    currency: "EUR",
    language: "Spanish",
    timezone: "Europe/Madrid",
    bestMonths: ["April", "May", "June", "September", "October"],
    bestTimeBlurb:
      "Spring and fall are perfect — warm days, cool evenings, and the city buzzing with terrace life. Avoid August: locals leave town and the heat is brutal.",
    avgDailyBudgetUSD: { budget: 70, mid: 160, luxury: 420 },
    heroBlurb:
      "Spain's high-altitude capital — the world's best art museums, late-night tapas culture, and rooftop bars overlooking the royal palace.",
    longDescription:
      "Madrid is what Spain's capital should be: confident, late-night, art-obsessed, and built for walking between great meals. The Golden Triangle of Art (Prado, Reina Sofía, Thyssen-Bornemisza) is one of the densest concentrations of masterpieces on Earth. The city eats lunch at 3pm, dinner at 10pm, and goes out at 1am — match the rhythm and you'll see why Madrileños think Barcelona is for tourists.",
    neighborhoods: [
      {
        name: "Sol & Centro",
        description:
          "The historic heart with Puerta del Sol, Plaza Mayor, and the Royal Palace. Touristy but central and walkable to everything.",
      },
      {
        name: "La Latina",
        description:
          "Tapas crawl central, especially on Sunday mornings after the El Rastro flea market. Cava Baja is the famous tapas street.",
      },
      {
        name: "Malasaña",
        description:
          "Bohemian, vintage, the city's coolest indie scene. Cafés, concept stores, and great cocktail bars.",
      },
      {
        name: "Chueca",
        description:
          "Madrid's queer heart with the best brunch spots, neighborhood bars, and rooftop pools.",
      },
      {
        name: "Salamanca",
        description:
          "The polished side of Madrid — designer shopping, gourmet restaurants, and grand 19th-century apartments.",
      },
    ],
    experiences: [
      {
        name: "Museo del Prado",
        description:
          "Velázquez, Goya, El Greco, Bosch — one of the great European collections. Plan three hours minimum.",
        type: "culture",
      },
      {
        name: "Reina Sofía",
        description:
          "Modern art museum with Picasso's Guernica as the centerpiece. Often quieter than the Prado.",
        type: "culture",
      },
      {
        name: "Mercado de San Miguel",
        description:
          "Beautiful iron-and-glass food market by Plaza Mayor. Touristy but a great gateway tasting tour for first-timers.",
        type: "food",
      },
      {
        name: "Tapas crawl in La Latina",
        description:
          "Hop between Casa Lucio, Juana la Loca, and Taberna La Concha. Order cañas (small beers) and grazing plates.",
        type: "food",
      },
      {
        name: "Retiro Park",
        description:
          "Madrid's Central Park. Rent a rowboat on the lake, see the Crystal Palace, picnic on the grass.",
        type: "nature",
      },
      {
        name: "Royal Palace & Plaza de Oriente",
        description:
          "Europe's largest royal palace by floor area. The official tour is solid; the sunset view from Plaza de Oriente is free.",
        type: "landmark",
      },
      {
        name: "Flamenco at Corral de la Morería",
        description:
          "The world's most famous tablao. Touristy but the dancing is legitimately world-class. Book the dinner show.",
        type: "culture",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Madrid?",
        answer:
          "Three days hits the major museums and key neighborhoods. Add one day for a Toledo or Segovia day trip.",
      },
      {
        question: "Madrid or Barcelona?",
        answer:
          "Different vibes. Barcelona has the beach and Gaudí; Madrid has better museums, late-night life, and feels more authentically Spanish. Do both if you can — they're 2.5 hours apart by AVE train.",
      },
      {
        question: "What time do people eat in Madrid?",
        answer:
          "Late. Lunch is 2-4pm; dinner rarely starts before 9pm. Restaurants serving tourists at 7pm are usually mediocre — wait until 9 and eat where the locals do.",
      },
      {
        question: "Is Madrid expensive?",
        answer:
          "Cheaper than Paris, Amsterdam, or London. Cañas cost €2, tapas €3-5, full meals €25-40. Hotels are reasonable; museum entries are mostly under €15.",
      },
      {
        question: "Do I need to book the Prado in advance?",
        answer:
          "Recommended in season. Free entry for the last two hours daily (6-8pm Mon-Sat, 5-7pm Sun) — but expect long lines.",
      },
    ],
    themes: ["art", "food", "nightlife", "tapas"],
    gradient: ["#C4522A", "#7D3218"],
  },

  {
    slug: "athens",
    name: "Athens",
    country: "Greece",
    countryCode: "GR",
    region: "Europe",
    latitude: 37.9838,
    longitude: 23.7275,
    currency: "EUR",
    language: "Greek",
    timezone: "Europe/Athens",
    bestMonths: ["April", "May", "September", "October"],
    bestTimeBlurb:
      "Spring and early fall avoid the brutal July-August heat and the worst tourist crush. May and October are particularly lovely.",
    avgDailyBudgetUSD: { budget: 55, mid: 140, luxury: 380 },
    heroBlurb:
      "The original Western capital — the Acropolis, world-class museums, and a contemporary food scene that quietly rivals Lisbon's.",
    longDescription:
      "Athens has been undersold for years. Yes, the city is chaotic and not particularly pretty in the way Paris or Rome are pretty — but the Acropolis is genuinely overwhelming, the Acropolis Museum is one of the best modern museums in Europe, and the Plaka and Anafiotika neighborhoods feel like Greek island villages dropped in the middle of the city. The food has had a renaissance, and the prices are still reasonable. Three days is enough; pair it with islands.",
    neighborhoods: [
      {
        name: "Plaka",
        description:
          "Old town directly under the Acropolis. Cobblestoned, touristy but charming, with the best concentration of restaurants for first-time visitors.",
      },
      {
        name: "Monastiraki",
        description:
          "Flea market square next to Plaka. Great street food, rooftop bars with Acropolis views, and the Sunday antique market.",
      },
      {
        name: "Koukaki",
        description:
          "Up-and-coming residential neighborhood south of the Acropolis. Hip cafés, small hotels, and a 5-minute walk to the museum.",
      },
      {
        name: "Exarcheia",
        description:
          "The city's bohemian, anarchist, slightly edgy student district. Cheap eats, indie bookshops, political street art.",
      },
      {
        name: "Kolonaki",
        description:
          "Polished and upscale district near the National Garden. Designer shops, art galleries, and the funicular up Lycabettus.",
      },
    ],
    experiences: [
      {
        name: "Acropolis & Parthenon",
        description:
          "The 5th-century BC marble citadel above the city. Buy timed tickets in advance and go early morning to beat the heat.",
        type: "landmark",
      },
      {
        name: "Acropolis Museum",
        description:
          "Modern museum at the foot of the Acropolis with the surviving sculptures and friezes. The glass floor reveals ancient ruins below.",
        type: "culture",
      },
      {
        name: "Ancient Agora",
        description:
          "Where Socrates argued with Plato. Quieter than the Acropolis itself, with the perfectly preserved Temple of Hephaestus.",
        type: "landmark",
      },
      {
        name: "Anafiotika",
        description:
          "A tiny whitewashed Cycladic village built into the slope below the Acropolis. Easy to miss; magical when you find it.",
        type: "neighborhood",
      },
      {
        name: "Mount Lycabettus sunset",
        description:
          "Take the funicular up for the best panorama of the city, the Parthenon glowing in the evening light.",
        type: "nature",
      },
      {
        name: "Souvlaki & gyros crawl",
        description:
          "Kostas (the famous one in Plaka), Bairaktaris, Thanasis. Cheap, fast, and outrageously good.",
        type: "food",
      },
      {
        name: "Day trip to Cape Sounion",
        description:
          "90 minutes south to the Temple of Poseidon on a cliff over the Aegean. Time it for sunset.",
        type: "nature",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Athens?",
        answer:
          "Two to three days for the city itself, then move on to the islands. Add a day if you want to do Cape Sounion or Delphi.",
      },
      {
        question: "Is Athens worth visiting?",
        answer:
          "Absolutely — and it's been unfairly skipped for years. Three days is enough to see the Acropolis and the Acropolis Museum, eat well, and explore the neighborhoods.",
      },
      {
        question: "Is Athens safe?",
        answer:
          "Generally yes. Be alert in Omonia and around the train station after dark, and watch for pickpockets on the metro.",
      },
      {
        question: "When should I avoid Athens?",
        answer:
          "July-August: brutal heat (often above 38°C), crowded ruins, and locals fleeing to the islands. April-May and September-October are perfect.",
      },
      {
        question: "Should I combine Athens with islands?",
        answer:
          "Yes — most travelers do. Athens 2-3 days, then ferry or fly to Santorini, Mykonos, Crete, or Naxos for a week.",
      },
    ],
    themes: ["history", "food", "ruins", "value"],
    gradient: ["#F5D5A8", "#7D3218"],
  },

  {
    slug: "dublin",
    name: "Dublin",
    country: "Ireland",
    countryCode: "IE",
    region: "Europe",
    latitude: 53.3498,
    longitude: -6.2603,
    currency: "EUR",
    language: "English",
    timezone: "Europe/Dublin",
    bestMonths: ["May", "June", "July", "August", "September"],
    bestTimeBlurb:
      "Late spring through early autumn is when Dublin is most enjoyable — warmer, drier, and with long daylight. Pack layers anyway: it can rain in any month.",
    avgDailyBudgetUSD: { budget: 90, mid: 200, luxury: 500 },
    heroBlurb:
      "Pubs, poets, and a small walkable capital with a literary heritage longer than its skyline.",
    longDescription:
      "Dublin is a small city packed with disproportionate cultural firepower — Joyce, Beckett, Wilde, Yeats, Heaney all walked these streets. Spend a few days here on the literary trail, drink Guinness at the source, walk along the Liffey, and use the city as a launching point for the Cliffs of Moher or Galway. The pub culture is genuinely the social fabric, not a tourist gimmick — even the touristy ones are still fun.",
    neighborhoods: [
      {
        name: "Temple Bar",
        description:
          "The famous (and famously touristy) cobbled district packed with pubs. Worth a wander but don't drink here — the pints are €9 and the music is for tourists.",
      },
      {
        name: "Trinity & Grafton Street",
        description:
          "The city's cultural and shopping heart. Trinity College, Grafton Street's pedestrian shopping, and the National Museum nearby.",
      },
      {
        name: "Stoneybatter",
        description:
          "Hip, gentrifying neighborhood north of the river. Indie cafés, craft beer bars, and where the locals actually go.",
      },
      {
        name: "Ranelagh",
        description:
          "Leafy residential village south of the canal. Best brunch spots and small wine bars.",
      },
      {
        name: "Portobello",
        description:
          "Trendy canal-side district with vintage shops, neighborhood pubs, and the original Bernard Shaw bar.",
      },
    ],
    experiences: [
      {
        name: "Trinity College & the Book of Kells",
        description:
          "The 9th-century illuminated gospel manuscript and the breathtaking Long Room library. Book ahead — same-day entry is unreliable.",
        type: "culture",
      },
      {
        name: "Guinness Storehouse",
        description:
          "Touristy but legitimately well done — the seven-story brewery tour ends with a free pint at the Gravity Bar with 360° city views.",
        type: "food",
      },
      {
        name: "Pub crawl with proper pints",
        description:
          "Skip Temple Bar. Grogan's, The Long Hall, John Kavanagh's (the Gravediggers), and Mulligan's serve the city's best pints in real local atmosphere.",
        type: "food",
      },
      {
        name: "EPIC The Irish Emigration Museum",
        description:
          "Surprisingly excellent interactive museum on the Irish diaspora. Top-rated by visitors for a reason.",
        type: "culture",
      },
      {
        name: "Phoenix Park",
        description:
          "Larger than Central Park, with wild deer, the President's residence, and Dublin Zoo. Walk or rent a bike.",
        type: "nature",
      },
      {
        name: "Howth day trip",
        description:
          "30 minutes by DART train to a fishing village with cliff walks, fresh seafood, and the best fish and chips in the area.",
        type: "nature",
      },
      {
        name: "Traditional Irish music session",
        description:
          "The Cobblestone in Smithfield is the real deal — local musicians, no tourist setlists.",
        type: "nightlife",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Dublin?",
        answer:
          "Two to three days for the city itself. Add a day for Howth or a multi-day trip to combine with Galway, Cork, or the Wild Atlantic Way.",
      },
      {
        question: "Is Dublin expensive?",
        answer:
          "Yes — surprisingly. Hotels and pints are pricier than most of Western Europe. Save money by eating at lunch specials and pub food rather than dinner.",
      },
      {
        question: "Do I need to book the Book of Kells?",
        answer:
          "Yes — book a timed entry ticket at least a few days in advance. Walk-up tickets sell out by mid-morning in summer.",
      },
      {
        question: "Is Dublin safe?",
        answer:
          "Very safe. Normal big-city precautions; some areas around Connolly Station and parts of north central can feel rougher at night.",
      },
      {
        question: "When does it rain in Dublin?",
        answer:
          "Any month. Pack a light rain jacket and assume you'll need it. Dublin's reputation for constant rain is exaggerated, but sunshine is also not guaranteed.",
      },
    ],
    themes: ["pubs", "history", "literature", "music"],
    gradient: ["#7FA384", "#425744"],
  },

  {
    slug: "budapest",
    name: "Budapest",
    country: "Hungary",
    countryCode: "HU",
    region: "Europe",
    latitude: 47.4979,
    longitude: 19.0402,
    currency: "HUF",
    language: "Hungarian",
    timezone: "Europe/Budapest",
    bestMonths: ["April", "May", "June", "September", "October"],
    bestTimeBlurb:
      "Spring and fall are gorgeous — warm enough for the thermal baths, mild enough to walk, and free of the August tourist density.",
    avgDailyBudgetUSD: { budget: 50, mid: 130, luxury: 360 },
    heroBlurb:
      "Two cities (Buda and Pest) split by the Danube — grand 19th-century architecture, medieval thermal baths, and the cheapest fine dining in Europe.",
    longDescription:
      "Budapest is Vienna with 30% off and twice the edge. The Hapsburg-era boulevards, the parliament that sits like a Gothic palace on the Danube, the chain bridge between Buda's hills and Pest's flatlands — visually it's one of the most stunning capitals in Europe. It's also where you can soak in 100-year-old thermal baths, eat goulash at a 200-year-old wine cellar, and get a Michelin-starred dinner for the price of a Berlin pizza.",
    neighborhoods: [
      {
        name: "District V (Belváros)",
        description:
          "The historic core of Pest with the Parliament, St. Stephen's Basilica, and the Chain Bridge. Walk-everywhere base.",
      },
      {
        name: "District VII (Jewish Quarter)",
        description:
          "Famous for ruin bars, the Great Synagogue, and Budapest's best nightlife. Szimpla Kert is the original ruin bar.",
      },
      {
        name: "District VI (Terézváros)",
        description:
          "Andrássy Avenue, the opera house, and a quieter, more elegant base for first-timers.",
      },
      {
        name: "District I (Castle Hill)",
        description:
          "The historic Buda side. Castle, Fisherman's Bastion, Matthias Church. Touristy by day, peaceful at night.",
      },
      {
        name: "District XIII (Újlipótváros)",
        description:
          "Quiet, residential, leafy, with Margaret Island a bridge away. Best for slower-paced second visits.",
      },
    ],
    experiences: [
      {
        name: "Széchenyi Thermal Baths",
        description:
          "The neo-baroque palace of thermal pools — the largest in Europe. Bring a swimsuit and stay for hours. Book a massage.",
        type: "culture",
      },
      {
        name: "Hungarian Parliament Building",
        description:
          "The Gothic Revival riverfront masterpiece. Take the guided interior tour (book online) and view it from across the Danube at night.",
        type: "landmark",
      },
      {
        name: "Fisherman's Bastion",
        description:
          "The fairytale neo-Romanesque terrace on Castle Hill with the iconic view across the Danube to Parliament.",
        type: "landmark",
      },
      {
        name: "Ruin bar crawl",
        description:
          "Szimpla Kert is the famous one. Instant Fogas Ház, Mazel Tov, and Kőleves are also great. The Jewish Quarter is the epicenter.",
        type: "nightlife",
      },
      {
        name: "Central Market Hall",
        description:
          "Three-story iron-and-glass market with paprika, lángos (Hungarian fried dough), and the country's best souvenir food shopping.",
        type: "food",
      },
      {
        name: "Danube river cruise",
        description:
          "Best at night when the Parliament and Castle are illuminated. The 1-hour cruises are touristy but genuinely beautiful.",
        type: "landmark",
      },
      {
        name: "Gellért Baths",
        description:
          "The Art Nouveau alternative to Széchenyi — smaller, more elegant, slightly more expensive. The mosaic-tiled main pool is iconic.",
        type: "culture",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Budapest?",
        answer:
          "Three days hits the major sights, two thermal bath visits, and the historic center comfortably. Add a fourth day for Szentendre or a Danube Bend trip.",
      },
      {
        question: "Is Budapest cheap?",
        answer:
          "Yes — among the best value in Europe. Excellent dinners run $20-30 with wine, museum entries are under $15, and a thermal bath visit is around $25.",
      },
      {
        question: "Do they use the Euro in Budapest?",
        answer:
          "No — Hungarian forint (HUF). Most places accept cards. Bring small forint cash for cafés, public transit, and tipping.",
      },
      {
        question: "Are the thermal baths worth it?",
        answer:
          "Absolutely — they're the defining Budapest experience. Bring a swimsuit, towel, and flip-flops. Locker fees are extra; pre-book a massage if you want one.",
      },
      {
        question: "Is Budapest safe?",
        answer:
          "Very safe. Normal big-city precautions; the only real risk is overpriced 'hostess bars' near tourist areas — never accept an invitation from a stranger to a club.",
      },
    ],
    themes: ["thermal-baths", "architecture", "nightlife", "value"],
    gradient: ["#7D3218", "#9BB59F"],
  },

  // ============================================================
  // ASIA — round 2
  // ============================================================
  {
    slug: "hanoi",
    name: "Hanoi",
    country: "Vietnam",
    countryCode: "VN",
    region: "Asia",
    latitude: 21.0285,
    longitude: 105.8542,
    currency: "VND",
    language: "Vietnamese",
    timezone: "Asia/Bangkok",
    bestMonths: ["October", "November", "December", "March", "April"],
    bestTimeBlurb:
      "Late autumn (October-December) and early spring (March-April) deliver the best weather. Avoid the May-September monsoon and the brutal summer humidity.",
    avgDailyBudgetUSD: { budget: 30, mid: 80, luxury: 250 },
    heroBlurb:
      "Vietnam's chaotic, atmospheric old capital — the world's best street food, motorbike-mad alleys, and a French-colonial old quarter unlike anywhere else.",
    longDescription:
      "Hanoi is sensory overload in the best way. The Old Quarter's 36 ancient streets, each historically named for the trade practiced there, are now a tangle of motorbikes, food vendors, French colonial buildings, and tiny temples. Spend your mornings on history (Hoa Lo Prison, Ho Chi Minh's Mausoleum, the Temple of Literature) and your afternoons and evenings eating — pho, bun cha, banh mi, egg coffee, bia hoi (3-cent draft beer) on a plastic stool. Use Hanoi as the gateway to Halong Bay and Sapa.",
    neighborhoods: [
      {
        name: "Old Quarter",
        description:
          "The 1,000-year-old maze of trade streets. Touristy but the only real place to base yourself for first-time visits.",
      },
      {
        name: "French Quarter",
        description:
          "Wide boulevards, the Opera House, Sofitel Metropole hotel, and the city's best fine dining.",
      },
      {
        name: "Tay Ho (West Lake)",
        description:
          "Expat neighborhood north of the center. Boutique hotels, cafés, and a peaceful escape from the Old Quarter chaos.",
      },
      {
        name: "Ba Dinh",
        description:
          "Government district with Ho Chi Minh's Mausoleum, the Presidential Palace, and the One Pillar Pagoda.",
      },
    ],
    experiences: [
      {
        name: "Old Quarter walking tour",
        description:
          "Wander the 36 streets. Watch motorbike traffic flow at any intersection. Eat street food at any plastic-stool stall with a queue.",
        type: "neighborhood",
      },
      {
        name: "Hoan Kiem Lake at dawn",
        description:
          "The lake in the heart of the city. Locals do tai chi on the banks at sunrise — the best way to see Hanoi before the chaos starts.",
        type: "nature",
      },
      {
        name: "Pho breakfast at Pho Gia Truyen",
        description:
          "Vietnam's national dish at one of Hanoi's most famous bowls. Small, crowded, no English menu, perfect.",
        type: "food",
      },
      {
        name: "Bun cha at Bun Cha Huong Lien",
        description:
          "The bun cha shop where Obama and Anthony Bourdain ate. The original is still there, exactly as it was.",
        type: "food",
      },
      {
        name: "Egg coffee at Cafe Giang",
        description:
          "Hanoi's invented drink — Vietnamese coffee with whipped egg yolk and condensed milk. Bizarre and delicious. The original since 1946.",
        type: "food",
      },
      {
        name: "Temple of Literature",
        description:
          "Vietnam's first national university, founded in 1070. Beautifully preserved Confucian temple complex.",
        type: "landmark",
      },
      {
        name: "Halong Bay 2-day cruise",
        description:
          "An overnight on a junk boat through the limestone karst seascape. Worth the time investment — book through reputable operators only.",
        type: "nature",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Hanoi?",
        answer:
          "Two to three days for the city itself, plus 2 more for an overnight Halong Bay cruise. Add another for Ninh Binh (the 'Halong Bay on land').",
      },
      {
        question: "Is Hanoi safe?",
        answer:
          "Very safe. The biggest hazards are crossing the street (walk steady and slow — motorbikes will flow around you) and the occasional taxi scam (use Grab).",
      },
      {
        question: "Is Hanoi cheap?",
        answer:
          "Among the cheapest capitals on Earth. Street food meals run $1-3, full sit-down meals $5-10, hotels $30-100/night for great quality.",
      },
      {
        question: "How do I cross the street in Hanoi?",
        answer:
          "Don't wait for traffic to stop — it never will. Walk slowly and predictably; the motorbikes will adjust around you. Don't hesitate or change pace.",
      },
      {
        question: "Should I do Halong Bay?",
        answer:
          "Yes — it's the iconic Vietnam experience. Choose a 2-day overnight cruise (not a day trip) and read recent reviews carefully; quality varies wildly.",
      },
    ],
    themes: ["food", "culture", "history", "value"],
    gradient: ["#7FA384", "#7D3218"],
  },

  {
    slug: "chiang-mai",
    name: "Chiang Mai",
    country: "Thailand",
    countryCode: "TH",
    region: "Asia",
    latitude: 18.7883,
    longitude: 98.9853,
    currency: "THB",
    language: "Thai",
    timezone: "Asia/Bangkok",
    bestMonths: ["November", "December", "January", "February"],
    bestTimeBlurb:
      "The cool dry season (November-February) is perfect — sunny days, cool evenings. Avoid March-May (burning season smoke) and June-October (monsoon).",
    avgDailyBudgetUSD: { budget: 30, mid: 80, luxury: 240 },
    heroBlurb:
      "Northern Thailand's chilled-out cultural capital — 300 temples, mountain jungles, ethical elephant sanctuaries, and a digital nomad scene that hasn't ruined the soul.",
    longDescription:
      "Chiang Mai is what travelers move to when they fall in love with Thailand. The walled old city contains over 30 temples in a few square kilometers; the surrounding mountains have hill-tribe villages, waterfalls, and ethical elephant sanctuaries; and the city itself has incredible food, affordable luxury hotels, and a community of nomads, monks, and locals that mostly coexist. Don't ride elephants — visit the genuine sanctuaries that no longer offer rides.",
    neighborhoods: [
      {
        name: "Old City",
        description:
          "The historic walled square containing most of the major temples. Best base for first-time visitors — walkable to everything.",
      },
      {
        name: "Nimmanhaemin (Nimman)",
        description:
          "Trendy neighborhood west of the old city — cafés, boutique hotels, and the digital nomad center.",
      },
      {
        name: "Riverside (Charoenrat)",
        description:
          "East along the Ping River. Atmospheric old wooden houses, riverside restaurants, and quieter accommodation.",
      },
      {
        name: "Santitham",
        description:
          "Local neighborhood north of the old city. Cheap eats, local markets, and the most authentic side of Chiang Mai.",
      },
    ],
    experiences: [
      {
        name: "Doi Suthep temple",
        description:
          "Chiang Mai's iconic temple on a mountainside above the city. Climb the 309-step naga staircase or take the funicular.",
        type: "landmark",
      },
      {
        name: "Sunday Walking Street market",
        description:
          "Sundays only — the entire old city center turns into a vast outdoor market with food, crafts, and street performers.",
        type: "shopping",
      },
      {
        name: "Elephant Nature Park",
        description:
          "The original ethical elephant sanctuary — no riding, no shows, just feeding and observing rescued elephants. Book directly through their website.",
        type: "nature",
      },
      {
        name: "Khao soi crawl",
        description:
          "Northern Thailand's signature curry noodle dish. Khao Soi Khun Yai and Khao Soi Mae Sai are the local favorites.",
        type: "food",
      },
      {
        name: "Cooking class",
        description:
          "Half-day classes start at $30 with a market visit. Thai Farm Cooking School and Asia Scenic are top-rated.",
        type: "food",
      },
      {
        name: "Wat Chedi Luang",
        description:
          "The half-ruined 14th-century stupa in the old city. Most impressive temple in Chiang Mai for atmosphere.",
        type: "landmark",
      },
      {
        name: "Doi Inthanon day trip",
        description:
          "Thailand's highest peak. Waterfalls, twin pagodas, hill-tribe villages. Hire a private driver for the day.",
        type: "nature",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Chiang Mai?",
        answer:
          "Three to four days for the city and one or two day trips. Easy to extend to a week if you slow down or take a cooking class.",
      },
      {
        question: "Chiang Mai or Bangkok?",
        answer:
          "Different vibes — Bangkok is intense and urban; Chiang Mai is mellow and cultural. Most travelers do both, with Bangkok first as the entry point.",
      },
      {
        question: "Are elephant rides ethical?",
        answer:
          "No — they require painful 'breaking' as babies. Visit a sanctuary that doesn't offer rides (Elephant Nature Park is the gold standard) and walk alongside the elephants instead.",
      },
      {
        question: "When should I avoid Chiang Mai?",
        answer:
          "March-April: 'burning season' when farmers burn fields and the air quality drops to hazardous levels for weeks. Check AQI before booking.",
      },
      {
        question: "Is Chiang Mai walkable?",
        answer:
          "The old city is, but you'll need a Grab or songthaew (red truck) for longer trips. Renting a scooter is cheap but the traffic is dangerous if you're not experienced.",
      },
    ],
    themes: ["temples", "nature", "food", "value"],
    gradient: ["#9BB59F", "#7D3218"],
  },

  {
    slug: "taipei",
    name: "Taipei",
    country: "Taiwan",
    countryCode: "TW",
    region: "Asia",
    latitude: 25.033,
    longitude: 121.5654,
    currency: "TWD",
    language: "Mandarin",
    timezone: "Asia/Taipei",
    bestMonths: ["October", "November", "December", "March", "April"],
    bestTimeBlurb:
      "Autumn and early spring deliver the best weather. Avoid summer (June-September) for typhoons and humidity, and January for cold rain.",
    avgDailyBudgetUSD: { budget: 50, mid: 130, luxury: 360 },
    heroBlurb:
      "The world's best night-market food, hot springs in the mountains, and a city that runs better than Tokyo with Hong Kong's prices.",
    longDescription:
      "Taipei has been quietly delivering one of Asia's best travel experiences for years. The food scene — night markets, beef noodles, soup dumplings, bubble tea (invented here) — is world-class and absurdly affordable. The metro is pristine and runs everywhere. Hot springs in the volcanic hills 30 minutes from downtown. A genuine cycling culture. And the people are some of the friendliest you'll meet anywhere in Asia.",
    neighborhoods: [
      {
        name: "Da'an",
        description:
          "Central, leafy, walkable. Yongkang Street has the best concentration of traditional restaurants and cafés.",
      },
      {
        name: "Ximending",
        description:
          "The Shibuya of Taipei — youth fashion, street food, and the city's most energetic shopping district.",
      },
      {
        name: "Xinyi",
        description:
          "The modern downtown. Taipei 101, luxury malls, and the city's best skyline view.",
      },
      {
        name: "Datong & Dadaocheng",
        description:
          "The historic old town near the Tamsui River. Traditional shops, tea houses, and the famous Dihua Street.",
      },
      {
        name: "Beitou",
        description:
          "Hot springs district 30 minutes north on the metro. Stay overnight at a ryokan-style inn and soak.",
      },
    ],
    experiences: [
      {
        name: "Shilin Night Market",
        description:
          "The city's biggest and most famous night market. Stinky tofu, oyster omelets, fried chicken steaks the size of your face.",
        type: "food",
      },
      {
        name: "Din Tai Fung (original)",
        description:
          "The world-famous xiao long bao chain started in Taipei. Visit the original Xinyi Road location for the pilgrimage. Worth the wait.",
        type: "food",
      },
      {
        name: "Taipei 101 observatory",
        description:
          "Once the world's tallest building. The 89th-floor observatory has the world's fastest elevator and stunning city views.",
        type: "landmark",
      },
      {
        name: "National Palace Museum",
        description:
          "Holds the imperial collection that fled mainland China in 1949 — the world's best collection of Chinese imperial art.",
        type: "culture",
      },
      {
        name: "Beitou hot springs",
        description:
          "Volcanic hot springs 30 minutes from downtown by metro. Public baths cost $2; ryokan-style hotels around $200/night.",
        type: "nature",
      },
      {
        name: "Jiufen day trip",
        description:
          "The mountain village that inspired Spirited Away. Tea houses, lantern-lit alleys, and Pacific views. 90 minutes by bus.",
        type: "neighborhood",
      },
      {
        name: "Yongkang Street food crawl",
        description:
          "Beef noodle soup at Yongkang, mango shaved ice at Smoothie House, soup dumplings — three blocks of the best traditional Taipei food.",
        type: "food",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Taipei?",
        answer:
          "Three to four days for the city, with a half-day for Beitou and a full day for Jiufen. A week lets you add Taroko Gorge or Sun Moon Lake.",
      },
      {
        question: "Is Taipei safe?",
        answer:
          "Among the safest cities in Asia. Crime is virtually nil. The friendliest big city you'll visit anywhere.",
      },
      {
        question: "Do I need to speak Mandarin?",
        answer:
          "Helpful but not essential. English is more common than in mainland China, especially with younger people. Google Translate handles most menus.",
      },
      {
        question: "Is Taipei expensive?",
        answer:
          "No — among Asia's best value capitals. Hotels are reasonable, food is incredible value (a great meal costs $6-15), and the metro is cheap.",
      },
      {
        question: "When should I avoid Taipei?",
        answer:
          "June-September: typhoon season and brutal humidity. January-February can be cold and rainy. October-November and March-April are ideal.",
      },
    ],
    themes: ["food", "night-markets", "modern", "hot-springs"],
    gradient: ["#C4522A", "#9BB59F"],
  },

  // ============================================================
  // AMERICAS — round 2
  // ============================================================
  {
    slug: "los-angeles",
    name: "Los Angeles",
    country: "United States",
    countryCode: "US",
    region: "Americas",
    latitude: 34.0522,
    longitude: -118.2437,
    currency: "USD",
    language: "English",
    timezone: "America/Los_Angeles",
    bestMonths: ["March", "April", "May", "September", "October", "November"],
    bestTimeBlurb:
      "Spring and fall avoid the hot August inland heat and winter rain. November-December also have crisp blue skies and post-fire-season clarity.",
    avgDailyBudgetUSD: { budget: 110, mid: 270, luxury: 700 },
    heroBlurb:
      "A sprawling, sun-bleached city of beaches, hiking, taco trucks, movie magic, and 88 distinct neighborhoods that feel like 88 different cities.",
    longDescription:
      "Los Angeles is too big for any one trip — and that's the point. It rewards travelers who pick a base and explore one or two regions deeply rather than trying to see it all. Stay in West Hollywood, Venice, or Silver Lake depending on your vibe. Rent a car (LA is built for them, the public transit isn't great), eat tacos from a truck, hike Runyon at sunrise, and accept that you'll spend a lot of time on the 405. You'll either love it or hate it; some travelers feel both in the same day.",
    neighborhoods: [
      {
        name: "Venice & Santa Monica",
        description:
          "Beach LA. Surfing, Abbott Kinney's boutique row, the Santa Monica pier, and easy beach-day basing for first-timers.",
      },
      {
        name: "West Hollywood (WeHo)",
        description:
          "Walkable (rare for LA), packed with restaurants and bars, the Sunset Strip, and the city's queer scene.",
      },
      {
        name: "Silver Lake & Echo Park",
        description:
          "East side hipster heartland. Coffee shops, vintage stores, taco trucks, and the best day-to-night neighborhood scene.",
      },
      {
        name: "Downtown LA",
        description:
          "Skyscrapers, the Broad Museum, Grand Central Market, the Arts District. More walkable than people expect.",
      },
      {
        name: "Pasadena",
        description:
          "Quieter, leafier base 20 minutes northeast. The Huntington Gardens and the Norton Simon Museum are highlights.",
      },
    ],
    experiences: [
      {
        name: "Griffith Observatory & Hollywood Sign",
        description:
          "Free observatory atop Mount Hollywood with the iconic sign view. Hike from the entrance for the best photos and the city panorama.",
        type: "landmark",
      },
      {
        name: "Getty Center",
        description:
          "Free hilltop museum with Van Gogh's Irises, sculpture gardens, and stunning architecture by Richard Meier. Reserve parking ahead.",
        type: "culture",
      },
      {
        name: "Venice Beach boardwalk",
        description:
          "The original LA beach scene — muscle beach, skaters, street performers, and the canals one block inland.",
        type: "nature",
      },
      {
        name: "Taco crawl in Boyle Heights",
        description:
          "East LA's taqueria heartland. Mariscos Jalisco, Sonoratown, and the trucks parked outside the Home Depot.",
        type: "food",
      },
      {
        name: "Runyon Canyon hike",
        description:
          "Quick urban hike with a view of the entire LA basin. Best at sunrise for a celebrity-free experience.",
        type: "nature",
      },
      {
        name: "The Broad",
        description:
          "Free contemporary art museum downtown with Jeff Koons, Yayoi Kusama's Infinity Mirror Room (timed entry only).",
        type: "culture",
      },
      {
        name: "Sunset drive on Mulholland",
        description:
          "Drive Mulholland Drive at golden hour for the LA basin views from the Hollywood Hills overlooks. Free, iconic, fastest way to feel the city.",
        type: "nature",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in LA?",
        answer:
          "Five days minimum for first-timers — and you'll still feel like you only saw a fraction. A week or 10 days lets you explore east side, west side, and a Joshua Tree day trip.",
      },
      {
        question: "Do I need a car in LA?",
        answer:
          "Yes — for almost everyone. The metro is improving but doesn't reach most neighborhoods. Uber/Lyft works but adds up fast given LA distances.",
      },
      {
        question: "Is LA dangerous?",
        answer:
          "Specific neighborhoods are sketchy at night (parts of downtown after dark, Skid Row), but the tourist neighborhoods (Westside, WeHo, Silver Lake, Venice) are safe with normal precautions. Don't leave valuables in parked cars.",
      },
      {
        question: "What's the best LA neighborhood for first-timers?",
        answer:
          "West Hollywood for walkability and food, or Santa Monica/Venice for beach access. Silver Lake if you want east side cool. Avoid Hollywood Boulevard itself for accommodation.",
      },
      {
        question: "When does it rain in LA?",
        answer:
          "December through March is the wet season. The rest of the year is reliably dry — sometimes too dry (fire season July-October).",
      },
    ],
    themes: ["beach", "food", "outdoor", "movies"],
    gradient: ["#F5D5A8", "#D4734A"],
  },

  {
    slug: "chicago",
    name: "Chicago",
    country: "United States",
    countryCode: "US",
    region: "Americas",
    latitude: 41.8781,
    longitude: -87.6298,
    currency: "USD",
    language: "English",
    timezone: "America/Chicago",
    bestMonths: ["May", "June", "September", "October"],
    bestTimeBlurb:
      "Late spring and early fall are the sweet spot. Summer is gorgeous but humid; winter can drop to -20°C and the wind genuinely cuts through everything.",
    avgDailyBudgetUSD: { budget: 110, mid: 240, luxury: 600 },
    heroBlurb:
      "The world's best architecture city — Frank Lloyd Wright, Mies van der Rohe, the river that runs through it, and a deep-dish pizza scene that's better than its reputation.",
    longDescription:
      "Chicago is the most underrated big city in America — and architects know it. The skyline is the best in the country (sorry, New York), the lakefront in summer is stunning, the food scene runs deeper than deep dish (hello, Italian beef, Korean fried chicken, and nine Michelin stars), and the public transit actually works. Skip Magnificent Mile, walk the river instead, and don't come in February.",
    neighborhoods: [
      {
        name: "The Loop",
        description:
          "Downtown business district with Millennium Park, the Art Institute, and the architecture cruise dock. Central but quiet at night.",
      },
      {
        name: "River North & Streeterville",
        description:
          "Adjacent to the Loop with most of the polished hotels, restaurants, and easy walking access to Navy Pier.",
      },
      {
        name: "West Loop",
        description:
          "The city's hottest restaurant district — Randolph Street's 'Restaurant Row' has more of Chicago's best chefs per block than anywhere.",
      },
      {
        name: "Wicker Park & Bucktown",
        description:
          "Indie bookshops, vintage stores, neighborhood bars. Chicago's hipster heart.",
      },
      {
        name: "Lincoln Park",
        description:
          "Family-friendly residential district along the lake with the free Lincoln Park Zoo and walking access to the water.",
      },
    ],
    experiences: [
      {
        name: "Architecture river cruise",
        description:
          "The Chicago Architecture Center runs the gold-standard 90-minute boat tour through the skyscrapers. The single best thing to do in the city.",
        type: "culture",
      },
      {
        name: "Art Institute of Chicago",
        description:
          "Hopper's Nighthawks, Seurat's Sunday Afternoon, Picasso's Old Guitarist. A top-five US museum.",
        type: "culture",
      },
      {
        name: "Millennium Park & The Bean",
        description:
          "Free outdoor sculpture park with Anish Kapoor's Cloud Gate (the Bean). Pritzker Pavilion has free summer concerts.",
        type: "landmark",
      },
      {
        name: "Deep dish at Lou Malnati's or Pequod's",
        description:
          "Lou Malnati's is the iconic chain (excellent); Pequod's has the famous caramelized cheese crust. Order one between two and pace yourself.",
        type: "food",
      },
      {
        name: "Italian beef at Al's #1",
        description:
          "Chicago's other defining sandwich. Order it 'dipped' with sweet peppers and giardiniera. Wear a bib.",
        type: "food",
      },
      {
        name: "Lakefront bike ride",
        description:
          "18 miles of paved trail along Lake Michigan. Rent a Divvy bike and ride from Lincoln Park down to Hyde Park.",
        type: "nature",
      },
      {
        name: "Willis Tower Skydeck",
        description:
          "103 floors up with the glass-floor Ledge boxes. Touristy but the view is genuinely staggering. Better than 360 Chicago in the John Hancock.",
        type: "landmark",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Chicago?",
        answer:
          "Three to four days hits the major sights, neighborhoods, and a cruise. Five lets you slow down and explore the food scene.",
      },
      {
        question: "Is Chicago dangerous?",
        answer:
          "The neighborhoods tourists visit (downtown, near north, west loop, Lincoln Park) are safe with normal precautions. Avoid the south and west sides at night unless you have specific reasons to be there.",
      },
      {
        question: "Is Chicago worth visiting in winter?",
        answer:
          "Only if you love cold or have a specific reason — the wind off the lake genuinely cuts through everything. December has Christmas markets; February is brutal.",
      },
      {
        question: "Deep dish or thin crust?",
        answer:
          "Both. Deep dish is the famous one (Lou Malnati's, Pequod's); Chicago tavern-style thin crust is what locals actually eat day-to-day (Vito & Nick's, Pat's).",
      },
      {
        question: "Is the architecture cruise worth it?",
        answer:
          "Yes — book the Chicago Architecture Center version specifically (not the cheaper imitators). It's the most-recommended single experience in the city for a reason.",
      },
    ],
    themes: ["architecture", "food", "art", "lakefront"],
    gradient: ["#2D2D2D", "#7FA384"],
  },

  {
    slug: "toronto",
    name: "Toronto",
    country: "Canada",
    countryCode: "CA",
    region: "Americas",
    latitude: 43.6532,
    longitude: -79.3832,
    currency: "CAD",
    language: "English & French",
    timezone: "America/Toronto",
    bestMonths: ["May", "June", "September", "October"],
    bestTimeBlurb:
      "Late spring and early fall are perfect — warm enough for terrace life, cool enough to walk. Summer is humid; winter is cold but bearable indoors.",
    avgDailyBudgetUSD: { budget: 100, mid: 220, luxury: 550 },
    heroBlurb:
      "Canada's largest city — quietly the most multicultural city on Earth, with an incredible food scene built on 200+ immigrant communities.",
    longDescription:
      "Toronto is the most diverse city in the world — over half the population was born outside Canada — and it shows in the food. Every neighborhood is a different country: Greek on the Danforth, Italian in Little Italy, Chinese in Spadina's Chinatown, Sri Lankan in Scarborough, Ethiopian on Bloor. The city's also got serious museums, the world's third-tallest tower, and Lake Ontario at its doorstep. It's not as charming as Montreal, but it's where the food and the energy live.",
    neighborhoods: [
      {
        name: "Downtown / Entertainment District",
        description:
          "Where most hotels are. Walking distance to the CN Tower, Rogers Centre, and the waterfront.",
      },
      {
        name: "Kensington Market",
        description:
          "Bohemian, multicultural, packed with vintage shops, food stalls from a dozen countries, and Toronto's coolest street art.",
      },
      {
        name: "The Annex",
        description:
          "Leafy, residential, with the University of Toronto and Bloor Street's restaurants. Best for a quieter base.",
      },
      {
        name: "Distillery District",
        description:
          "Restored Victorian-era distillery now full of restaurants, galleries, and the Christmas market in December.",
      },
      {
        name: "Queen West",
        description:
          "The world's '2nd-coolest neighborhood' according to Vogue (a few years ago). Indie shops, third-wave coffee, art galleries.",
      },
    ],
    experiences: [
      {
        name: "CN Tower",
        description:
          "Touristy but the view is genuinely impressive. EdgeWalk lets you walk the outer rim hands-free (book ahead, weather permitting).",
        type: "landmark",
      },
      {
        name: "Royal Ontario Museum",
        description:
          "Canada's largest museum with strong dinosaurs, world cultures, and the dramatic Daniel Libeskind addition.",
        type: "culture",
      },
      {
        name: "Kensington Market food crawl",
        description:
          "Empanadas, tacos, Caribbean roti, Tibetan momos, vintage burgers. Wander, graze, repeat.",
        type: "food",
      },
      {
        name: "St. Lawrence Market",
        description:
          "The city's classic indoor market. Peameal bacon sandwich at Carousel Bakery is the iconic order.",
        type: "food",
      },
      {
        name: "Toronto Islands",
        description:
          "15-minute ferry from downtown to a car-free island chain. Beaches, picnics, and the best skyline view.",
        type: "nature",
      },
      {
        name: "Art Gallery of Ontario",
        description:
          "Strong Canadian collection (Group of Seven, Emily Carr) plus international highlights, in a Frank Gehry-renovated space.",
        type: "culture",
      },
      {
        name: "Niagara Falls day trip",
        description:
          "90 minutes by car or organized bus. Skip the cheesy town and head straight for the falls — the Hornblower boat ride gets you genuinely wet.",
        type: "nature",
      },
    ],
    faqs: [
      {
        question: "How many days do you need in Toronto?",
        answer:
          "Three days hits the main sights and gives you a taste of the food scene. Add a day for Niagara Falls or a beach day on the islands in summer.",
      },
      {
        question: "Toronto or Montreal?",
        answer:
          "Different vibes. Toronto is bigger, more multicultural, English-speaking. Montreal is smaller, more European, French-speaking, with more atmosphere. Most travelers prefer Montreal for charm; Toronto wins on food diversity.",
      },
      {
        question: "Is Toronto safe?",
        answer:
          "Among the safest big cities in North America. Normal precautions apply but violent crime is very rare in the central neighborhoods.",
      },
      {
        question: "Do I need a car in Toronto?",
        answer:
          "No — the streetcars and subway cover the central neighborhoods well. Rent only for day trips to Niagara or wine country.",
      },
      {
        question: "When should I avoid Toronto?",
        answer:
          "January-February for the cold; July-August can be very humid. May-June and September-October are ideal.",
      },
    ],
    themes: ["food", "diversity", "culture", "lakefront"],
    gradient: ["#7FA384", "#C4522A"],
  },
];

// ============================================================
// Lookups & helpers
// ============================================================

export function getDestinationBySlug(slug: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.slug === slug);
}

export function getDestinationsByRegion(): Record<DestinationRegion, Destination[]> {
  const out: Record<string, Destination[]> = {};
  for (const d of DESTINATIONS) {
    if (!out[d.region]) out[d.region] = [];
    out[d.region].push(d);
  }
  // sort each group alphabetically
  for (const k of Object.keys(out)) {
    out[k].sort((a, b) => a.name.localeCompare(b.name));
  }
  return out as Record<DestinationRegion, Destination[]>;
}

export function getFeaturedDestinations(n: number = 12): Destination[] {
  // a curated featured slice — top global cities for the homepage / footer
  const featuredSlugs = [
    "paris",
    "tokyo",
    "rome",
    "lisbon",
    "new-york-city",
    "barcelona",
    "kyoto",
    "bali",
    "mexico-city",
    "marrakech",
    "istanbul",
    "amsterdam",
  ];
  return featuredSlugs
    .map((s) => getDestinationBySlug(s))
    .filter((d): d is Destination => Boolean(d))
    .slice(0, n);
}

export function isValidTripLength(n: number): n is TripLength {
  return (TRIP_LENGTHS as readonly number[]).includes(n);
}
