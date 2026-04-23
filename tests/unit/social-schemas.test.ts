import { describe, it, expect } from "vitest";
import {
  detectSocialUrl,
  TikTokOEmbedResponse,
  InstagramOEmbedResponse,
  NormalizedOEmbed,
} from "@/lib/social/schemas";
import type { TripMedia, ActivityCoords } from "@/types/itinerary";

describe("detectSocialUrl", () => {
  it("detects canonical TikTok URLs and extracts the numeric id", () => {
    const r = detectSocialUrl("https://www.tiktok.com/@traveler/video/7106594312292453675");
    expect(r.platform).toBe("tiktok");
    if (r.platform === "tiktok") expect(r.providerVideoId).toBe("7106594312292453675");
  });

  it("detects short TikTok links and keys off the slug", () => {
    const r = detectSocialUrl("https://vm.tiktok.com/ZMabc123/");
    expect(r.platform).toBe("tiktok");
    if (r.platform === "tiktok") expect(r.providerVideoId).toBe("ZMabc123");
  });

  it("detects Instagram reels and posts", () => {
    expect(detectSocialUrl("https://www.instagram.com/reel/Cx1234abcd/").platform).toBe(
      "instagram",
    );
    expect(detectSocialUrl("https://www.instagram.com/p/Cx1234abcd/").platform).toBe("instagram");
    expect(detectSocialUrl("https://www.instagram.com/tv/Cx1234abcd/").platform).toBe(
      "instagram",
    );
  });

  it("rejects out-of-scope hosts", () => {
    const r = detectSocialUrl("https://youtube.com/shorts/abc");
    expect(r.platform).toBeNull();
    if (r.platform === null) expect(r.reason).toBe("unsupported_host_or_path");
  });

  it("rejects malformed input without throwing", () => {
    const r = detectSocialUrl("not a url");
    expect(r.platform).toBeNull();
    if (r.platform === null) expect(r.reason).toBe("not_a_url");
  });
});

describe("oEmbed schemas", () => {
  it("parses a minimal TikTok oEmbed payload", () => {
    const parsed = TikTokOEmbedResponse.parse({
      version: "1.0",
      type: "video",
      html: '<blockquote class="tiktok-embed"></blockquote>',
      author_name: "scout",
      title: "cat",
      thumbnail_url: "https://p16-sign.tiktokcdn-us.com/example.jpg",
    });
    expect(parsed.html).toContain("tiktok-embed");
  });

  it("passes through unknown TikTok fields without failing", () => {
    const parsed = TikTokOEmbedResponse.parse({
      html: "<blockquote></blockquote>",
      some_future_field: "whatever",
    });
    expect(parsed).toMatchObject({ some_future_field: "whatever" });
  });

  it("accepts Instagram's nullable height field", () => {
    const parsed = InstagramOEmbedResponse.parse({
      html: '<blockquote class="instagram-media"></blockquote>',
      width: 658,
      height: null,
    });
    expect(parsed.height).toBeNull();
  });

  it("rejects oEmbed responses that are missing required html", () => {
    expect(() => TikTokOEmbedResponse.parse({})).toThrow();
    expect(() => InstagramOEmbedResponse.parse({})).toThrow();
  });
});

describe("NormalizedOEmbed", () => {
  it("requires the platform and a valid source URL", () => {
    const ok = NormalizedOEmbed.parse({
      platform: "tiktok",
      sourceUrl: "https://www.tiktok.com/@traveler/video/7106594312292453675",
      providerVideoId: "7106594312292453675",
      embedHtml: "<blockquote></blockquote>",
    });
    expect(ok.platform).toBe("tiktok");

    expect(() =>
      NormalizedOEmbed.parse({
        platform: "tiktok",
        sourceUrl: "not-a-url",
        providerVideoId: "1",
        embedHtml: "<i/>",
      }),
    ).toThrow();
  });
});

// Compile-time type guards. These don't assert at runtime beyond "it
// constructed", but they do catch schema drift between the DB and the
// TS types when the `satisfies` constraint is violated.
describe("type shapes", () => {
  it("TripMedia accepts an unassigned clip", () => {
    const unassigned: TripMedia = {
      id: "00000000-0000-0000-0000-000000000000",
      platform: "tiktok",
      sourceUrl: "https://www.tiktok.com/@scout/video/1",
      embedHtml: "<blockquote></blockquote>",
      dayNumber: null,
      slot: null,
      position: 0,
      createdAt: "2026-04-22T00:00:00Z",
    };
    expect(unassigned.dayNumber).toBeNull();
  });

  it("ActivityCoords requires a confidence bucket", () => {
    const c: ActivityCoords = { lat: 48.8584, lng: 2.2945, confidence: "high" };
    expect(c.confidence).toBe("high");
  });
});
