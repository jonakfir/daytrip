#!/bin/bash
# Starts the Daytrip Claude proxy server + Cloudflare quick tunnel.
# Copy the *.trycloudflare.com URL it prints and paste it into Vercel
# as DAYTRIP_PROXY_URL. Also set DAYTRIP_PROXY_SECRET to the value in .env.

set -e
cd "$(dirname "$0")"

# Load .env if present
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

if [ -z "$DAYTRIP_PROXY_SECRET" ]; then
  echo "DAYTRIP_PROXY_SECRET not set. Generating a random one now."
  echo "Save this in .env and in Vercel env vars:"
  export DAYTRIP_PROXY_SECRET=$(openssl rand -hex 24)
  echo "  DAYTRIP_PROXY_SECRET=$DAYTRIP_PROXY_SECRET"
  echo ""
  echo "DAYTRIP_PROXY_SECRET=$DAYTRIP_PROXY_SECRET" > .env
  echo "Wrote it to $(pwd)/.env"
  echo ""
fi

# Check dependencies
if ! command -v claude >/dev/null 2>&1; then
  echo "ERROR: 'claude' CLI not found on PATH."
  echo "Install it with: npm install -g @anthropic-ai/claude-code"
  echo "Then run: claude login"
  exit 1
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "ERROR: 'cloudflared' not found on PATH."
  echo "Install it with: brew install cloudflared"
  exit 1
fi

# Start the proxy server in the background
echo "Starting Daytrip Claude proxy server..."
node server.mjs &
SERVER_PID=$!

# Ensure we kill the server when the script exits
trap "echo 'Shutting down...'; kill $SERVER_PID 2>/dev/null; exit 0" INT TERM EXIT

sleep 2

# Verify server is up
if ! curl -sf http://localhost:4242/health >/dev/null; then
  echo "ERROR: proxy server failed to start"
  exit 1
fi

echo ""
echo "===================================================================="
echo "Proxy is running. Starting Cloudflare tunnel..."
echo "When you see a URL like https://<something>.trycloudflare.com,"
echo "copy it and add it to Vercel as DAYTRIP_PROXY_URL."
echo "===================================================================="
echo ""

cloudflared tunnel --url http://localhost:4242
