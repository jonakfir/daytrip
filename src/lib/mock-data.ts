import type { Itinerary } from "@/types/itinerary";

/**
 * Hardcoded 5-day Tokyo demo itinerary used as the fallback when no real
 * itinerary is available (e.g. /trip/demo, /trip/tokyo-demo-5d, or when the
 * /api/generate endpoint has neither Claude nor a key configured).
 *
 * Real places only — Senso-ji, Meiji Jingu, Tsukiji, Shibuya, etc.
 */
export const MOCK_TOKYO_ITINERARY: Itinerary = {
  id: "mock-tokyo-001",
  shareId: "tokyo-demo-5d",
  destination: "Tokyo, Japan",
  startDate: "2026-04-10",
  endDate: "2026-04-14",
  travelers: 2,
  travelStyle: "balanced",
  budget: "moderate",
  heroImage:
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80",
  days: [
    {
      dayNumber: 1,
      date: "2026-04-10",
      title: "Arrival & Shibuya Discovery",
      morning: [
        {
          time: "10:00",
          name: "Arrive at Narita International Airport",
          category: "transport",
          description:
            "Clear customs and pick up your Suica IC card at the JR counter for seamless transit across Tokyo. Take the Narita Express to Shibuya Station.",
          duration: "2 hours",
        },
        {
          time: "12:00",
          name: "Check in at hotel",
          category: "transport",
          description: "Drop off luggage and freshen up before exploring the city.",
          duration: "30 min",
        },
      ],
      afternoon: [
        {
          time: "13:00",
          name: "Ichiran Ramen Shibuya",
          category: "food",
          description:
            "Start your Tokyo food journey with a bowl of rich tonkotsu ramen at Ichiran's famous solo-booth dining experience.",
          duration: "45 min",
          rating: 4.6,
          reviewCount: 15200,
          bookingPrice: "$12",
          alternatives: [
            {
              time: "13:00",
              name: "Fuunji Tsukemen Shinjuku",
              category: "food",
              description:
                "Queue-worthy dipping ramen with thick fish-based broth.",
              duration: "45 min",
              rating: 4.7,
              reviewCount: 8900,
              bookingPrice: "$11",
            },
            {
              time: "13:00",
              name: "Afuri Ramen Harajuku",
              category: "food",
              description:
                "Light yuzu shio ramen with citrus-infused clear broth.",
              duration: "40 min",
              rating: 4.5,
              reviewCount: 6200,
              bookingPrice: "$12",
            },
          ],
        },
        {
          time: "14:00",
          name: "Shibuya Crossing & Hachiko Statue",
          category: "culture",
          description:
            "Experience the world's busiest pedestrian crossing from Shibuya Sky observation deck.",
          duration: "1 hour",
          distanceFromPrevious: "0.3 km",
          walkingTime: "4 min",
          rating: 4.7,
          reviewCount: 24500,
        },
        {
          time: "15:30",
          name: "Meiji Jingu Shrine",
          category: "culture",
          description:
            "Walk through the towering torii gate into the forested grounds of this Shinto shrine dedicated to Emperor Meiji.",
          duration: "1.5 hours",
          distanceFromPrevious: "1.2 km",
          walkingTime: "15 min",
          rating: 4.8,
          reviewCount: 21000,
        },
      ],
      evening: [
        {
          time: "18:00",
          name: "Takeshita Street, Harajuku",
          category: "shopping",
          description:
            "Browse quirky fashion boutiques and pick up a rainbow cotton candy crepe.",
          duration: "1 hour",
          rating: 4.4,
          reviewCount: 18700,
        },
        {
          time: "19:30",
          name: "Gonpachi Nishi-Azabu",
          category: "food",
          description:
            "Dine at the restaurant that inspired the famous scene in Kill Bill.",
          duration: "1.5 hours",
          distanceFromPrevious: "2.5 km",
          walkingTime: "8 min by train",
          rating: 4.3,
          reviewCount: 11200,
          bookingPrice: "$45",
          bookingUrl: "https://www.gonpachi.jp/nishiazabu/",
        },
      ],
      tip: "Buy a 72-hour Tokyo Subway Pass at the airport for unlimited rides on Tokyo Metro and Toei Subway lines.",
    },
    {
      dayNumber: 2,
      date: "2026-04-11",
      title: "Temples, Tradition & Tsukiji",
      morning: [
        {
          time: "07:00",
          name: "Tsukiji Outer Market",
          category: "food",
          description:
            "Arrive early to explore the bustling outer market stalls. Try tamagoyaki and fresh uni on rice.",
          duration: "2 hours",
          rating: 4.6,
          reviewCount: 22800,
          bookingPrice: "$20-40",
        },
        {
          time: "09:30",
          name: "Senso-ji Temple, Asakusa",
          category: "culture",
          description:
            "Visit Tokyo's oldest Buddhist temple through the iconic Kaminarimon Thunder Gate.",
          duration: "1.5 hours",
          distanceFromPrevious: "3.5 km",
          walkingTime: "15 min by train",
          rating: 4.7,
          reviewCount: 25000,
        },
      ],
      afternoon: [
        {
          time: "13:00",
          name: "teamLab Borderless, Odaiba",
          category: "entertainment",
          description:
            "Immerse yourself in a world of interactive digital art across a massive 10,000-square-meter space.",
          duration: "2.5 hours",
          rating: 4.8,
          reviewCount: 19500,
          bookingPrice: "$30",
          bookingUrl: "https://www.teamlab.art/",
        },
        {
          time: "16:00",
          name: "Odaiba Seaside Park",
          category: "nature",
          description:
            "Stroll along the waterfront promenade with views of Rainbow Bridge.",
          duration: "1 hour",
          distanceFromPrevious: "0.5 km",
          walkingTime: "7 min",
          rating: 4.3,
          reviewCount: 11200,
        },
      ],
      evening: [
        {
          time: "19:00",
          name: "Shinjuku Golden Gai",
          category: "entertainment",
          description:
            "Explore the labyrinthine alleys of Shinjuku's Golden Gai, home to over 200 tiny bars.",
          duration: "2 hours",
          rating: 4.5,
          reviewCount: 9800,
        },
      ],
      tip: "teamLab Borderless tickets sell out fast. Book online at least a week in advance.",
    },
    {
      dayNumber: 3,
      date: "2026-04-12",
      title: "Day Trip to Kamakura",
      morning: [
        {
          time: "08:00",
          name: "Train to Kamakura",
          category: "transport",
          description:
            "Take the JR Yokosuka Line from Shibuya to Kamakura Station (about 1 hour).",
          duration: "1 hour",
        },
        {
          time: "09:15",
          name: "Kotoku-in (Great Buddha)",
          category: "culture",
          description:
            "Stand before the 13-meter-tall bronze Amida Buddha, one of Japan's most iconic landmarks.",
          duration: "45 min",
          rating: 4.6,
          reviewCount: 18200,
          bookingPrice: "$3",
        },
      ],
      afternoon: [
        {
          time: "12:00",
          name: "Komachi-dori Street Lunch",
          category: "food",
          description:
            "Browse the charming pedestrian street lined with cafes and street food vendors.",
          duration: "1.5 hours",
          rating: 4.4,
          reviewCount: 8900,
          bookingPrice: "$15",
        },
        {
          time: "14:30",
          name: "Hase-dera Temple",
          category: "culture",
          description:
            "Hillside temple with a 9-meter gilded Kannon statue and panoramic ocean views.",
          duration: "1 hour",
          rating: 4.7,
          reviewCount: 10500,
        },
      ],
      evening: [
        {
          time: "18:00",
          name: "Return to Tokyo & dinner in Shibuya",
          category: "food",
          description:
            "Head back to Tokyo and enjoy izakaya hopping in Shibuya backstreets.",
          duration: "2 hours",
          rating: 4.5,
          reviewCount: 6700,
          bookingPrice: "$30",
        },
      ],
      tip: "Buy the Enoshima-Kamakura Free Pass at Shinjuku Station for unlimited rides.",
    },
    {
      dayNumber: 4,
      date: "2026-04-13",
      title: "Imperial Gardens & Ginza",
      morning: [
        {
          time: "09:00",
          name: "Shinjuku Gyoen National Garden",
          category: "nature",
          description:
            "Wander through one of Tokyo's most beautiful parks featuring Japanese, English, and French gardens.",
          duration: "1.5 hours",
          rating: 4.7,
          reviewCount: 20300,
          bookingPrice: "$5",
        },
      ],
      afternoon: [
        {
          time: "12:30",
          name: "Ginza Lunch at Kyubey",
          category: "food",
          description:
            "Treat yourself to an omakase sushi experience at this legendary Ginza sushi counter.",
          duration: "1.5 hours",
          rating: 4.7,
          reviewCount: 6800,
          bookingPrice: "$80-120",
          bookingUrl: "https://www.kyubey.jp/",
        },
        {
          time: "14:30",
          name: "Ginza Shopping District",
          category: "shopping",
          description:
            "Browse flagship stores along Chuo-dori: Uniqlo 12-floor flagship, Itoya stationery paradise.",
          duration: "2 hours",
          distanceFromPrevious: "0.3 km",
          walkingTime: "4 min",
          rating: 4.5,
          reviewCount: 17400,
        },
      ],
      evening: [
        {
          time: "19:00",
          name: "Roppongi Yokocho",
          category: "food",
          description:
            "Atmospheric indoor food alley featuring 14 small restaurants under one roof.",
          duration: "1.5 hours",
          rating: 4.3,
          reviewCount: 5400,
          bookingPrice: "$25-35",
        },
      ],
      tip: "Ginza's main street becomes pedestrian-only on weekends from noon to 5 PM.",
    },
    {
      dayNumber: 5,
      date: "2026-04-14",
      title: "Toyosu, Yanaka & Farewell",
      morning: [
        {
          time: "06:00",
          name: "Toyosu Fish Market",
          category: "food",
          description:
            "Watch the famous tuna auction from the observation gallery, then enjoy the freshest sushi at the market restaurants.",
          duration: "2.5 hours",
          rating: 4.6,
          reviewCount: 17800,
          bookingPrice: "$30-50",
        },
        {
          time: "09:00",
          name: "Yanaka District",
          category: "culture",
          description:
            "Explore one of Tokyo's last remaining shitamachi old-town neighborhoods.",
          duration: "2 hours",
          rating: 4.5,
          reviewCount: 7300,
        },
      ],
      afternoon: [
        {
          time: "13:00",
          name: "Afuri Ramen, Ebisu",
          category: "food",
          description:
            "Final bowl of yuzu shio ramen at this beloved chain known for its light, citrus-infused broth.",
          duration: "45 min",
          rating: 4.5,
          reviewCount: 9400,
          bookingPrice: "$12",
        },
      ],
      evening: [
        {
          time: "16:30",
          name: "Depart from Narita or Haneda",
          category: "transport",
          description:
            "Head to the airport via Narita Express or Haneda monorail.",
          duration: "2 hours",
        },
      ],
      tip: "At Toyosu, the tuna auction viewing is first-come-first-served and the gallery opens at 5:30 AM.",
    },
  ],
  hotels: [
    {
      name: "MUJI Hotel Ginza",
      pricePerNight: "$180",
      rating: 4.5,
      bookingUrl: "https://hotel.muji.com/ginza/en/",
      image:
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80",
    },
    {
      name: "The Millennials Shibuya",
      pricePerNight: "$85",
      rating: 4.2,
      bookingUrl: "https://www.themillennials.jp/shibuya/",
      image:
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80",
    },
    {
      name: "Park Hyatt Tokyo",
      pricePerNight: "$450",
      rating: 4.8,
      bookingUrl: "https://www.hyatt.com/park-hyatt/tyoph-park-hyatt-tokyo",
      image:
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80",
    },
  ],
  flights: [
    {
      airline: "ANA (All Nippon Airways)",
      departure: "2026-04-10 10:30 LAX",
      arrival: "2026-04-11 14:45 NRT",
      price: "$850",
      bookingUrl: "https://www.ana.co.jp/en/us/",
      stops: 0,
    },
    {
      airline: "Japan Airlines",
      departure: "2026-04-10 13:00 LAX",
      arrival: "2026-04-11 17:15 HND",
      price: "$920",
      bookingUrl: "https://www.jal.co.jp/en/",
      stops: 0,
    },
  ],
  tours: [
    {
      name: "Tokyo Highlights Private Walking Tour",
      price: "$95",
      duration: "6 hours",
      rating: 4.9,
      bookingUrl: "https://www.viator.com/tours/Tokyo/Tokyo-Full-Day-Walking-Tour",
    },
    {
      name: "Authentic Japanese Cooking Class in a Local Home",
      price: "$75",
      duration: "3 hours",
      rating: 4.8,
      bookingUrl: "https://www.viator.com/tours/Tokyo/Japanese-Cooking-Class",
    },
    {
      name: "Mt. Fuji, Hakone & Lake Ashi Day Trip",
      price: "$130",
      duration: "11 hours",
      rating: 4.6,
      bookingUrl: "https://www.viator.com/tours/Tokyo/Mt-Fuji-Day-Trip",
    },
  ],
  tips: [
    "Cash is still king in many small restaurants and shops. Withdraw yen from 7-Eleven ATMs which accept international cards with no fuss.",
    "Download the Suica or Pasmo app on your phone for contactless transit payments. Tap in and out at every station gate.",
    "Bow slightly when entering shops and say 'sumimasen' (excuse me) to get attention politely.",
    "Trains stop running around midnight. Plan your last ride carefully or budget for a taxi.",
    "Carry a small bag for your trash. Public trash cans are rare in Tokyo, but you can usually find bins at convenience stores and train stations.",
  ],
};
