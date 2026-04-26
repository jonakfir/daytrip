#!/usr/bin/env node
/**
 * Daytrip Claude Proxy (fast OAuth path)
 *
 * A tiny HTTP server that runs on your Mac and forwards text-generation
 * requests from the Daytrip Vercel app to Claude. It uses your Claude Max
 * subscription via the OAuth token stored in macOS Keychain (the same token
 * Claude Code uses internally), calling api.anthropic.com directly.
 *
 * This is dramatically faster than spawning `claude --print` for every
 * request — no CLI cold start, no skill/plugin loading, no CLAUDE.md
 * discovery. A 5-day Tokyo itinerary that took 91 seconds via the CLI
 * subprocess returns in ~21 seconds via the direct API path.
 *
 * Flow:
 *   Vercel /api/generate  ──►  https://<tunnel>.trycloudflare.com/generate
 *                          ──►  this server (localhost:4242)
 *                          ──►  api.anthropic.com (your Max OAuth token)
 *                          ──►  itinerary JSON back to Vercel
 *
 * If the OAuth token is missing or expired, falls back to spawning the
 * `claude --print` CLI subprocess for compatibility.
 *
 * Usage:
 *   DAYTRIP_PROXY_SECRET=yoursecret node server.mjs
 *
 * Then in another terminal:
 *   cloudflared tunnel --url http://localhost:4242
 */

import http from "node:http";
import { spawn, execSync } from "node:child_process";
import { URL } from "node:url";

const PORT = Number(process.env.PORT || 4242);
const SECRET = process.env.DAYTRIP_PROXY_SECRET || "";
const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5";
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 180_000);
const MAX_RETRIES = Number(process.env.MAX_RETRIES || 2);
const MAX_TOKENS = Number(process.env.MAX_TOKENS || 4000);

if (!SECRET) {
  console.error(
    "[daytrip-proxy] ERROR: DAYTRIP_PROXY_SECRET env var must be set."
  );
  process.exit(1);
}

// ─── OAuth token loader (macOS Keychain) ──────────────────────────────────

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Read the Claude Code OAuth access token from macOS Keychain. This is the
 * same token the `claude` CLI uses internally. Returns null on any failure
 * (e.g. Linux, no Claude Code installed, token revoked).
 *
 * The token is cached in memory until 60s before its expiry, then refreshed
 * on the next call.
 */
function loadOAuthToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }
  try {
    const out = execSync(
      `security find-generic-password -s "Claude Code-credentials" -w`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }
    );
    const data = JSON.parse(out);
    const oauth = data.claudeAiOauth;
    if (!oauth?.accessToken) return null;
    // Check if token is expired
    const expiry = oauth.expiresAt ?? Date.now() + 3600_000;
    if (Date.now() > expiry - 60_000) {
      console.warn("[daytrip-proxy] OAuth token is expired, skipping");
      return null;
    }
    cachedToken = oauth.accessToken;
    tokenExpiresAt = expiry;
    return cachedToken;
  } catch {
    return null;
  }
}

// ─── Mutex ────────────────────────────────────────────────────────────────

let claudeBusy = false;
let lastClaudeFinish = 0;
async function withClaudeLock(fn) {
  while (claudeBusy) {
    await new Promise((r) => setTimeout(r, 200));
  }
  claudeBusy = true;
  try {
    return await fn();
  } finally {
    claudeBusy = false;
    lastClaudeFinish = Date.now();
  }
}

// ─── Direct API call (the fast path) ──────────────────────────────────────

/**
 * Call api.anthropic.com directly using the OAuth token. This is what
 * Claude Code does under the hood, but without the CLI subprocess overhead.
 *
 * Returns the assistant's text response, or throws on error.
 */
async function callClaudeViaAPI({ system, prompt, model = MODEL }) {
  const token = loadOAuthToken();
  if (!token) {
    throw new Error("OAUTH_TOKEN_UNAVAILABLE");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "oauth-2025-04-20",
        "content-type": "application/json",
        "user-agent": "claude-cli/1.0 (external, daytrip)",
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API error ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const content = data?.content?.[0];
    if (content?.type !== "text" || typeof content.text !== "string") {
      throw new Error(
        `Unexpected API response shape: ${JSON.stringify(data).slice(0, 200)}`
      );
    }
    return {
      text: content.text,
      usage: {
        inputTokens: data?.usage?.input_tokens ?? 0,
        outputTokens: data?.usage?.output_tokens ?? 0,
        model: data?.model ?? model,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── CLI fallback ─────────────────────────────────────────────────────────

function callClaudeViaCLI(combined) {
  return new Promise((resolve, reject) => {
    const args = ["--print", "--output-format", "text", "--model", MODEL];
    const proc = spawn(CLAUDE_BIN, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        proc.kill("SIGKILL");
      } catch {}
      reject(new Error(`Claude CLI timeout after ${REQUEST_TIMEOUT_MS}ms`));
    }, REQUEST_TIMEOUT_MS);

    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(err);
    });
    proc.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code === 0) resolve(stdout);
      else reject(new Error(`Claude CLI exited ${code}: ${stderr || "no stderr"}`));
    });

    proc.stdin.write(combined);
    proc.stdin.end();
  });
}

// ─── HTTP server ──────────────────────────────────────────────────────────

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Daytrip-Secret",
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (req.method === "OPTIONS") return sendJson(res, 204, {});

  if (req.method === "GET" && pathname === "/health") {
    const tokenOk = !!loadOAuthToken();
    return sendJson(res, 200, {
      ok: true,
      time: new Date().toISOString(),
      mode: tokenOk ? "oauth-direct" : "cli-fallback",
    });
  }

  if (req.method === "POST" && pathname === "/generate") {
    if (req.headers["x-daytrip-secret"] !== SECRET) {
      console.warn(
        `[daytrip-proxy] Unauthorized request from ${req.socket.remoteAddress}`
      );
      return sendJson(res, 401, { error: "Unauthorized" });
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }

    const { prompt, system } = body;
    if (!prompt || typeof prompt !== "string") {
      return sendJson(res, 400, {
        error: "Request body must include { prompt: string }",
      });
    }

    const promptChars = (system?.length ?? 0) + prompt.length;
    console.log(
      `[daytrip-proxy] ${new Date().toISOString()} generate (${promptChars} chars)`
    );

    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        const start = Date.now();
        let text;
        let usage = null;
        let mode;

        if (loadOAuthToken()) {
          // Fast path: direct API call with OAuth token. NO mutex —
          // concurrent API calls are independent and fine.
          mode = "oauth-direct";
          const result = await callClaudeViaAPI({
            system: system ?? "",
            prompt,
          });
          text = result.text;
          usage = result.usage;
        } else {
          // Fallback: spawn `claude --print` subprocess. Mutex required
          // because the CLI process pool serializes anyway.
          mode = "cli-fallback";
          const combined = system ? `${system}\n\n---\n\n${prompt}` : prompt;
          text = await withClaudeLock(() => callClaudeViaCLI(combined));
        }

        const elapsed = Date.now() - start;
        console.log(
          `[daytrip-proxy] attempt ${attempt} (${mode}) succeeded in ${elapsed}ms`
        );
        return sendJson(res, 200, { text, usage });
      } catch (e) {
        lastError = e;
        console.warn(
          `[daytrip-proxy] attempt ${attempt} failed: ${e.message}`
        );
        // If OAuth token was rejected, clear cache so next attempt falls back to CLI
        if (e.message?.includes("401") || e.message?.includes("authentication")) {
          cachedToken = null;
          tokenExpiresAt = 0;
          console.warn("[daytrip-proxy] OAuth token invalid, will try CLI fallback");
        }
        if (attempt <= MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }

    console.error("[daytrip-proxy] All attempts failed:", lastError?.message);
    return sendJson(res, 500, {
      error: "Claude call failed",
      details: lastError?.message ?? "unknown error",
    });
  }

  return sendJson(res, 404, { error: "Not found", path: pathname });
});

server.listen(PORT, () => {
  const tokenOk = !!loadOAuthToken();
  console.log(`[daytrip-proxy] Listening on http://localhost:${PORT}`);
  console.log(
    `[daytrip-proxy] Auth mode: ${tokenOk ? "OAuth direct (fast)" : "CLI fallback (slow)"}`
  );
  console.log(`[daytrip-proxy] Default model: ${MODEL}`);
  console.log(`[daytrip-proxy] Max tokens: ${MAX_TOKENS}`);
  console.log("");
  console.log("Next step: start cloudflared in another terminal:");
  console.log(`    cloudflared tunnel --url http://localhost:${PORT}`);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    console.log(`[daytrip-proxy] Received ${sig}, shutting down`);
    server.close(() => process.exit(0));
  });
}
