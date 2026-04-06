import type { Itinerary } from "@/types/itinerary";

export const MOCK_TOKYO_ITINERARY: Itinerary = {
  id: "mock-tokyo-001",
  shareId: "tokyo-demo-5d",
  destination: "Tokyo, Japan",
  startDate: "2026-04-10",
  endDate: "2026-04-15",
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
          description:
            "Drop off luggage and freshen up before exploring the city.",
          duration: "30 min",
        },
      ],
      afternoon: [
        {
          time: "13:00",
          name: "Ichiran Ramen Shibuya",
          category: "food",
          description:
            "Start your Tokyo food journey with a bowl of rich tonkotsu ramen at Ichiran's famous solo-booth dining experience. Customize your broth richness, noodle firmness, and spice level.",
          duration: "45 min",
          bookingPrice: "$12",
          rating: 4.6,
          reviewCount: 15200,
          alternatives: [
            {
              time: "13:00",
              name: "Fuunji Tsukemen Shinjuku",
              category: "food",
              description:
                "Queue-worthy dipping ramen with thick, rich fish-based broth. The tsukemen style lets you dip cold noodles into hot concentrated soup for maximum flavor.",
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
                "Light and refreshing yuzu shio ramen with a citrus-infused clear broth. A perfect alternative if you prefer something lighter than heavy tonkotsu.",
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
            "Experience the world's busiest pedestrian crossing from the Shibuya Sky observation deck or from Starbucks on the second floor of the TSUTAYA building. Pay respects to the loyal dog Hachiko at his bronze statue outside the station.",
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
            "Walk through the towering torii gate into the forested grounds of this Shinto shrine dedicated to Emperor Meiji. Write a wish on an ema wooden plaque and enjoy the tranquil contrast to the surrounding city.",
          duration: "1.5 hours",
          distanceFromPrevious: "1.2 km",
          walkingTime: "15 min",
          rating: 4.8,
          reviewCount: 21000,
          alternatives: [
            {
              time: "15:30",
              name: "Nezu Museum",
              category: "culture",
              description:
                "A serene museum housing pre-modern Japanese and East Asian art in a stunning building designed by Kengo Kuma. The lush garden with ponds and teahouses is worth the visit alone.",
              duration: "1.5 hours",
              rating: 4.6,
              reviewCount: 5400,
              bookingPrice: "$10",
            },
            {
              time: "15:30",
              name: "Yoyogi Park",
              category: "nature",
              description:
                "A sprawling green oasis next to Harajuku where locals gather for picnics, street performances, and weekend flea markets. Great for cherry blossoms in spring.",
              duration: "1 hour",
              rating: 4.5,
              reviewCount: 12300,
            },
          ],
        },
      ],
      evening: [
        {
          time: "18:00",
          name: "Takeshita Street, Harajuku",
          category: "shopping",
          description:
            "Browse quirky fashion boutiques, pick up a rainbow cotton candy crepe, and soak in Harajuku's vibrant youth culture along this iconic pedestrian street.",
          duration: "1 hour",
          rating: 4.4,
          reviewCount: 18700,
        },
        {
          time: "19:30",
          name: "Gonpachi Nishi-Azabu",
          category: "food",
          description:
            "Dine at the restaurant that inspired the famous scene in Kill Bill. Enjoy yakitori, soba noodles, and sashimi in a stunning two-story Edo-period interior.",
          duration: "1.5 hours",
          bookingPrice: "$45",
          bookingUrl: "https://www.gonpachi.jp/nishiazabu/",
          distanceFromPrevious: "2.5 km",
          walkingTime: "8 min by train",
          rating: 4.3,
          reviewCount: 11200,
          alternatives: [
            {
              time: "19:30",
              name: "Torishiki Meguro",
              category: "food",
              description:
                "A Michelin-starred yakitori restaurant where every skewer is grilled to perfection over binchotan charcoal. The intimate counter seating lets you watch the master at work.",
              duration: "1.5 hours",
              rating: 4.8,
              reviewCount: 4200,
              bookingPrice: "$55",
            },
            {
              time: "19:30",
              name: "Butagumi Roppongi",
              category: "food",
              description:
                "A tonkatsu specialist serving premium heritage pork cutlets from different Japanese regions. The deep-fried perfection pairs beautifully with house-made sauces and fresh shredded cabbage.",
              duration: "1 hour",
              rating: 4.5,
              reviewCount: 3800,
              bookingPrice: "$35",
            },
          ],
        },
        {
          time: "21:30",
          name: "Golden Gai Bar Hopping",
          category: "entertainment",
          description:
            "Explore the labyrinthine alleys of Shinjuku's Golden Gai, home to over 200 tiny bars each seating 6-10 people. Start with Bar Albatross for its chandelier-lit atmosphere.",
          duration: "2 hours",
          distanceFromPrevious: "3.0 km",
          walkingTime: "12 min by train",
          rating: 4.5,
          reviewCount: 9800,
        },
      ],
      tip: "Buy a 72-hour Tokyo Subway Pass at the airport for unlimited rides on Tokyo Metro and Toei Subway lines. It pays for itself within a few trips.",
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
            "Arrive early to explore the bustling outer market stalls. Try tamagoyaki (Japanese rolled omelet) at Tsukiji Yamacho, fresh uni on rice at Kanno Uni, and the legendary tuna sushi at Sushi Dai.",
          duration: "2 hours",
          bookingPrice: "$20-40",
          rating: 4.6,
          reviewCount: 22800,
          alternatives: [
            {
              time: "07:00",
              name: "Toyosu Market Visitor Course",
              category: "food",
              description:
                "The successor to the inner Tsukiji Market with modern facilities and observation galleries overlooking the auction floor. The market restaurants serve ultra-fresh sushi right at the source.",
              duration: "2 hours",
              rating: 4.5,
              reviewCount: 14300,
              bookingPrice: "$25-45",
            },
            {
              time: "07:00",
              name: "Yanaka Morning Walk & Breakfast",
              category: "food",
              description:
                "Start the day in old-town Yanaka with fresh bread from Kayaba Coffee, a historic kissaten converted into a charming cafe. Stroll the quiet temple streets before the crowds arrive.",
              duration: "1.5 hours",
              rating: 4.4,
              reviewCount: 3200,
              bookingPrice: "$10-15",
            },
          ],
        },
        {
          time: "09:30",
          name: "Senso-ji Temple, Asakusa",
          category: "culture",
          description:
            "Visit Tokyo's oldest Buddhist temple through the iconic Kaminarimon (Thunder Gate). Walk along Nakamise-dori shopping street, draw an omikuji fortune slip, and admire the five-story pagoda.",
          duration: "1.5 hours",
          distanceFromPrevious: "3.5 km",
          walkingTime: "15 min by train",
          rating: 4.7,
          reviewCount: 25000,
        },
        {
          time: "11:30",
          name: "Sumida River Cruise to Odaiba",
          category: "entertainment",
          description:
            "Board the futuristic Himiko water bus designed by manga artist Leiji Matsumoto. Cruise down the Sumida River with views of Rainbow Bridge and the Tokyo skyline.",
          duration: "1 hour",
          bookingPrice: "$10",
          distanceFromPrevious: "0.6 km",
          walkingTime: "8 min",
          rating: 4.4,
          reviewCount: 7600,
        },
      ],
      afternoon: [
        {
          time: "13:00",
          name: "teamLab Borderless, Odaiba",
          category: "entertainment",
          description:
            "Immerse yourself in a world of interactive digital art across a massive 10,000-square-meter space. Flowers bloom at your feet, waterfalls cascade around you, and artworks flow from room to room.",
          duration: "2.5 hours",
          bookingPrice: "$30",
          bookingUrl: "https://www.teamlab.art/",
          rating: 4.8,
          reviewCount: 19500,
          alternatives: [
            {
              time: "13:00",
              name: "teamLab Planets, Toyosu",
              category: "entertainment",
              description:
                "A barefoot immersive experience where you wade through water and walk through fields of digital flowers. More focused and intimate than Borderless with fewer but deeper installations.",
              duration: "2 hours",
              rating: 4.7,
              reviewCount: 16800,
              bookingPrice: "$28",
            },
            {
              time: "13:00",
              name: "Miraikan (National Museum of Emerging Science)",
              category: "culture",
              description:
                "Japan's premier science museum featuring the humanoid robot ASIMO, a giant globe display of real-time earth data, and interactive exhibits on space exploration and biotechnology.",
              duration: "2.5 hours",
              rating: 4.3,
              reviewCount: 8400,
              bookingPrice: "$6",
            },
          ],
        },
        {
          time: "16:00",
          name: "Odaiba Seaside Park",
          category: "nature",
          description:
            "Stroll along the waterfront promenade with views of Rainbow Bridge and the Tokyo skyline. Visit the life-size Unicorn Gundam statue at DiverCity.",
          duration: "1 hour",
          distanceFromPrevious: "0.5 km",
          walkingTime: "7 min",
          rating: 4.3,
          reviewCount: 11200,
        },
      ],
      evening: [
        {
          time: "18:00",
          name: "Akihabara Electric Town",
          category: "shopping",
          description:
            "Explore multi-story electronics shops, retro game arcades, anime figure stores, and manga cafes in Tokyo's famed otaku district. Visit Super Potato for vintage gaming nostalgia.",
          duration: "1.5 hours",
          rating: 4.5,
          reviewCount: 16300,
        },
        {
          time: "20:00",
          name: "Uobei Sushi Shibuya",
          category: "food",
          description:
            "Order sushi on a touchscreen tablet and watch your plates zoom to you on a high-speed conveyor belt. Plates start at 110 yen, making it one of the best budget sushi experiences in Tokyo.",
          duration: "1 hour",
          bookingPrice: "$15",
          distanceFromPrevious: "4.0 km",
          walkingTime: "15 min by train",
          rating: 4.2,
          reviewCount: 13400,
          alternatives: [
            {
              time: "20:00",
              name: "Sushi no Midori Shibuya",
              category: "food",
              description:
                "Consistently ranked among the best value sushi in Tokyo with generous cuts of fresh fish at reasonable prices. Expect a queue but the wait is always worth it.",
              duration: "1 hour",
              rating: 4.5,
              reviewCount: 9800,
              bookingPrice: "$20",
            },
            {
              time: "20:00",
              name: "Genki Sushi Shibuya",
              category: "food",
              description:
                "Another fun conveyor belt sushi spot where orders arrive via express lane on a miniature bullet train. Great variety of creative rolls alongside traditional nigiri.",
              duration: "45 min",
              rating: 4.3,
              reviewCount: 7200,
              bookingPrice: "$15",
            },
          ],
        },
        {
          time: "21:30",
          name: "Shibuya Sky Observation Deck",
          category: "entertainment",
          description:
            "Take the escalator to the rooftop of Shibuya Scramble Square for a stunning 360-degree panorama of illuminated Tokyo. The open-air sky stage on the 46th floor is unforgettable at night.",
          duration: "1 hour",
          bookingPrice: "$18",
          bookingUrl: "https://www.shibuya-scramble-square.com/sky/",
          distanceFromPrevious: "0.2 km",
          walkingTime: "3 min",
          rating: 4.6,
          reviewCount: 14100,
        },
      ],
      tip: "teamLab Borderless tickets sell out fast. Book online at least a week in advance and wear dark clothing to better blend into the immersive projections.",
    },
    {
      dayNumber: 3,
      date: "2026-04-12",
      title: "Day Trip to Kamakura & Enoshima",
      morning: [
        {
          time: "08:00",
          name: "Train to Kamakura",
          category: "transport",
          description:
            "Take the JR Yokosuka Line from Shibuya to Kamakura Station (about 1 hour). Grab an onigiri from a konbini for breakfast on the train.",
          duration: "1 hour",
        },
        {
          time: "09:15",
          name: "Kotoku-in (Great Buddha)",
          category: "culture",
          description:
            "Stand before the 13-meter-tall bronze Amida Buddha, one of Japan's most iconic landmarks. For an extra 50 yen, step inside the hollow statue to see its construction.",
          duration: "45 min",
          bookingPrice: "$3",
          distanceFromPrevious: "1.5 km",
          walkingTime: "20 min",
          rating: 4.6,
          reviewCount: 18200,
        },
        {
          time: "10:30",
          name: "Hase-dera Temple",
          category: "culture",
          description:
            "Explore this hillside temple known for its 9-meter gilded wooden Kannon statue, serene Japanese gardens, and panoramic ocean views from the observation terrace.",
          duration: "1 hour",
          distanceFromPrevious: "0.4 km",
          walkingTime: "6 min",
          rating: 4.7,
          reviewCount: 10500,
        },
      ],
      afternoon: [
        {
          time: "12:00",
          name: "Komachi-dori Street Lunch",
          category: "food",
          description:
            "Browse this charming pedestrian street lined with cafes, souvenir shops, and street food vendors. Try the famous Kamakura croquettes and matcha soft-serve ice cream.",
          duration: "1.5 hours",
          bookingPrice: "$15",
          rating: 4.4,
          reviewCount: 8900,
          alternatives: [
            {
              time: "12:00",
              name: "Bowls Kamakura",
              category: "food",
              description:
                "A cozy restaurant near Tsurugaoka Hachimangu specializing in fresh shirasu (whitebait) rice bowls. The two-color bowl with raw and boiled shirasu is the signature dish.",
              duration: "1 hour",
              rating: 4.5,
              reviewCount: 4100,
              bookingPrice: "$14",
            },
            {
              time: "12:00",
              name: "Matsubara-an Kamakura",
              category: "food",
              description:
                "Handmade soba noodles in a traditional setting near the Great Buddha. The tempura soba set with local seasonal vegetables is a Kamakura specialty worth seeking out.",
              duration: "1 hour",
              rating: 4.6,
              reviewCount: 3500,
              bookingPrice: "$16",
            },
          ],
        },
        {
          time: "14:00",
          name: "Enoden Train to Enoshima",
          category: "transport",
          description:
            "Ride the vintage Enoden streetcar along the coast, one of Japan's most scenic short railway lines. The stretch between Kamakurakokomae and Shichirigahama runs right beside the ocean.",
          duration: "30 min",
        },
        {
          time: "14:45",
          name: "Enoshima Island",
          category: "nature",
          description:
            "Cross the bridge to this sacred island. Climb through the Benzaiten shrine complex, explore the Sea Candle lighthouse for coastal views, and visit the Iwaya sea caves carved by centuries of waves.",
          duration: "2.5 hours",
          distanceFromPrevious: "0.3 km",
          walkingTime: "5 min",
          rating: 4.5,
          reviewCount: 14700,
        },
      ],
      evening: [
        {
          time: "17:30",
          name: "Enoshima Sunset",
          category: "nature",
          description:
            "Watch the sun set behind Mt. Fuji from the western shore of Enoshima. On clear days, the silhouette of Fuji against the orange sky is a once-in-a-lifetime sight.",
          duration: "45 min",
          rating: 4.8,
          reviewCount: 5200,
        },
        {
          time: "19:00",
          name: "Tobiccho Enoshima",
          category: "food",
          description:
            "Feast on Enoshima's specialty: shirasu (whitebait) rice bowls served raw, boiled, or mixed. This bustling restaurant near the bridge is the most popular spot for the local delicacy.",
          duration: "1 hour",
          bookingPrice: "$18",
          distanceFromPrevious: "0.5 km",
          walkingTime: "8 min",
          rating: 4.3,
          reviewCount: 6700,
        },
        {
          time: "20:30",
          name: "Return to Tokyo",
          category: "transport",
          description:
            "Take the Odakyu Line from Katase-Enoshima back to Shinjuku Station. The express train takes about 70 minutes.",
          duration: "1.5 hours",
        },
      ],
      tip: "Buy the Enoshima-Kamakura Free Pass at Shinjuku Station for unlimited rides on the Odakyu Line and Enoden, plus discounts at local attractions.",
    },
    {
      dayNumber: 4,
      date: "2026-04-13",
      title: "Imperial Gardens, Ginza & Roppongi",
      morning: [
        {
          time: "08:30",
          name: "Shinjuku Gyoen National Garden",
          category: "nature",
          description:
            "Wander through one of Tokyo's most beautiful parks, featuring a Japanese traditional garden, English landscape garden, and French formal garden. Cherry blossoms in spring make this place magical.",
          duration: "1.5 hours",
          bookingPrice: "$5",
          rating: 4.7,
          reviewCount: 20300,
        },
        {
          time: "10:30",
          name: "Imperial Palace East Gardens",
          category: "nature",
          description:
            "Explore the former grounds of Edo Castle, now a serene public garden. Walk along the ancient moat, see the stone foundations of the castle keep, and enjoy seasonal flowers in the Ninomaru Garden.",
          duration: "1.5 hours",
          distanceFromPrevious: "5.0 km",
          walkingTime: "18 min by train",
          rating: 4.5,
          reviewCount: 15600,
        },
      ],
      afternoon: [
        {
          time: "12:30",
          name: "Ginza Lunch at Kyubey",
          category: "food",
          description:
            "Treat yourself to an omakase sushi experience at this legendary Ginza sushi counter, operating since 1935. Watch master chefs craft each piece with precision and seasonal ingredients.",
          duration: "1.5 hours",
          bookingPrice: "$80-120",
          bookingUrl: "https://www.kyubey.jp/",
          rating: 4.7,
          reviewCount: 6800,
          alternatives: [
            {
              time: "12:30",
              name: "Sushi Aoki Ginza",
              category: "food",
              description:
                "A refined Edomae sushi counter where the third-generation chef prepares seasonal nigiri with meticulous technique. More intimate and slightly less expensive than the famous neighbors.",
              duration: "1.5 hours",
              rating: 4.6,
              reviewCount: 3200,
              bookingPrice: "$60-90",
            },
            {
              time: "12:30",
              name: "Tempura Kondo Ginza",
              category: "food",
              description:
                "One of Tokyo's finest tempura restaurants where chef Fumio Kondo elevates seasonal vegetables into crispy art. The sweet potato tempura is legendary among food lovers.",
              duration: "1 hour",
              rating: 4.8,
              reviewCount: 4500,
              bookingPrice: "$70-100",
            },
          ],
        },
        {
          time: "14:30",
          name: "Ginza Shopping District",
          category: "shopping",
          description:
            "Browse flagship stores along Chuo-dori: the Uniqlo 12-floor flagship, Itoya stationery paradise, Ginza Six luxury mall, and the iconic Wako department store with its clock tower.",
          duration: "2 hours",
          distanceFromPrevious: "0.3 km",
          walkingTime: "4 min",
          rating: 4.5,
          reviewCount: 17400,
        },
        {
          time: "17:00",
          name: "Mori Art Museum, Roppongi Hills",
          category: "culture",
          description:
            "Visit contemporary art exhibitions on the 53rd floor, then step onto the rooftop Sky Deck for an unobstructed 360-degree view of Tokyo, including Tokyo Tower glowing orange at dusk.",
          duration: "1.5 hours",
          bookingPrice: "$20",
          bookingUrl: "https://www.mori.art.museum/en/",
          distanceFromPrevious: "2.8 km",
          walkingTime: "10 min by train",
          rating: 4.5,
          reviewCount: 12600,
        },
      ],
      evening: [
        {
          time: "19:00",
          name: "Roppongi Yokocho",
          category: "food",
          description:
            "Dive into this atmospheric indoor food alley featuring 14 small restaurants under one roof. Sample different regional Japanese cuisines from Hokkaido seafood to Kyushu ramen.",
          duration: "1.5 hours",
          bookingPrice: "$25-35",
          rating: 4.3,
          reviewCount: 5400,
          alternatives: [
            {
              time: "19:00",
              name: "Inakaya Roppongi",
              category: "food",
              description:
                "A theatrical robatayaki experience where chefs seated behind a counter of fresh ingredients grill your selections over charcoal and pass dishes to you on long wooden paddles.",
              duration: "1.5 hours",
              rating: 4.4,
              reviewCount: 4800,
              bookingPrice: "$40-60",
            },
            {
              time: "19:00",
              name: "Tofuya Ukai Shiba",
              category: "food",
              description:
                "An elegant tofu kaiseki restaurant set in a beautiful traditional garden at the foot of Tokyo Tower. Multi-course meals showcase the delicate art of handmade tofu.",
              duration: "2 hours",
              rating: 4.7,
              reviewCount: 3600,
              bookingPrice: "$50-70",
            },
          ],
        },
        {
          time: "21:00",
          name: "Tokyo Tower Night Illumination",
          category: "entertainment",
          description:
            "Visit Tokyo Tower's main deck at 150 meters for sparkling night views. The tower's orange lattice structure, inspired by the Eiffel Tower, glows beautifully against the dark sky.",
          duration: "1 hour",
          bookingPrice: "$12",
          distanceFromPrevious: "0.8 km",
          walkingTime: "10 min",
          rating: 4.5,
          reviewCount: 19800,
        },
        {
          time: "22:30",
          name: "Convenience Store Late Night Snack Run",
          category: "food",
          description:
            "Experience the wonder of Japanese konbini culture at a 7-Eleven or Lawson. Try onigiri, melon pan, egg sandwiches, and limited-edition seasonal treats. Japanese convenience stores are a culinary destination in themselves.",
          duration: "30 min",
          bookingPrice: "$5",
          distanceFromPrevious: "1.5 km",
          walkingTime: "5 min by train",
          rating: 4.2,
          reviewCount: 3100,
        },
      ],
      tip: "Ginza's main street Chuo-dori becomes a pedestrian-only zone on weekends from noon to 5 PM. Time your visit to stroll freely down the wide boulevard.",
    },
    {
      dayNumber: 5,
      date: "2026-04-14",
      title: "Toyosu, Yanaka & Farewell Tokyo",
      morning: [
        {
          time: "06:00",
          name: "Toyosu Fish Market",
          category: "food",
          description:
            "Watch the famous tuna auction from the observation gallery (arrive by 5:30 AM for best views). Then head to the market restaurants for the freshest sushi breakfast in the world at Sushi Dai or Daiwa Sushi.",
          duration: "2.5 hours",
          bookingPrice: "$30-50",
          rating: 4.6,
          reviewCount: 17800,
          alternatives: [
            {
              time: "06:00",
              name: "Tsukiji Outer Market Breakfast Tour",
              category: "food",
              description:
                "While the inner market moved to Toyosu, the outer market remains a foodie paradise. Graze through stalls for fresh tamago, grilled scallops, and tuna sashimi at dawn.",
              duration: "2 hours",
              rating: 4.5,
              reviewCount: 22800,
              bookingPrice: "$20-35",
            },
            {
              time: "06:00",
              name: "Onigiri Asakusa Yadoroku",
              category: "food",
              description:
                "Tokyo's oldest onigiri shop, open since 1954, serves hand-shaped rice balls with premium fillings in a tiny nostalgic setting. A simple but unforgettable Japanese breakfast.",
              duration: "45 min",
              rating: 4.7,
              reviewCount: 4600,
              bookingPrice: "$8-12",
            },
          ],
        },
        {
          time: "09:00",
          name: "Yanaka District",
          category: "culture",
          description:
            "Explore one of Tokyo's last remaining shitamachi (old town) neighborhoods. Wander through Yanaka Cemetery's cherry tree avenue, browse the nostalgic Yanaka Ginza shopping street, and visit tiny temples tucked between wooden houses.",
          duration: "2 hours",
          distanceFromPrevious: "6.0 km",
          walkingTime: "20 min by train",
          rating: 4.5,
          reviewCount: 7300,
        },
      ],
      afternoon: [
        {
          time: "11:30",
          name: "Nezu Shrine",
          category: "culture",
          description:
            "Discover this hidden gem with a stunning tunnel of vermillion torii gates rivaling Kyoto's Fushimi Inari but without the crowds. The azalea garden with 3,000 bushes is spectacular in spring.",
          duration: "1 hour",
          rating: 4.6,
          reviewCount: 6100,
        },
        {
          time: "13:00",
          name: "Afuri Ramen, Ebisu",
          category: "food",
          description:
            "Enjoy a final bowl of yuzu shio ramen at this beloved chain known for its light, citrus-infused broth. A refreshing departure from the heavy tonkotsu style and a perfect farewell meal.",
          duration: "45 min",
          bookingPrice: "$12",
          distanceFromPrevious: "5.5 km",
          walkingTime: "18 min by train",
          rating: 4.5,
          reviewCount: 9400,
          alternatives: [
            {
              time: "13:00",
              name: "Ebisu Imaiya",
              category: "food",
              description:
                "A lively izakaya near Ebisu Station serving charcoal-grilled yakitori and seasonal small plates. The relaxed atmosphere and craft beer selection make it a great casual lunch spot.",
              duration: "1 hour",
              rating: 4.3,
              reviewCount: 2800,
              bookingPrice: "$15",
            },
            {
              time: "13:00",
              name: "Tonkatsu Maisen Aoyama",
              category: "food",
              description:
                "Set in a converted bathhouse, this tonkatsu institution serves perfectly fried kurobuta pork cutlets. The lunch sets with miso soup and unlimited cabbage are excellent value.",
              duration: "1 hour",
              rating: 4.6,
              reviewCount: 7800,
              bookingPrice: "$16",
            },
          ],
        },
        {
          time: "14:30",
          name: "Last-minute souvenir shopping at Tokyo Station",
          category: "shopping",
          description:
            "Browse Tokyo Character Street and First Avenue for exclusive character goods, pick up beautifully packaged wagashi sweets at the Gransta underground mall, and grab Tokyo Banana for friends back home.",
          duration: "1.5 hours",
          distanceFromPrevious: "4.5 km",
          walkingTime: "15 min by train",
          rating: 4.4,
          reviewCount: 13200,
        },
      ],
      evening: [
        {
          time: "16:30",
          name: "Depart from Narita or Haneda Airport",
          category: "transport",
          description:
            "Head to the airport via Narita Express or Haneda monorail. Allow at least 2 hours before your flight for check-in and duty-free shopping.",
          duration: "2 hours",
        },
      ],
      tip: "At Toyosu, the tuna auction viewing is first-come-first-served and the gallery opens at 5:30 AM. For restaurants, queues start before 6 AM on weekends. Weekdays are less crowded.",
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
      bookingUrl:
        "https://www.viator.com/tours/Tokyo/Tokyo-Full-Day-Walking-Tour",
    },
    {
      name: "Authentic Japanese Cooking Class in a Local Home",
      price: "$75",
      duration: "3 hours",
      rating: 4.8,
      bookingUrl:
        "https://www.viator.com/tours/Tokyo/Japanese-Cooking-Class",
    },
    {
      name: "Mt. Fuji, Hakone & Lake Ashi Day Trip",
      price: "$130",
      duration: "11 hours",
      rating: 4.6,
      bookingUrl:
        "https://www.viator.com/tours/Tokyo/Mt-Fuji-Day-Trip",
    },
  ],
  tips: [
    "Cash is still king in many small restaurants and shops. Withdraw yen from 7-Eleven ATMs which accept international cards with no fuss.",
    "Download the Suica or Pasmo app on your phone for contactless transit payments. Tap in and out at every station gate.",
    "Bow slightly when entering shops and say 'sumimasen' (excuse me) to get attention politely. A small nod when receiving change shows respect.",
    "Trains stop running around midnight. Plan your last ride carefully or budget for a taxi. Late-night taxis from Shibuya to Shinjuku cost around 1,500 yen.",
    "Carry a small bag for your trash. Public trash cans are rare in Tokyo, but you can usually find bins at convenience stores and train stations.",
  ],
};
