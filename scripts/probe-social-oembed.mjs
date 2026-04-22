#!/usr/bin/env node
// Phase 0 throwaway probe for the Social Clips feature.
// Exercises oEmbed end-to-end against TikTok and (optionally) Instagram
// so we catch API contract changes before wiring up the ingestion route.
//
// Usage:
//   node scripts/probe-social-oembed.mjs <tiktok-url> [instagram-url]
//
// Also runs canned-fixture validation so CI can use it without network.
//   node scripts/probe-social-oembed.mjs --canned
//
// Delete this file once Phase 2 (POST /api/media/preview) is merged.

import { z } from "zod";

const TikTokOEmbedResponse = z
  .object({
    html: z.string(),
    author_name: z.string().optional(),
    title: z.string().optional(),
    thumbnail_url: z.string().url().optional(),
  })
  .passthrough();

const InstagramOEmbedResponse = z
  .object({
    html: z.string(),
    author_name: z.string().optional(),
    title: z.string().optional(),
    thumbnail_url: z.string().url().optional(),
  })
  .passthrough();

// Known-shape fixtures copied from the public developer docs. These exist
// so the script is useful offline and in CI — the real probes below
// require network + (for IG) an access token.
const CANNED_TIKTOK = {
  version: "1.0",
  type: "video",
  title: "a cat doing cat things",
  author_url: "https://www.tiktok.com/@scout",
  author_name: "scout",
  width: "100%",
  height: "100%",
  html: '<blockquote class="tiktok-embed" ...></blockquote>',
  thumbnail_width: 720,
  thumbnail_height: 1280,
  thumbnail_url: "https://p16-sign.tiktokcdn-us.com/example.jpg",
  provider_url: "https://www.tiktok.com",
  provider_name: "TikTok",
};

const CANNED_INSTAGRAM = {
  version: "1.0",
  author_name: "tourist",
  provider_name: "Instagram",
  provider_url: "https://www.instagram.com/",
  type: "rich",
  width: 658,
  height: null,
  html: "<blockquote class=\"instagram-media\" ...></blockquote>",
  thumbnail_url: "https://scontent.cdninstagram.com/example.jpg",
  thumbnail_width: 640,
  thumbnail_height: 480,
  title: "Roman holiday",
};

function summarize(label, parsed) {
  const safe = {
    html_len: parsed.html.length,
    author_name: parsed.author_name,
    title: parsed.title,
    thumbnail_url: parsed.thumbnail_url,
  };
  console.log(`[${label}] parsed ok:`, safe);
}

async function probeTikTok(url) {
  const api = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  const r = await fetch(api, { headers: { "user-agent": "daytrip-probe/0.1" } });
  if (!r.ok) throw new Error(`TikTok oEmbed ${r.status}: ${await r.text()}`);
  const parsed = TikTokOEmbedResponse.parse(await r.json());
  summarize("tiktok", parsed);
  return parsed;
}

async function probeInstagram(url) {
  const token = process.env.IG_OEMBED_TOKEN;
  if (!token) {
    console.log("[instagram] IG_OEMBED_TOKEN not set — skipping live probe.");
    return null;
  }
  const api = `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(
    url
  )}&access_token=${token}`;
  const r = await fetch(api);
  if (!r.ok) throw new Error(`IG oEmbed ${r.status}: ${await r.text()}`);
  const parsed = InstagramOEmbedResponse.parse(await r.json());
  summarize("instagram", parsed);
  return parsed;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--canned") || args.length === 0) {
    console.log("[canned] validating fixtures against Zod schemas");
    summarize("tiktok/canned", TikTokOEmbedResponse.parse(CANNED_TIKTOK));
    summarize("instagram/canned", InstagramOEmbedResponse.parse(CANNED_INSTAGRAM));
    if (args.length === 0) return;
  }

  const tiktokUrl = args.find((a) => /tiktok\.com/i.test(a));
  const igUrl = args.find((a) => /instagram\.com/i.test(a));

  if (tiktokUrl) await probeTikTok(tiktokUrl);
  if (igUrl) await probeInstagram(igUrl);
}

main().catch((err) => {
  console.error("probe failed:", err.message);
  process.exit(1);
});
