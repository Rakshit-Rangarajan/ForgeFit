#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# ForgeFit — Tunnel Starter
# Exposes your local API (port 3001) to the internet so the Vercel/Cloudflare
# Pages frontend can reach it.
#
# Usage:
#   ./scripts/start-tunnel.sh ngrok        # use ngrok (free)
#   ./scripts/start-tunnel.sh cloudflare   # use Cloudflare Tunnel (recommended)
# ─────────────────────────────────────────────────────────────────────────────

set -e

TUNNEL_TYPE="${1:-ngrok}"
API_PORT=3001

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ForgeFit — Tunnel Starter"
echo "  Exposing localhost:${API_PORT} → internet"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$TUNNEL_TYPE" = "ngrok" ]; then
  # ── ngrok ────────────────────────────────────────────────────────────────
  if ! command -v ngrok &>/dev/null; then
    echo ""
    echo "ngrok not found. Install it:"
    echo "  Mac:   brew install ngrok/ngrok/ngrok"
    echo "  Linux: snap install ngrok"
    echo "  Or:    https://ngrok.com/download"
    exit 1
  fi

  echo ""
  echo "Starting ngrok on port $API_PORT..."
  echo "After it starts, copy the https:// URL and:"
  echo "  1. Set API_URL=<your-ngrok-url> in Vercel/Cloudflare dashboard"
  echo "  2. Set FRONTEND_URL_2=<your-ngrok-url> in your .env file"
  echo "  3. Restart Docker: docker compose restart api"
  echo ""
  ngrok http $API_PORT

elif [ "$TUNNEL_TYPE" = "cloudflare" ]; then
  # ── Cloudflare Tunnel (cloudflared) ──────────────────────────────────────
  if ! command -v cloudflared &>/dev/null; then
    echo ""
    echo "cloudflared not found. Install it:"
    echo "  Mac:   brew install cloudflare/cloudflare/cloudflared"
    echo "  Linux: curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb && sudo dpkg -i cloudflared.deb"
    echo "  Or:    https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/"
    exit 1
  fi

  echo ""
  echo "Starting Cloudflare quick tunnel on port $API_PORT..."
  echo "This creates a temporary https://xxx.trycloudflare.com URL."
  echo ""
  echo "For a PERMANENT subdomain (api.forgefit.rakshitr.co.in),"
  echo "set up a named tunnel — see docs/deployment-guide.html Section 3."
  echo ""
  cloudflared tunnel --url http://localhost:$API_PORT

else
  echo "Unknown tunnel type: $TUNNEL_TYPE"
  echo "Usage: $0 [ngrok|cloudflare]"
  exit 1
fi
