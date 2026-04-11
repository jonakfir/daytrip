import Anthropic from "@anthropic-ai/sdk";

/**
 * Unified Claude caller that supports two backends:
 *
 * 1. **Local proxy** (preferred for personal use) — forwards to a Mac running
 *    the Claude CLI / OAuth direct API. Set DAYTRIP_PROXY_URL +
 *    DAYTRIP_PROXY_SECRET. Uses your Claude Max subscription quota.
 *
 * 2. **Anthropic SDK** (fallback) — uses ANTHROPIC_API_KEY and pay-per-token.
 *
 * If the proxy is configured, it takes priority. On any proxy failure, we
 * fall back to the SDK if ANTHROPIC_API_KEY is also set.
 */

export interface ClaudeCallOptions {
  system: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}

export interface ClaudeUsage {
  inputTokens: number;
  outputTokens: number;
  model?: string;
}

export interface ClaudeCallResult {
  text: string;
  usage: ClaudeUsage;
}

/** How long to wait for the proxy before giving up. The Cloudflare quick
 *  tunnel can take a moment to wake on cold hits, so 60s gives margin for
 *  a real itinerary chunk while still failing fast on a dead URL. */
const PROXY_TIMEOUT_MS = 60_000;

async function callProxy(opts: ClaudeCallOptions): Promise<ClaudeCallResult> {
  // .trim() defends against stray whitespace / trailing newlines in the
  // DAYTRIP_PROXY_URL env var (Vercel sometimes preserves a literal \n).
  const url = process.env
    .DAYTRIP_PROXY_URL!.trim()
    .replace(/\/$/, "");
  const secret = process.env.DAYTRIP_PROXY_SECRET!.trim();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${url}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Daytrip-Secret": secret,
      },
      body: JSON.stringify({
        system: opts.system,
        prompt: opts.prompt,
        // Forward the requested model + token cap so the proxy can call the
        // right Claude model under the user's Max plan.
        model: opts.model,
        maxTokens: opts.maxTokens,
      }),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(
        `Proxy timeout after ${PROXY_TIMEOUT_MS / 1000}s — is the daytrip-proxy server running on your Mac?`
      );
    }
    throw new Error(
      `Proxy fetch failed: ${e instanceof Error ? e.message : String(e)} (URL: ${url})`
    );
  }
  clearTimeout(timeoutId);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Proxy returned ${res.status}: ${text.slice(0, 300)}`
    );
  }

  let data: {
    text?: string;
    error?: string;
    usage?: { inputTokens?: number; outputTokens?: number; model?: string };
  };
  try {
    data = await res.json();
  } catch (e) {
    throw new Error(
      `Proxy returned non-JSON: ${e instanceof Error ? e.message : String(e)}`
    );
  }
  if (data.error) throw new Error(`Proxy error: ${data.error}`);
  if (!data.text) throw new Error("Proxy returned no text");
  return {
    text: data.text,
    usage: {
      inputTokens: data.usage?.inputTokens ?? 0,
      outputTokens: data.usage?.outputTokens ?? 0,
      model: data.usage?.model,
    },
  };
}

async function callSdk(opts: ClaudeCallOptions): Promise<ClaudeCallResult> {
  // .trim() defends against stray whitespace / newlines in the env var value
  // (Vercel sometimes preserves a literal trailing \n which corrupts the
  // Authorization header and surfaces as a generic "Connection error").
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: opts.model ?? "claude-haiku-4-5",
    max_tokens: opts.maxTokens ?? 4000,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });

  return {
    text:
      response.content[0]?.type === "text" ? response.content[0].text : "",
    usage: {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      model: response.model,
    },
  };
}

/** True if DAYTRIP_PROXY_URL + DAYTRIP_PROXY_SECRET are both set. */
export function isProxyConfigured(): boolean {
  return !!(process.env.DAYTRIP_PROXY_URL && process.env.DAYTRIP_PROXY_SECRET);
}

/** True if either backend (proxy or SDK) is usable. */
export function isClaudeConfigured(): boolean {
  return isProxyConfigured() || !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Call Claude. Tries the proxy first if configured, falls back to the SDK
 * on failure. Returns text + token usage so callers can compute cost.
 *
 * Both backends throw on failure with descriptive messages so the caller
 * (and the user) can see exactly which one died.
 */
export async function callClaudeWithUsage(
  opts: ClaudeCallOptions
): Promise<ClaudeCallResult> {
  if (isProxyConfigured()) {
    try {
      return await callProxy(opts);
    } catch (proxyErr) {
      const proxyMsg =
        proxyErr instanceof Error ? proxyErr.message : String(proxyErr);
      console.warn("[claude-client] Proxy call failed:", proxyMsg);

      if (!process.env.ANTHROPIC_API_KEY) {
        // No SDK fallback configured — surface the proxy error so the
        // user can fix it (start the proxy, refresh the tunnel URL, etc).
        throw new Error(
          `Claude proxy unavailable and ANTHROPIC_API_KEY is not set. Proxy error: ${proxyMsg}`
        );
      }

      console.warn("[claude-client] Falling back to Anthropic SDK");
      try {
        return await callSdk(opts);
      } catch (sdkErr) {
        const sdkMsg =
          sdkErr instanceof Error ? sdkErr.message : String(sdkErr);
        console.error("[claude-client] SDK fallback also failed:", sdkMsg);
        throw new Error(
          `Both Claude backends failed. Proxy: ${proxyMsg}. SDK: ${sdkMsg}`
        );
      }
    }
  }
  return callSdk(opts);
}

/**
 * Backwards-compatible helper that returns just the text. New callers
 * should use callClaudeWithUsage() so they can track Claude cost.
 */
export async function callClaude(opts: ClaudeCallOptions): Promise<string> {
  const { text } = await callClaudeWithUsage(opts);
  return text;
}

// ── Cost tracking ────────────────────────────────────────────────────────

/**
 * Approximate Claude pricing per million tokens (USD).
 * Used to compute the silent per-credit usage cap.
 *
 * Source: https://www.anthropic.com/pricing (Haiku 4.5)
 */
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
  "claude-haiku-4-5-20251001": { input: 1.0, output: 5.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-sonnet-4-5": { input: 3.0, output: 15.0 },
  "claude-opus-4-6": { input: 15.0, output: 75.0 },
};

/**
 * Convert a token usage record into cents of estimated Claude API cost.
 * Falls back to Haiku pricing for unknown models.
 */
export function estimateUsageCents(usage: ClaudeUsage): number {
  const model = usage.model ?? "claude-haiku-4-5";
  const rates = PRICING[model] ?? PRICING["claude-haiku-4-5"];
  // (tokens / 1_000_000) × $/M × 100 cents
  const usd =
    (usage.inputTokens / 1_000_000) * rates.input +
    (usage.outputTokens / 1_000_000) * rates.output;
  // Round up so any usage > 0 counts as at least 1 cent
  return Math.max(1, Math.ceil(usd * 100));
}
