#!/usr/bin/env bash
# Cloud startup script — runs Next.js web server + background daily pipeline.
# Used by Dockerfile.prod (Railway / Render / Fly.io deployments).
set -euo pipefail

# ── Load env vars from .env file if present (local or Railway env-file) ───────
if [[ -f .env ]]; then
  set -o allexport
  # shellcheck disable=SC1091
  source .env
  set +o allexport
fi

DATA_DIR="pipeline/data"
DB_FILE="$DATA_DIR/ceos.db"

mkdir -p "$DATA_DIR"

# ── Seed DB on first boot ─────────────────────────────────────────────────────
if [[ ! -f "$DB_FILE" ]]; then
  echo "[start] Fresh volume — seeding 11 hand-researched hot prospects…"
  python -m pipeline.seed_demo
fi

# ── Background pipeline scheduler ────────────────────────────────────────────
# First run fires 60 s after boot (lets the web server start first).
# Subsequent runs fire every 24 hours.
run_pipeline() {
  echo "[pipeline] $(date '+%Y-%m-%d %H:%M:%S') — daily run starting"
  python -m pipeline.main daily --max-cap 25000000 2>&1 | tail -40 || true
  echo "[pipeline] $(date '+%Y-%m-%d %H:%M:%S') — done"
}

(
  sleep 60
  run_pipeline
  while true; do
    sleep 86400
    run_pipeline
  done
) &

# ── Next.js web server ────────────────────────────────────────────────────────
echo "[start] Starting Next.js on port ${PORT:-3000}…"
exec npx next start --port "${PORT:-3000}"
