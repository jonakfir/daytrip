/**
 * Centralized SEO constants and helpers.
 *
 * Set NEXT_PUBLIC_SITE_URL in your Vercel env to your real production domain
 * (e.g. https://daytrip.app). The fallback is only safe for local dev.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://daytrip-ai.com";

export const SITE_NAME = "Daytrip";

export const SITE_TAGLINE = "AI Travel Itinerary Generator";

export const SITE_DESCRIPTION =
  "Plan beautiful, personalized day-by-day trips in seconds. Daytrip uses AI to design itineraries with real restaurants, hotels, and activities — complete with bookable flights and stays.";

export const DEFAULT_OG_IMAGE = "/og-image.png";

export const TWITTER_HANDLE = "@DaytripAI";

export function absoluteUrl(path: string = "/"): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${SITE_URL}${path}`;
}
