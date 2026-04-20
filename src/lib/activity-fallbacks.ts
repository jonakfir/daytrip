import type { Activity } from "@/types/itinerary";

type Category = Activity["category"];

const POOL: Record<Category, Omit<Activity, "time">[]> = {
  food: [
    {
      name: "Local neighborhood bistro",
      category: "food",
      description:
        "Duck into a small, family-run spot a couple of blocks off the main tourist drag for a slower, more local meal.",
      duration: "1 hour",
      rating: 4.5,
      reviewCount: 1200,
    },
    {
      name: "Street-food market tour",
      category: "food",
      description:
        "Graze across 4-5 stalls in a nearby market — dumplings, grilled skewers, a sweet finish, and something you'd never order on your own.",
      duration: "1.5 hours",
      rating: 4.6,
      reviewCount: 3400,
    },
    {
      name: "Chef-led tasting menu",
      category: "food",
      description:
        "Small prix-fixe at a well-reviewed neighborhood kitchen — 5 courses, seasonal, usually better value than the headline names.",
      duration: "2 hours",
      rating: 4.7,
      reviewCount: 890,
    },
  ],
  culture: [
    {
      name: "Off-the-list museum or gallery",
      category: "culture",
      description:
        "A quieter cultural stop the big guidebooks tend to skip — usually less crowded and more rewarding if you give it an hour.",
      duration: "1.5 hours",
      rating: 4.6,
      reviewCount: 2100,
    },
    {
      name: "Historic-quarter walking tour",
      category: "culture",
      description:
        "A guided 90-minute walk through an older district — architecture, backstory, one great photo spot you wouldn't have found.",
      duration: "1.5 hours",
      rating: 4.7,
      reviewCount: 5400,
    },
    {
      name: "Neighborhood landmark visit",
      category: "culture",
      description:
        "A nearby site with strong local significance — shorter queue than the headline monument, and often free or close to it.",
      duration: "1 hour",
      rating: 4.5,
      reviewCount: 3200,
    },
  ],
  shopping: [
    {
      name: "Independent boutique crawl",
      category: "shopping",
      description:
        "Hit 3-4 local designers and small shops in the same neighborhood instead of the main retail strip.",
      duration: "1.5 hours",
      rating: 4.4,
      reviewCount: 870,
    },
    {
      name: "Weekend flea market",
      category: "shopping",
      description:
        "Vintage, antiques, and local crafts. Bring cash, plan to haggle, leave room in your bag.",
      duration: "2 hours",
      rating: 4.5,
      reviewCount: 1600,
    },
    {
      name: "Artisan workshop visit",
      category: "shopping",
      description:
        "A working studio — leatherwork, ceramics, or prints — where you can watch the makers and buy direct.",
      duration: "1 hour",
      rating: 4.7,
      reviewCount: 420,
    },
  ],
  nature: [
    {
      name: "Riverside or coastal walk",
      category: "nature",
      description:
        "A flat, scenic walk along the water — good at sunset, zero fitness required, ends somewhere you can get a coffee.",
      duration: "1 hour",
      rating: 4.6,
      reviewCount: 980,
    },
    {
      name: "Botanic garden or urban park",
      category: "nature",
      description:
        "Green break from the concrete. Wander, sit, read a few info placards. Bring water.",
      duration: "1.5 hours",
      rating: 4.5,
      reviewCount: 2300,
    },
    {
      name: "Scenic viewpoint hike",
      category: "nature",
      description:
        "Short uphill to a lookout — 30-45 minutes each way, one very good photo, back in time for dinner.",
      duration: "2 hours",
      rating: 4.7,
      reviewCount: 1100,
    },
  ],
  entertainment: [
    {
      name: "Live music at a local venue",
      category: "entertainment",
      description:
        "Small club or jazz bar with a cover charge under $20. Shows what the city actually sounds like after dark.",
      duration: "2 hours",
      rating: 4.5,
      reviewCount: 640,
    },
    {
      name: "Neighborhood pub crawl",
      category: "entertainment",
      description:
        "Three stops in one walkable area — no party-bus energy, just good beer/wine lists and local crowd.",
      duration: "2.5 hours",
      rating: 4.4,
      reviewCount: 1200,
    },
    {
      name: "Rooftop sunset drinks",
      category: "entertainment",
      description:
        "Up high somewhere with a view. Arrive 30 min before sunset, order slowly, stay for the city lights.",
      duration: "1.5 hours",
      rating: 4.6,
      reviewCount: 2400,
    },
  ],
  transport: [],
};

/**
 * Deterministic fallback alternatives based on the activity's category.
 * Used when the activity has no `alternatives` array AND the swap API is
 * unreachable (e.g., unauthenticated demo users). Keeps the advertised
 * "Every activity has a Change button" promise working offline.
 */
export function getFallbackAlternatives(activity: Activity): Activity[] {
  const pool = POOL[activity.category] ?? [];
  return pool.map((p) => ({ ...p, time: activity.time }));
}
