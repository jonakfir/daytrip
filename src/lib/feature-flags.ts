/**
 * Feature flag gate. Server + client — the client gate reads an inlined
 * NEXT_PUBLIC_* env at build time so no extra round trip is needed.
 *
 * SOCIAL_CLIPS_ENABLED is the umbrella flag for the TikTok/IG clips +
 * full-trip-map feature. Flip it off in Vercel Production until Phase 4
 * lands and is visibly polished.
 */
export function socialClipsEnabled(): boolean {
  // Server-side path reads the plain env; client reads the NEXT_PUBLIC_ mirror
  // that Next inlines at build. Either being "true" unlocks the feature.
  const server = process.env.SOCIAL_CLIPS_ENABLED;
  const client = process.env.NEXT_PUBLIC_SOCIAL_CLIPS_ENABLED;
  return server === "true" || client === "true";
}

/** Instagram oEmbed requires a Meta app access token. When missing, the
 *  /api/media/preview + /attach routes 503 on Instagram URLs with a clear
 *  reason, while TikTok keeps working. */
export function instagramOembedConfigured(): boolean {
  return !!process.env.IG_OEMBED_TOKEN;
}
