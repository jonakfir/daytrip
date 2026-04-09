import Anthropic from "@anthropic-ai/sdk";

/**
 * Unified Claude caller that supports two backends:
 *
 * 1. **Local proxy** (preferred for personal use) — forwards to a Mac running
 *    the Claude CLI. Set DAYTRIP_PROXY_URL + DAYTRIP_PROXY_SECRET. Uses your
 *    Claude Max subscription quota, not API credits.
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

async function callProxy(opts: ClaudeCallOptions): Promise<string> {
  const url = process.env.DAYTRIP_PROXY_URL!.replace(/\/$/, "");
  const secret = process.env.DAYTRIP_PROXY_SECRET!;

  const res = await fetch(`${url}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Daytrip-Secret": secret,
    },
    body: JSON.stringify({
      system: opts.system,
      prompt: opts.prompt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Proxy returned ${res.status}: ${text.slice(0, 300)}`
    );
  }

  const data = (await res.json()) as { text?: string; error?: string };
  if (data.error) throw new Error(`Proxy error: ${data.error}`);
  if (!data.text) throw new Error("Proxy returned no text");
  return data.text;
}

async function callSdk(opts: ClaudeCallOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: opts.model ?? "claude-sonnet-4-6",
    max_tokens: opts.maxTokens ?? 8000,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
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
 * Call Claude with the given system + user prompt. Tries the proxy first
 * if configured, falls back to the SDK on proxy failure.
 */
export async function callClaude(opts: ClaudeCallOptions): Promise<string> {
  if (isProxyConfigured()) {
    try {
      return await callProxy(opts);
    } catch (e) {
      console.warn(
        "[claude-client] Proxy call failed, falling back to SDK:",
        e instanceof Error ? e.message : e
      );
      if (!process.env.ANTHROPIC_API_KEY) throw e;
    }
  }
  return callSdk(opts);
}
