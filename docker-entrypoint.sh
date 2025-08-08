#!/usr/bin/env sh
set -eu

echo "[entrypoint] DATABASE_URL=${DATABASE_URL:-}"

echo "[entrypoint] Attempting migrate deploy"

if bunx prisma migrate deploy; then
  echo "[entrypoint] migrate deploy succeeded"
else
  echo "[entrypoint] migrate deploy failed, attempting auto-resolve of failed migrations (P3009)"
  # Conservatively mark only the latest migration as rolled back, then retry deploy.
  # This avoids incorrectly resolving all pending migrations on a fresh database.
  LATEST_MIG=$(ls -1 prisma/migrations 2>/dev/null | sort | tail -n 1 || true)
  if [ -n "${LATEST_MIG}" ]; then
    echo "[entrypoint] Marking latest migration as rolled back: ${LATEST_MIG}"
    bunx prisma migrate resolve --rolled-back ${LATEST_MIG} || true
  else
    echo "[entrypoint] No migrations found to resolve"
  fi
  echo "[entrypoint] Retrying migrate deploy"
  bunx prisma migrate deploy
fi

echo "[entrypoint] Starting app"
exec bun server.js


