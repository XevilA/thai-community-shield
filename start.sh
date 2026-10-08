#!/usr/bin/env bash

# ==============================================================================
# COMMUNITY SHIELD (ประชาอารักษ์) — Service Start Script
# Launches the standalone production binary on External SSD
# ==============================================================================

ROOT_DIR="/Volumes/MAC/Thai_Community"
BIN_DIR="${ROOT_DIR}/bin"
PID_FILE="${ROOT_DIR}/server.pid"
LOG_FILE="${ROOT_DIR}/server.log"
PORT="${PORT:-3000}"

# Check if already running via PID file
if [ -f "${PID_FILE}" ]; then
  PID=$(cat "${PID_FILE}")
  if ps -p "${PID}" > /dev/null 2>&1; then
    echo "⚠️ Community Shield is already running with PID ${PID} on port ${PORT}."
    echo "   Health check: curl http://localhost:${PORT}/api/health"
    exit 0
  else
    rm -f "${PID_FILE}"
  fi
fi

# Also check if something is listening on port
EXISTING_PID=$(lsof -ti :${PORT} 2>/dev/null | head -n 1)
if [ -n "${EXISTING_PID}" ]; then
  echo "⚠️ A process is already listening on port ${PORT} (PID ${EXISTING_PID})."
  echo "${EXISTING_PID}" > "${PID_FILE}"
  echo "   If you want to restart it, run: ${ROOT_DIR}/stop.sh then ${ROOT_DIR}/start.sh"
  exit 0
fi

# Ensure executable exists
if [ ! -x "${BIN_DIR}/community-shield" ]; then
  echo "⚙️ Standalone binary not found. Running deploy build first..."
  "${ROOT_DIR}/deploy.sh"
fi

echo "🚀 Starting Community Shield production service..."
cd "${ROOT_DIR}"
export TMPDIR="${ROOT_DIR}/.tmp"
export PORT="${PORT}"

# Launch standalone compiled binary in background
nohup "${BIN_DIR}/community-shield" > "${LOG_FILE}" 2>&1 &
SERVER_PID=$!
echo "${SERVER_PID}" > "${PID_FILE}"

# Wait up to 5 seconds for health check
echo -n "⏳ Initializing server"
READY=false
for i in {1..10}; do
  sleep 0.5
  echo -n "."
  if curl -s -m 1 "http://localhost:${PORT}/api/health" | grep -q '"status": "ok"'; then
    READY=true
    break
  fi
done
echo ""

if [ "${READY}" = true ]; then
  echo "✅ Community Shield service launched successfully! [PID: ${SERVER_PID}]"
  echo "📂 Log file:         ${LOG_FILE}"
  echo "🖥️  Command Center:  http://localhost:${PORT}"
  
  if command -v ifconfig >/dev/null 2>&1; then
    IPS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}')
    for ip in ${IPS}; do
      echo "📱 Field Responders: http://${ip}:${PORT}"
    done
  fi
else
  echo "❌ Error: Service failed to start within timeout. Check logs:"
  tail -n 20 "${LOG_FILE}"
  exit 1
fi
