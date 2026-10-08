#!/usr/bin/env bash

# ==============================================================================
# COMMUNITY SHIELD (ประชาอารักษ์) — Service Stop Script
# Gracefully stops the production server
# ==============================================================================

ROOT_DIR="/Volumes/MAC/Thai_Community"
PID_FILE="${ROOT_DIR}/server.pid"
PORT="${PORT:-3000}"

TARGET_PID=""

if [ -f "${PID_FILE}" ]; then
  TARGET_PID=$(cat "${PID_FILE}")
fi

if [ -z "${TARGET_PID}" ] || ! ps -p "${TARGET_PID}" > /dev/null 2>&1; then
  # Fallback to process on port
  TARGET_PID=$(lsof -ti :${PORT} 2>/dev/null | head -n 1)
fi

if [ -z "${TARGET_PID}" ]; then
  echo "ℹ️  Community Shield is not currently running (port ${PORT} is free)."
  rm -f "${PID_FILE}"
  exit 0
fi

echo "🛑 Stopping Community Shield service (PID: ${TARGET_PID})..."
kill -15 "${TARGET_PID}" 2>/dev/null || true

# Wait up to 5 seconds
STOPPED=false
for i in {1..10}; do
  if ! ps -p "${TARGET_PID}" > /dev/null 2>&1; then
    STOPPED=true
    break
  fi
  sleep 0.5
done

if [ "${STOPPED}" = false ]; then
  echo "⚠️ Process did not terminate within 5s, forcing shutdown (SIGKILL)..."
  kill -9 "${TARGET_PID}" 2>/dev/null || true
  sleep 0.5
fi

rm -f "${PID_FILE}"
echo "✅ Community Shield service stopped cleanly."
