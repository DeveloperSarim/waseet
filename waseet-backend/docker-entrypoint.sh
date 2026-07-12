#!/bin/sh
# Backend container entrypoint: apply schema, ensure admin + geo data, then serve.
# All steps are idempotent and safe to run on every deploy / restart.
set -e

echo "▸ Applying database schema (prisma db push)…"
npx prisma db push --skip-generate

echo "▸ Ensuring admin account…"
node scripts/ensure-admin.js || echo "  (ensure-admin failed, continuing)"

echo "▸ Ensuring Saudi geo data…"
node --max-old-space-size=2048 scripts/ensure-geo.js || echo "  (geo import skipped, continuing)"

echo "▸ Starting Waseet API…"
exec node src/server.js
