# Daytrip Claude Proxy

A tiny local server that lets your production Daytrip site (on Vercel) call
Claude through **your Claude Max subscription** instead of a pay-per-token API key.

## How it works

```
[Daytrip on Vercel] ──HTTPS──►  [Cloudflare tunnel]  ──►  [This proxy on your Mac]  ──►  claude --print  ──►  Claude Max
```

The proxy listens on `localhost:4242`. Cloudflare's free quick-tunnel exposes
that port to a public `*.trycloudflare.com` URL. Vercel's `/api/generate` POSTs
to the tunnel URL with a shared secret. The proxy spawns `claude --print` which
uses the already-authenticated Max session on your Mac.

## Requirements

- macOS (or Linux)
- Node 18+
- `claude` CLI: `npm install -g @anthropic-ai/claude-code`
- `cloudflared` CLI: `brew install cloudflared`
- You must be logged into Claude Code locally (already the case — that's how
  you're using Claude Code right now)

## One-time setup

```bash
cd ~/Code/daytrip/proxy
# A secret is already in .env. If you lose it, regenerate:
# openssl rand -hex 24 > .env
```

Both of these env vars must be set in **Vercel → daytrip → Settings → Env Vars**:

| Name                     | Value                                              |
|--------------------------|----------------------------------------------------|
| `DAYTRIP_PROXY_URL`      | the `*.trycloudflare.com` URL (no trailing slash)  |
| `DAYTRIP_PROXY_SECRET`   | the value from `.env` in this folder               |

They're already set from the initial setup.

## Start the proxy (what you need to do each time your Mac restarts)

Open a **new Terminal window** and run:

```bash
cd ~/Code/daytrip/proxy
./start.sh
```

The script will:

1. Load your secret from `.env`
2. Start the Node proxy on `localhost:4242`
3. Start a Cloudflare tunnel and print a URL like
   `https://funny-word-random-noun.trycloudflare.com`

**Important**: the tunnel URL changes every restart (it's a free quick tunnel).
After starting, copy the new URL and update `DAYTRIP_PROXY_URL` in Vercel:

```bash
# From the daytrip repo:
cd ~/Code/daytrip/app
echo "https://<NEW-URL>.trycloudflare.com" | vercel env add DAYTRIP_PROXY_URL production --force
vercel --yes --prod
```

To keep the URL stable, upgrade to a Cloudflare named tunnel (requires a free
Cloudflare account and a domain). See
https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/.

## Keeping the proxy alive

While the proxy is running, every trip generated on daytrip-five.vercel.app
(by the hardcoded admin or any paying user) uses your Max subscription.

If your Mac sleeps or you close the terminal, the tunnel goes down and the
Vercel function returns an error. To keep it running in the background:

```bash
nohup ./start.sh > proxy.log 2>&1 &
```

Or install as a LaunchAgent (macOS) so it starts at login — see `launchd.plist`
(not included, but easy to add if you want).

## Files

- `server.mjs` — the Node proxy. Auth via `X-Daytrip-Secret` header. Spawns
  `claude --print` for each request.
- `start.sh` — convenience script that starts the proxy + cloudflared tunnel.
- `package.json` — no deps; pure Node.
- `.env` — your secret (not committed).

## Troubleshooting

**"Claude CLI exited 1" / "Not logged in"** — run `claude login` in a normal
Terminal window to refresh your session.

**"Claude CLI timeout"** — the prompt is too long or Claude is slow. The
timeout is 290 seconds. If you're consistently hitting it, reduce the
complexity of the prompt in `src/app/api/generate/route.ts`.

**"Invalid x-api-key"** — this is the Anthropic SDK fallback kicking in because
the proxy fetch failed. Check that `DAYTRIP_PROXY_URL` in Vercel matches the
current tunnel URL and that the proxy is actually running.

**Tunnel URL changed after restart** — that's expected for free quick tunnels.
Update Vercel with the new URL (see above) or upgrade to a named tunnel.
