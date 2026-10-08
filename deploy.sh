#!/usr/bin/env bash
set -e

# ==============================================================================
# COMMUNITY SHIELD (ประชาอารักษ์) — Production Deployment Script
# Wat Thewarat Kunchorn Community Disaster Resilience System
# 100% Bun + Native SQLite + Three.js 3D Viewer + Offline Ready
# Deployment Target: External SSD (/Volumes/MAC/Thai_Community) ONLY
# ==============================================================================

ROOT_DIR="/Volumes/MAC/Thai_Community"
BIN_DIR="${ROOT_DIR}/bin"
TMP_DIR="${ROOT_DIR}/.tmp"
CACHE_DIR="${ROOT_DIR}/.bun_cache"
PORT="${PORT:-3000}"

echo "======================================================================"
echo "🛡️  COMMUNITY SHIELD (ประชาอารักษ์) — PRODUCTION DEPLOYMENT"
echo "    ชุมชนวัดเทวราชกุญชร เขตดุสิต กรุงเทพมหานคร"
echo "======================================================================"
echo "📍 Deployment Root:  ${ROOT_DIR}"
echo "💾 Target Storage:   External SSD ONLY"

# 1. Ensure Directories exist on External SSD
mkdir -p "${BIN_DIR}" "${TMP_DIR}" "${CACHE_DIR}"
export TMPDIR="${TMP_DIR}"

# 2. Check Bun Runtime
if command -v bun >/dev/null 2>&1; then
  BUN_BIN="$(which bun)"
elif [ -f "/opt/homebrew/bin/bun" ]; then
  BUN_BIN="/opt/homebrew/bin/bun"
else
  echo "❌ Error: Bun runtime not found. Please ensure Bun is installed."
  exit 1
fi
echo "⚡ Bun Executable:   ${BUN_BIN} ($(${BUN_BIN} --version))"

# 3. Compile Standalone Native Binary on External SSD
echo ""
echo "📦 Compiling standalone production binary..."
${BUN_BIN} build "${ROOT_DIR}/server/index.ts" --compile --outfile "${BIN_DIR}/community-shield"
chmod +x "${BIN_DIR}/community-shield"
echo "✅ Binary compiled: ${BIN_DIR}/community-shield ($(du -h "${BIN_DIR}/community-shield" | cut -f1))"

# 4. Verify SQLite Database & Required Assets
echo ""
echo "🔍 Verifying database & 3D assets on External SSD..."
if [ ! -f "${ROOT_DIR}/community_shield.sqlite" ]; then
  echo "⚠️ SQLite database not found, initializing baseline..."
  ${BUN_BIN} -e "import { initDatabase } from '${ROOT_DIR}/server/db.ts'; initDatabase();"
fi
echo "✅ SQLite Database:   ${ROOT_DIR}/community_shield.sqlite"

if [ -f "${ROOT_DIR}/thai_community_visible_low_areas.glb" ]; then
  echo "✅ 3D GLB Model:     ${ROOT_DIR}/thai_community_visible_low_areas.glb ($(du -h "${ROOT_DIR}/thai_community_visible_low_areas.glb" | cut -f1))"
else
  echo "⚠️ Warning: thai_community_visible_low_areas.glb missing in root directory!"
fi

# 5. Service Worker & PWA Manifest
if [ -f "${ROOT_DIR}/server/public/manifest.json" ] && [ -f "${ROOT_DIR}/server/public/sw.js" ]; then
  echo "✅ Offline PWA:      Manifest + Service Worker configured"
fi

# 6. Check Active Network Interfaces
echo ""
echo "🌐 Network Interfaces for Disaster Operation:"
echo "   - Localhost:      http://localhost:${PORT}"
if command -v ifconfig >/dev/null 2>&1; then
  IPS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}')
  for ip in ${IPS}; do
    echo "   - Field LAN Mesh: http://${ip}:${PORT}"
  done
fi

echo ""
echo "======================================================================"
echo "🚀 Deployment build complete!"
echo "   To start the service:   ${ROOT_DIR}/start.sh"
echo "   To check status:        ${ROOT_DIR}/status.sh"
echo "   To stop the service:    ${ROOT_DIR}/stop.sh"
echo "======================================================================"
