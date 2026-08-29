#!/bin/bash
set -e

echo ""
echo "🎵 YouTube Remote — Installer"
echo "================================"

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Install Node.js 18+ first."
  exit 1
fi
NODE_VER=$(node --version | grep -oP '\d+' | head -1)
if [ "$NODE_VER" -lt 18 ]; then
  echo "❌ Node.js 18+ required. Found: $(node --version)"
  exit 1
fi
echo "✅ Node.js $(node --version)"

# Check npm
if ! command -v npm &>/dev/null; then
  echo "❌ npm not found."
  exit 1
fi
echo "✅ npm $(npm --version)"

# Check Chrome
if ! command -v google-chrome &>/dev/null && ! command -v chromium-browser &>/dev/null; then
  echo "❌ Google Chrome or Chromium not found."
  echo "   Install: sudo apt install google-chrome-stable"
  exit 1
fi
echo "✅ Chrome found"

# Check audio
if command -v wpctl &>/dev/null; then
  echo "✅ PipeWire/wpctl found"
elif command -v pactl &>/dev/null; then
  echo "✅ PulseAudio/pactl found"
else
  echo "⚠️  No audio control tool found (wpctl/pactl). Audio sink selection may not work."
fi

# Create data directory
mkdir -p ~/.youtube-remote/chromium-profile
mkdir -p ~/.youtube-remote/uploads
echo "✅ Data directory: ~/.youtube-remote"

# Copy env if not exists
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -f "$SCRIPT_DIR/server/.env" ]; then
  cp "$SCRIPT_DIR/server/.env.example" "$SCRIPT_DIR/server/.env"
  echo "✅ Created server/.env from example"
fi

# Install server deps
echo ""
echo "📦 Installing server dependencies..."
cd "$SCRIPT_DIR/server"
npm install

# Install Playwright Chromium
echo ""
echo "🌐 Installing Playwright (uses system Chrome, no download needed)..."
npx playwright install-deps chromium 2>/dev/null || true

# Install client deps
echo ""
echo "📦 Installing client dependencies..."
cd "$SCRIPT_DIR/client"
npm install

# Build client
echo ""
echo "🔨 Building frontend..."
npm run build

# Build server
echo ""
echo "🔨 Building server..."
cd "$SCRIPT_DIR/server"
npm run build

echo ""
echo "✅ Installation complete!"
echo ""
echo "Start the server with: ./start.sh"
echo "Or: cd server && npm start"
