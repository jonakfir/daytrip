# Social Clips — env vars you need to provision

These four keys must exist in `.env.local` (dev) and in the Vercel project env (Preview + Production) before Phase 2 lands. Phase 0 code does not read them yet, but Phases 2–3 will fail without them.

| Env var | Where to get it | Used by | Notes |
|---------|-----------------|---------|-------|
| `MAPTILER_KEY` | https://cloud.maptiler.com → Account → Keys → "Create new key", restrict to Daytrip domains (`daytrip-ai.com`, `localhost`, `*.vercel.app`) | Client map tiles (`TripMap`) | Free tier is 100k loads/mo. Safe to expose in the browser because it's domain-restricted. Set as `NEXT_PUBLIC_MAPTILER_KEY` if we want client access — TBD in Phase 3. |
| `GOOGLE_PLACES_API_KEY` | https://console.cloud.google.com → APIs & Services → Credentials → "Create credentials" → API key. Enable **Places API (New)** on the same project. Restrict by **IP** (Vercel serverless egress) or leave unrestricted for now and lock down later. | Server-only (geocoding) | **Never** ship this to the client. Lives in `GOOGLE_PLACES_API_KEY` (no `NEXT_PUBLIC_` prefix). |
| `IG_OEMBED_TOKEN` | https://developers.facebook.com → My Apps → Create app (Business type) → add the **oEmbed Read** permission → generate an app access token (`{app-id}\|{app-secret}` format works). App must be in Live mode, not Development. | Server-only (Instagram oEmbed) | Blocks Phase 2's IG ingestion until provisioned. TikTok needs no token — Phase 2 will ship with TikTok-only if this isn't ready. |
| `SOCIAL_CLIPS_ENABLED` | `true` or `false` | Feature flag gate | Lets us ship unreviewed for dogfood (Jonathan + Ben) before opening to all users. Default `false` in Production until Phase 4 is merged. |

## Vercel project env quick-add

Copy-paste ready for `vercel env add` once you have the values:

```
vercel env add MAPTILER_KEY preview
vercel env add MAPTILER_KEY production
vercel env add GOOGLE_PLACES_API_KEY preview
vercel env add GOOGLE_PLACES_API_KEY production
vercel env add IG_OEMBED_TOKEN preview
vercel env add IG_OEMBED_TOKEN production
vercel env add SOCIAL_CLIPS_ENABLED preview   # set "true"
vercel env add SOCIAL_CLIPS_ENABLED production # set "false" for now
```

## Smoke test after provisioning

```
# TikTok (no token needed)
node scripts/probe-social-oembed.mjs https://www.tiktok.com/@tiktok/video/7106594312292453675

# Instagram (requires IG_OEMBED_TOKEN in env)
IG_OEMBED_TOKEN=$(grep IG_OEMBED_TOKEN .env.local | cut -d= -f2) \
  node scripts/probe-social-oembed.mjs https://www.instagram.com/reel/Cx1234abcd/
```

The script also runs against canned fixtures when called with no args, so CI can verify the Zod schemas without hitting the network.
