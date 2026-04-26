import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests up to the cap", () => {
    const key = `test-allow-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    }
  });

  it("blocks requests over the cap within the window", () => {
    const key = `test-block-${Math.random()}`;
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 60_000);
    const r = rateLimit(key, 3, 60_000);
    expect(r.ok).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it("isolates different keys", () => {
    const a = `iso-a-${Math.random()}`;
    const b = `iso-b-${Math.random()}`;
    for (let i = 0; i < 3; i++) rateLimit(a, 3, 60_000);
    expect(rateLimit(a, 3, 60_000).ok).toBe(false);
    expect(rateLimit(b, 3, 60_000).ok).toBe(true);
  });

  it("resets after the window elapses", async () => {
    const key = `test-reset-${Math.random()}`;
    rateLimit(key, 1, 50);
    expect(rateLimit(key, 1, 50).ok).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(rateLimit(key, 1, 50).ok).toBe(true);
  });
});
