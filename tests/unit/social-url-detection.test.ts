/**
 * Unit tests for detectSocialUrl — the Phase 2 URL parser that decides
 * whether an incoming paste is a TikTok / Instagram link and what the
 * stable provider_video_id is. Dedupe depends on this being right.
 */

import { describe, it, expect } from "vitest";
import { detectSocialUrl } from "@/lib/social/schemas";

describe("detectSocialUrl — TikTok", () => {
  it("parses canonical video URLs", () => {
    const r = detectSocialUrl("https://www.tiktok.com/@scout/video/7106594312292453675");
    expect(r.platform).toBe("tiktok");
    if (r.platform === "tiktok") {
      expect(r.providerVideoId).toBe("7106594312292453675");
    }
  });

  it("parses short vm.tiktok.com links", () => {
    const r = detectSocialUrl("https://vm.tiktok.com/ZMabc123/");
    expect(r.platform).toBe("tiktok");
    if (r.platform === "tiktok") {
      expect(r.providerVideoId).toBe("ZMabc123");
    }
  });

  it("parses short vt.tiktok.com links", () => {
    const r = detectSocialUrl("https://vt.tiktok.com/xyz999");
    expect(r.platform).toBe("tiktok");
  });

  it("parses embed URLs", () => {
    const r = detectSocialUrl("https://www.tiktok.com/embed/v2/7106594312292453675");
    expect(r.platform).toBe("tiktok");
  });
});

describe("detectSocialUrl — Instagram", () => {
  it("parses reel URLs", () => {
    const r = detectSocialUrl("https://www.instagram.com/reel/Cx1234abcd/");
    expect(r.platform).toBe("instagram");
    if (r.platform === "instagram") {
      expect(r.providerVideoId).toBe("Cx1234abcd");
    }
  });

  it("parses post URLs", () => {
    const r = detectSocialUrl("https://www.instagram.com/p/Cx1234abcd/");
    expect(r.platform).toBe("instagram");
  });

  it("parses IGTV URLs", () => {
    const r = detectSocialUrl("https://www.instagram.com/tv/Cx1234abcd/");
    expect(r.platform).toBe("instagram");
  });
});

describe("detectSocialUrl — rejection cases", () => {
  it("rejects malformed input", () => {
    const r = detectSocialUrl("not a url");
    expect(r.platform).toBeNull();
    if (r.platform === null) expect(r.reason).toBe("not_a_url");
  });

  it("rejects unsupported hosts (YouTube Shorts)", () => {
    const r = detectSocialUrl("https://youtube.com/shorts/abc");
    expect(r.platform).toBeNull();
    if (r.platform === null) expect(r.reason).toBe("unsupported_host_or_path");
  });

  it("rejects TikTok home page (no video ID)", () => {
    const r = detectSocialUrl("https://www.tiktok.com/");
    expect(r.platform).toBeNull();
  });
});
