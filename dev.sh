#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export DISPLAY="${DISPLAY:-:0}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=/run/user/$(id -u)/bus}"

# Start client dev server in background
cd "$SCRIPT_DIR/client"
npm run dev &
CLIENT_PID=$!

# Start server in dev mode
cd "$SCRIPT_DIR/server"
npm run dev

kill $CLIENT_PID 2>/dev/null
