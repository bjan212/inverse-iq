#!/usr/bin/env bash
set -euo pipefail

# Lightweight deploy helper: pulls latest code, installs deps, and restarts PM2.
# Usage: ./scripts/deploy.sh [branch]
# Defaults to branch 'main'. Expects repo at /opt/trading-data-collection-service.

REPO_DIR="/opt/trading-data-collection-service"
BRANCH="${1:-main}"

# Allow git to operate when run as root (safe.directory guard).
git config --global --add safe.directory "$REPO_DIR" || true

echo "[deploy] Using branch: $BRANCH"

git -C "$REPO_DIR" fetch --all --prune
# Ensure the correct branch is checked out before pulling.
git -C "$REPO_DIR" checkout "$BRANCH"
git -C "$REPO_DIR" pull origin "$BRANCH"

echo "[deploy] Installing production dependencies..."
npm --prefix "$REPO_DIR" install --production

echo "[deploy] Restarting PM2 process 'server' (or starting if missing)..."
if pm2 restart server --update-env; then
  echo "[deploy] PM2 restart ok"
else
  pm2 start "$REPO_DIR/ecosystem.config.js" --env production
  pm2 save
fi

echo "[deploy] Done. Current PM2 status:"
pm2 ls
