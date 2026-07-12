#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Waseet — safe updater.  Run this on the VPS whenever you push a new version:
#      bash update.sh
#  It takes a FULL backup first, pulls the latest code from GitHub, rebuilds the
#  containers and applies any DB schema changes — WITHOUT touching your data.
#  Your .env and ./backups are never overwritten (both are git-ignored).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
green() { printf '\033[0;32m%s\033[0m\n' "$1"; }

bold "▸ 1/5  Taking a mandatory backup before updating…"
bash ./backup.sh create

bold "▸ 2/5  Fetching the latest version from GitHub…"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git fetch --all --prune
# discard local changes to TRACKED files only; .env + backups are untracked → preserved
git reset --hard "origin/${BRANCH}"

bold "▸ 3/5  Rebuilding containers…"
docker compose build

bold "▸ 4/5  Rolling out the update…"
# recreating the backend re-runs `prisma db push` in its entrypoint → additive schema
# changes are applied automatically with no data loss.
docker compose up -d

bold "▸ 5/5  Waiting for the API to come back…"
for i in $(seq 1 30); do
  if docker compose exec -T backend wget -qO- http://localhost:19000/health >/dev/null 2>&1; then
    green "✅ Update complete — Waseet is live on the new version."
    exit 0
  fi
  sleep 2
done
green "✅ Update applied. (API health check timed out — check: docker compose logs -f backend)"
