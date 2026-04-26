import { z } from "zod";

export const SocialPlatform = z.enum(["tiktok", "instagram", "youtube_shorts"]);
export type SocialPlatform = z.infer<typeof SocialPlatform>;

// TikTok oEmbed — https://developers.tiktok.com/doc/embed-videos
// Response fields we rely on are stable; unknown fields are passed through.
export const TikTokOEmbedResponse = z
  .object({
    version: z.string().optional(),
    type: z.literal("video").optional(),
    title: z.string().optional(),
    author_name: z.string().optional(),
    author_url: z.string().url().optional(),
    author_unique_id: z.string().optional(),
    provider_name: z.string().optional(),
    provider_url: z.string().url().optional(),
    thumbnail_url: z.string().url().optional(),
    thumbnail_width: z.number().optional(),
    thumbnail_height: z.number().optional(),
    html: z.string(),
    width: z.union([z.number(), z.string()]).optional(),
    height: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough();
export type TikTokOEmbedResponse = z.infer<typeof TikTokOEmbedResponse>;

// Instagram oEmbed — https://developers.facebook.com/docs/instagram/oembed
// Requires a Facebook App access token.
export const InstagramOEmbedResponse = z
  .object({
    version: z.string().optional(),
    author_name: z.string().optional(),
    author_url: z.string().url().optional(),
    provider_name: z.string().optional(),
    provider_url: z.string().url().optional(),
    thumbnail_url: z.string().url().optional(),
    thumbnail_width: z.number().optional(),
    thumbnail_height: z.number().optional(),
    title: z.string().optional(),
    html: z.string(),
    width: z.union([z.number(), z.string()]).optional(),
    height: z.union([z.number(), z.string()]).nullable().optional(),
  })
  .passthrough();
export type InstagramOEmbedResponse = z.infer<typeof InstagramOEmbedResponse>;

// Normalized shape the rest of the app consumes. Platform-specific
// quirks get reconciled at the edge so no downstream code branches
// on platform for rendering.
export const NormalizedOEmbed = z.object({
  platform: SocialPlatform,
  sourceUrl: z.string().url(),
  providerVideoId: z.string(),
  embedHtml: z.string(),
  thumbnailUrl: z.string().url().optional(),
  authorName: z.string().optional(),
  authorUrl: z.string().url().optional(),
  title: z.string().optional(),
});
export type NormalizedOEmbed = z.infer<typeof NormalizedOEmbed>;

// URL validators. Kept permissive on host (accept short links + mobile
// hosts) but strict on structure so we can extract a provider_video_id.
const TIKTOK_PATTERNS: Array<{ re: RegExp; idGroup: number }> = [
  // Canonical: https://www.tiktok.com/@user/video/1234567890
  { re: /tiktok\.com\/@[^/]+\/video\/(\d+)/i, idGroup: 1 },
  // Short: https://vm.tiktok.com/ZMabc123/ or https://vt.tiktok.com/...
  // Short links don't expose the numeric id until resolved; we key on the
  // short slug for dedupe and let oEmbed resolve the canonical form.
  { re: /(?:vm|vt)\.tiktok\.com\/([A-Za-z0-9]+)/i, idGroup: 1 },
  // Embed: https://www.tiktok.com/embed/v2/1234567890
  { re: /tiktok\.com\/embed\/v\d\/(\d+)/i, idGroup: 1 },
];

const INSTAGRAM_PATTERNS: Array<{ re: RegExp; idGroup: number }> = [
  // Reel: https://www.instagram.com/reel/<shortcode>/
  { re: /instagram\.com\/reel\/([A-Za-z0-9_-]+)/i, idGroup: 1 },
  // Post: https://www.instagram.com/p/<shortcode>/
  { re: /instagram\.com\/p\/([A-Za-z0-9_-]+)/i, idGroup: 1 },
  // TV (legacy IGTV): https://www.instagram.com/tv/<shortcode>/
  { re: /instagram\.com\/tv\/([A-Za-z0-9_-]+)/i, idGroup: 1 },
];

export type DetectedUrl =
  | { platform: "tiktok" | "instagram"; providerVideoId: string; canonicalUrl: string }
  | { platform: null; reason: string };

export function detectSocialUrl(input: string): DetectedUrl {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { platform: null, reason: "not_a_url" };
  }
  const href = url.toString();

  for (const { re, idGroup } of TIKTOK_PATTERNS) {
    const m = href.match(re);
    if (m) return { platform: "tiktok", providerVideoId: m[idGroup], canonicalUrl: href };
  }
  for (const { re, idGroup } of INSTAGRAM_PATTERNS) {
    const m = href.match(re);
    if (m) return { platform: "instagram", providerVideoId: m[idGroup], canonicalUrl: href };
  }
  return { platform: null, reason: "unsupported_host_or_path" };
}
