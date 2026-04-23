/**
 * Validates that the Zod schemas parse real-world oEmbed response shapes
 * (captured from the docs). If TikTok / Meta change their response, these
 * tests catch it before the production route explodes on a paste.
 */

import { describe, it, expect } from "vitest";
import { TikTokOEmbedResponse, InstagramOEmbedResponse, NormalizedOEmbed } from "@/lib/social/schemas";

describe("oEmbed schemas", () => {
  it("TikTok canonical fixture parses", () => {
    const fixture = {
      version: "1.0",
      type: "video",
      title: "cat scout",
      author_url: "https://www.tiktok.com/@scout",
      author_name: "scout",
      width: "100%",
      height: "100%",
      html: '<blockquote class="tiktok-embed">...</blockquote>',
      thumbnail_width: 720,
      thumbnail_height: 1280,
      thumbnail_url: "https://p16-sign.tiktokcdn-us.com/example.jpg",
      provider_url: "https://www.tiktok.com",
      provider_name: "TikTok",
    };
    expect(() => TikTokOEmbedResponse.parse(fixture)).not.toThrow();
  });

  it("Instagram fixture with null height parses", () => {
    const fixture = {
      version: "1.0",
      author_name: "tourist",
      provider_name: "Instagram",
      provider_url: "https://www.instagram.com/",
      type: "rich",
      width: 658,
      height: null,
      html: "<blockquote class=\"instagram-media\">...</blockquote>",
      thumbnail_url: "https://scontent.cdninstagram.com/example.jpg",
      thumbnail_width: 640,
      thumbnail_height: 480,
      title: "Roman holiday",
    };
    expect(() => InstagramOEmbedResponse.parse(fixture)).not.toThrow();
  });

  it("rejects a response missing html (the one required field)", () => {
    const broken = { provider_name: "TikTok", title: "missing html" };
    expect(() => TikTokOEmbedResponse.parse(broken)).toThrow();
  });

  it("NormalizedOEmbed preserves the core shape", () => {
    const ok = NormalizedOEmbed.parse({
      platform: "tiktok",
      sourceUrl: "https://www.tiktok.com/@scout/video/123",
      providerVideoId: "123",
      embedHtml: "<blockquote/>",
    });
    expect(ok.platform).toBe("tiktok");
    expect(ok.providerVideoId).toBe("123");
  });

  it("NormalizedOEmbed rejects unsupported platform", () => {
    expect(() =>
      NormalizedOEmbed.parse({
        platform: "vimeo" as never,
        sourceUrl: "https://vimeo.com/1",
        providerVideoId: "1",
        embedHtml: "<x/>",
      })
    ).toThrow();
  });
});
