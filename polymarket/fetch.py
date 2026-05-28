"""Fetch wallet activity from Polymarket and cache it to disk.

Backtests are usually slow because they pull many wallets x thousands of
trades from the Data API. This script does the slow part once, writes a
JSON file, and then `python -m polymarket.backtest --cache <file>` can
re-run any strategy config in seconds against the cached data.

Usage:
    python -m polymarket.fetch --top 100 --out cache.json
    python -m polymarket.backtest --cache cache.json --min-consensus-leaders 2
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from pathlib import Path

from .api import PolymarketClient
from .leaderboard import fetch_top_profitable_wallets


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Fetch and cache Polymarket trade history")
    p.add_argument("--top", type=int, default=200, help="how many leaderboard wallets to fetch")
    p.add_argument("--window", default="all", choices=["1d", "7d", "30d", "all"])
    p.add_argument("--trades-per-wallet", type=int, default=2000)
    p.add_argument("--out", required=True, help="output JSON file")
    p.add_argument("--include-markets", action="store_true",
                   help="also fetch market metadata for resolution lookup (slow)")
    p.add_argument("--log-level", default="INFO")
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=getattr(logging, args.log_level.upper()),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    log = logging.getLogger("polymarket.fetch")

    client = PolymarketClient()
    log.info("fetching top %d wallets (window=%s)", args.top, args.window)
    ranked = fetch_top_profitable_wallets(client, n=args.top, window=args.window)
    log.info("got %d wallets, fetching trade history…", len(ranked))

    trades_by_wallet: dict[str, list] = {}
    failures: list[str] = []
    t0 = time.time()
    for i, r in enumerate(ranked, start=1):
        try:
            trades_by_wallet[r.wallet] = client.all_trades(r.wallet, hard_cap=args.trades_per_wallet)
        except Exception as exc:
            log.warning("activity for %s failed: %s", r.wallet, exc)
            failures.append(r.wallet)
            continue
        if i % 10 == 0:
            elapsed = time.time() - t0
            rate = i / elapsed if elapsed > 0 else 0
            eta = (len(ranked) - i) / rate if rate > 0 else 0
            log.info("…%d/%d wallets (%.1f wallets/s, ETA %.0fs)", i, len(ranked), rate, eta)

    payload: dict[str, object] = {
        "version": 1,
        "fetched_at": int(time.time()),
        "window": args.window,
        "wallets": [r.to_dict() for r in ranked],
        "trades_by_wallet": trades_by_wallet,
        "failures": failures,
    }

    if args.include_markets:
        market_ids = set()
        for trades in trades_by_wallet.values():
            for t in trades:
                mid = t.get("market") or t.get("conditionId") or t.get("marketId")
                if mid:
                    market_ids.add(str(mid))
        log.info("fetching %d unique markets for resolution lookup…", len(market_ids))
        markets: dict[str, dict] = {}
        for i, mid in enumerate(sorted(market_ids), start=1):
            try:
                markets[mid] = client.market(mid)
            except Exception as exc:
                log.warning("market %s: %s", mid, exc)
            if i % 50 == 0:
                log.info("…%d/%d markets", i, len(market_ids))
        payload["markets"] = markets

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, default=str))
    log.info("wrote %s (%d wallets, %d total trades, %.1f MB)",
             out_path,
             len(trades_by_wallet),
             sum(len(t) for t in trades_by_wallet.values()),
             out_path.stat().st_size / 1e6)
    if failures:
        log.warning("%d wallets failed to fetch: %s…", len(failures), failures[:3])
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
