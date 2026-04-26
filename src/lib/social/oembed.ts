/**
 * Platform oEmbed fetchers.
 *
 * - TikTok oEmbed (public, no auth) — https://developers.tiktok.com/doc/embed-videos
 * - Instagram oEmbed (Meta app token required) — https://developers.facebook.com/docs/instagram/oembed
 *
 * Both return a {@link NormalizedOEmbed} so the rest of the pipeline doesn't
 * branch on platform. Callers should catch and map the `OEmbedError` subclasses
 * into HTTP status codes at the route layer.
 */

import {
  detectSocialUrl,
  InstagramOEmbedResponse,
  NormalizedOEmbed,
  TikTokOEmbedResponse,
} from "@/lib/social/schemas";
import { instagramOembedConfigured } from "@/lib/feature-flags";

export class OEmbedError extends Error {
  constructor(public code: "unsupported_platform" | "invalid_url" | "provider_rejected" | "provider_misconfigured" | "network_error", message: string, public status = 502) {
    super(message);
    this.name = "OEmbedError";
  }
}

const USER_AGENT = "daytrip/1.0 (+https://daytrip-ai.com/social-clips)";

async function fetchTikTok(canonicalUrl: string, providerVideoId: string): Promise<NormalizedOEmbed> {
  const api = `https://www.tiktok.com/oembed?url=${encodeURIComponent(canonicalUrl)}`;
  let r: Response;
  try {
    r = await fetch(api, { headers: { "user-agent": USER_AGENT }, cache: "no-store" });
  } catch (e) {
    throw new OEmbedError("network_error", `TikTok oEmbed unreachable: ${e instanceof Error ? e.message : e}`, 502);
  }
  if (!r.ok) {
    throw new OEmbedError("provider_rejected", `TikTok oEmbed ${r.status}: ${(await r.text()).slice(0, 240)}`, r.status === 404 ? 404 : 502);
  }
  const json = TikTokOEmbedResponse.parse(await r.json());
  return NormalizedOEmbed.parse({
    platform: "tiktok",
    sourceUrl: canonicalUrl,
    providerVideoId,
    embedHtml: json.html,
    thumbnailUrl: json.thumbnail_url,
    authorName: json.author_name,
    authorUrl: json.author_url,
    title: json.title,
  });
}

async function fetchInstagram(canonicalUrl: string, providerVideoId: string): Promise<NormalizedOEmbed> {
  if (!instagramOembedConfigured()) {
    throw new OEmbedError(
      "provider_misconfigured",
      "Instagram clips require IG_OEMBED_TOKEN — Meta's oEmbed endpoint is gated on a Business app token. Not configured in this environment.",
      503
    );
  }
  const token = process.env.IG_OEMBED_TOKEN!;
  const api =
    `https://graph.facebook.com/v19.0/instagram_oembed` +
    `?url=${encodeURIComponent(canonicalUrl)}&access_token=${encodeURIComponent(token)}`;
  let r: Response;
  try {
    r = await fetch(api, { cache: "no-store" });
  } catch (e) {
    throw new OEmbedError("network_error", `Instagram oEmbed unreachable: ${e instanceof Error ? e.message : e}`, 502);
  }
  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (json as { error?: { message?: string } })?.error?.message ?? r.statusText;
    throw new OEmbedError("provider_rejected", `Instagram oEmbed ${r.status}: ${msg}`, r.status === 404 ? 404 : 502);
  }
  const parsed = InstagramOEmbedResponse.parse(json);
  return NormalizedOEmbed.parse({
    platform: "instagram",
    sourceUrl: canonicalUrl,
    providerVideoId,
    embedHtml: parsed.html,
    thumbnailUrl: parsed.thumbnail_url,
    authorName: parsed.author_name,
    authorUrl: parsed.author_url,
    title: parsed.title,
  });
}

export async function fetchOEmbed(url: string): Promise<NormalizedOEmbed> {
  const detected = detectSocialUrl(url);
  if (detected.platform === null) {
    throw new OEmbedError(
      detected.reason === "not_a_url" ? "invalid_url" : "unsupported_platform",
      detected.reason === "not_a_url" ? "Not a valid URL." : "URL must be a TikTok or Instagram link.",
      400
    );
  }
  if (detected.platform === "tiktok") return fetchTikTok(detected.canonicalUrl, detected.providerVideoId);
  return fetchInstagram(detected.canonicalUrl, detected.providerVideoId);
}
