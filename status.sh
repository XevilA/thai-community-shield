#!/usr/bin/env bash

# ==============================================================================
# COMMUNITY SHIELD (ประชาอารักษ์) — Service Status Script
# Inspects running health, resource usage, and disaster scenario state
# ==============================================================================

ROOT_DIR="/Volumes/MAC/Thai_Community"
PID_FILE="${ROOT_DIR}/server.pid"
LOG_FILE="${ROOT_DIR}/server.log"
PORT="${PORT:-3000}"

echo "======================================================================"
echo "🛡️  COMMUNITY SHIELD (ประชาอารักษ์) — SERVICE STATUS"
echo "======================================================================"

TARGET_PID=""
if [ -f "${PID_FILE}" ]; then
  TARGET_PID=$(cat "${PID_FILE}")
fi

if [ -z "${TARGET_PID}" ] || ! ps -p "${TARGET_PID}" > /dev/null 2>&1; then
  TARGET_PID=$(lsof -ti :${PORT} 2>/dev/null | head -n 1)
fi

if [ -n "${TARGET_PID}" ] && ps -p "${TARGET_PID}" > /dev/null 2>&1; then
  echo "🟢 Status:          RUNNING (PID: ${TARGET_PID})"
  echo -n "📊 Resource Usage:  "
  ps -p "${TARGET_PID}" -o %cpu,%mem,etime,command | tail -n 1
  echo ""
  
  # Health check
  echo "💓 Health Check:    http://localhost:${PORT}/api/health"
  HEALTH=$(curl -s -m 2 "http://localhost:${PORT}/api/health" 2>/dev/null || echo '{"status":"offline"}')
  echo "   ${HEALTH}"
  echo ""
  
  # Current Scenario State
  echo "🌊 Live System State:"
  STATE=$(curl -s -m 2 "http://localhost:${PORT}/api/state" 2>/dev/null)
  if [ -n "${STATE}" ]; then
    STEP_TIME=$(echo "${STATE}" | grep -o '"time": "[^"]*"' | head -n 1 | cut -d'"' -f4)
    STEP_TITLE=$(echo "${STATE}" | grep -o '"title": "[^"]*"' | head -n 1 | cut -d'"' -f4)
    WATER_M=$(echo "${STATE}" | grep -o '"waterLevelMeters": [0-9.]*' | head -n 1 | awk '{print $2}')
    echo "   - Timeline:       ${STEP_TIME} (${STEP_TITLE})"
    echo "   - River Level:    +${WATER_M} m MSL"
  fi
  echo ""

  # LAN access
  echo "📱 Field Access URLs:"
  echo "   - Local:          http://localhost:${PORT}"
  if command -v ifconfig >/dev/null 2>&1; then
    IPS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}')
    for ip in ${IPS}; do
      echo "   - LAN / Hotspot:  http://${ip}:${PORT}"
    done
  fi
else
  echo "🔴 Status:          STOPPED (No active process on port ${PORT})"
  echo "   To start:        ${ROOT_DIR}/start.sh"
fi

if [ -f "${LOG_FILE}" ]; then
  echo ""
  echo "📜 Recent Logs (tail -n 8 ${LOG_FILE}):"
  tail -n 8 "${LOG_FILE}"
fi

echo "======================================================================"
