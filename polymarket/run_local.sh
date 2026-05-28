#!/usr/bin/env bash
# Turnkey local runner for the Polymarket copy-trading backtest.
#
# Workflow:
#   1. Install Python deps (idempotent).
#   2. Fetch top wallets + trade history from Polymarket (slow, network-dependent).
#   3. Run the recommended backtest config against the cached data.
#   4. Re-run with the honest baseline (random-pool) for comparison.
#
# Re-runs of step 3/4 with different strategy knobs are instant — they read
# the cache from step 2 instead of re-fetching.
#
# Polymarket geo-blocks US users. If `--cache` write fails with 403s, you
# need to run this from a non-US network or via a VPN.

set -euo pipefail

CACHE=${CACHE:-polymarket/results/cache.json}
TOP=${TOP:-200}
WINDOW=${WINDOW:-all}

cd "$(dirname "$0")/.."

echo "==> 1) installing deps"
pip install -q -r polymarket/requirements.txt

if [[ -f "$CACHE" ]]; then
  echo "==> 2) reusing cached data at $CACHE  (delete to refetch)"
else
  echo "==> 2) fetching top $TOP wallets + trade history -> $CACHE  (slow, ~5–10 min)"
  python -m polymarket.fetch \
    --top "$TOP" \
    --window "$WINDOW" \
    --include-markets \
    --out "$CACHE"
fi

echo
echo "==> 3) running recommended config (pool=50, top-50, consensus>=2 / 24h, fraction=2%)"
python -m polymarket.backtest \
  --cache "$CACHE" \
  --candidate-pool 50 --top-k 50 \
  --min-consensus-leaders 2 --consensus-window-hours 24 \
  --fraction 0.02 \
  --out polymarket/results/backtest_main

echo
echo "==> 4) honest baseline (random-pool, no leaderboard look-ahead)"
python -m polymarket.backtest \
  --cache "$CACHE" \
  --candidate-pool 50 --top-k 50 \
  --pool-rank-by random \
  --min-consensus-leaders 2 --consensus-window-hours 24 \
  --fraction 0.02 \
  --out polymarket/results/backtest_honest

echo
echo "Done. Compare polymarket/results/backtest_main/summary.json vs ./backtest_honest/summary.json."
