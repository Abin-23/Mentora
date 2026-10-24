#!/bin/bash

# Configuration: Your permanent ngrok domain
NGROK_DOMAIN="stopper-denatured-moneyless.ngrok-free.dev"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================="
echo "🚀 Starting Mentora RAG Service + Ngrok Tunnel"
echo "=================================================="

# Check if authtoken is configured
if ! ngrok config check &>/dev/null; then
  echo "⚠️  Ngrok authtoken not found! Please run:"
  echo "   ngrok config add-authtoken <YOUR_TOKEN>"
  exit 1
fi

# 1. Clean up any previous processes holding port 8000 or ngrok
echo "🧹 Checking port 8000..."
OLD_PIDS=$(lsof -ti :8000)
if [ -n "$OLD_PIDS" ]; then
  echo "Stopping previous process on port 8000 (PID: $OLD_PIDS)..."
  kill -9 $OLD_PIDS 2>/dev/null
  sleep 1
fi
killall ngrok 2>/dev/null || true

# 2. Start Python RAG Service in background
source venv/bin/activate
echo "Starting FastAPI RAG Service on port 8000..."
python main.py &
RAG_PID=$!

# Trap Ctrl+C to cleanly stop both
cleanup() {
  echo ""
  echo "🛑 Stopping RAG Service and Tunnel..."
  kill $RAG_PID 2>/dev/null
  killall ngrok 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 3. Wait for RAG service to be responsive
echo "Waiting for RAG service to be ready..."
for i in {1..20}; do
  if curl -s http://localhost:8000/health | grep -q "ok"; then
    echo "✅ RAG service is live and healthy on http://localhost:8000!"
    break
  fi
  sleep 1
done

# 4. Start Ngrok Tunnel on your permanent domain in foreground
echo "🌐 Starting ngrok tunnel on https://$NGROK_DOMAIN..."
echo "Press Ctrl+C to stop both RAG service and ngrok."
echo "=================================================="
ngrok http 8000 --url "$NGROK_DOMAIN"
