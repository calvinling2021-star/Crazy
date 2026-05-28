"""Dune Analytics as an alternative data source.

Polymarket's on-chain trades are fully indexed on Dune, so for US users (or
anyone who'd rather not VPN), Dune is the cleanest route to the same data.

Workflow for the user:
  1. Sign up at https://dune.com (free) and get an API key from Settings → API.
  2. Create the THREE saved queries below on Dune (paste the SQL, save, note
     the query_id from the URL: dune.com/queries/<query_id>).
  3. Run:
       export DUNE_API_KEY=...
       python -m polymarket.sources.dune \
         --leaderboard-query 12345 \
         --trades-query     67890 \
         --markets-query    13579 \
         --top 200 \
         --window-months 12 \
         --out cache.json
  4. Use the cache file with the existing backtest:
       python -m polymarket.backtest --cache cache.json ...

Dune free-tier limits at 2,500 executions/month, plenty for monthly refresh
plus iteration on strategy configs.

REFERENCE SQL (paste into Dune; adjust table names if Polymarket's curated
views have changed — check dune.com/browse?q=polymarket for the current
canonical table set):

-- QUERY 1: top wallets by 12-month estimated PnL
WITH t AS (
  SELECT
    "user" AS wallet,
    side,
    price,
    size,
    price * size AS notional_usd,
    block_time
  FROM polymarket.trades
  WHERE block_time > NOW() - INTERVAL '{{months}}' MONTH
)
SELECT
  wallet,
  SUM(CASE WHEN side = 'SELL' THEN notional_usd ELSE -notional_usd END) AS pnl_usd,
  SUM(notional_usd) AS volume_usd,
  COUNT(*)          AS trades
FROM t
GROUP BY wallet
ORDER BY pnl_usd DESC
LIMIT {{top}}
-- Parameters: months (number, default 12), top (number, default 200)

-- QUERY 2: all trades for the top-N wallets in the lookback window.
-- Parameter `wallets` is a comma-separated string of addresses.
SELECT
  "user"     AS wallet,
  market_id  AS market,
  outcome,
  side,
  price,
  size,
  block_time AS timestamp
FROM polymarket.trades
WHERE block_time > NOW() - INTERVAL '{{months}}' MONTH
  AND "user" IN (SELECT TRIM(VALUE) FROM UNNEST(SPLIT('{{wallets}}', ',')) t(VALUE))
ORDER BY block_time

-- QUERY 3: market resolutions
SELECT
  market_id     AS id,
  closed,
  resolved,
  outcomes,
  outcome_prices AS "outcomePrices"
FROM polymarket.markets
WHERE market_id IN (SELECT TRIM(VALUE) FROM UNNEST(SPLIT('{{markets}}', ',')) t(VALUE))
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any

import requests

log = logging.getLogger(__name__)

DUNE_BASE = "https://api.dune.com/api/v1"


class DuneClient:
    def __init__(self, api_key: str, timeout: float = 60.0, poll_interval: float = 2.5):
        if not api_key:
            raise ValueError("DUNE_API_KEY missing — get one at dune.com/settings/api")
        self.api_key = api_key
        self.timeout = timeout
        self.poll_interval = poll_interval
        self.session = requests.Session()
        self.session.headers.update({"X-Dune-API-Key": api_key, "Accept": "application/json"})

    def execute(self, query_id: int, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        body = {"query_parameters": params or {}}
        r = self.session.post(f"{DUNE_BASE}/query/{query_id}/execute", json=body, timeout=self.timeout)
        r.raise_for_status()
        exec_id = r.json()["execution_id"]
        log.info("dune query %s started → %s", query_id, exec_id)
        deadline = time.time() + 600  # 10 min cap per query
        while time.time() < deadline:
            sr = self.session.get(f"{DUNE_BASE}/execution/{exec_id}/status", timeout=self.timeout)
            sr.raise_for_status()
            state = sr.json().get("state")
            if state == "QUERY_STATE_COMPLETED":
                break
            if state in ("QUERY_STATE_FAILED", "QUERY_STATE_CANCELLED", "QUERY_STATE_EXPIRED"):
                raise RuntimeError(f"dune query {query_id} {state}: {sr.json()}")
            time.sleep(self.poll_interval)
        else:
            raise TimeoutError(f"dune query {query_id} did not complete in 10 min")
        rr = self.session.get(f"{DUNE_BASE}/execution/{exec_id}/results", timeout=self.timeout)
        rr.raise_for_status()
        return rr.json()["result"]["rows"]


def _num(v: Any, default: float = 0.0) -> float:
    try:
        return float(v) if v is not None else default
    except (TypeError, ValueError):
        return default


def fetch_via_dune(
    api_key: str,
    leaderboard_query: int,
    trades_query: int,
    markets_query: int | None,
    top: int,
    window_months: int,
) -> dict[str, Any]:
    client = DuneClient(api_key)

    log.info("fetching leaderboard (query %d, top=%d, months=%d)", leaderboard_query, top, window_months)
    lb_rows = client.execute(leaderboard_query, {"months": window_months, "top": top})
    wallets = []
    for i, row in enumerate(lb_rows[:top], start=1):
        addr = (row.get("wallet") or row.get("user") or row.get("address") or "").lower()
        if not addr:
            continue
        wallets.append(
            {
                "rank": i,
                "wallet": addr,
                "name": row.get("name"),
                "pnl_usd": _num(row.get("pnl_usd") or row.get("pnl")),
                "volume_usd": _num(row.get("volume_usd") or row.get("volume")),
                "positions": int(_num(row.get("trades") or row.get("positions"))),
                "window": f"{window_months}m",
            }
        )

    wallet_addrs = ",".join(w["wallet"] for w in wallets)
    log.info("fetching trades for %d wallets (query %d)", len(wallets), trades_query)
    trade_rows = client.execute(
        trades_query, {"months": window_months, "wallets": wallet_addrs}
    )
    trades_by_wallet: dict[str, list[dict[str, Any]]] = {w["wallet"]: [] for w in wallets}
    for row in trade_rows:
        addr = (row.get("wallet") or row.get("user") or "").lower()
        if addr in trades_by_wallet:
            trades_by_wallet[addr].append(
                {
                    "market": row.get("market") or row.get("market_id"),
                    "outcome": (row.get("outcome") or "YES").upper(),
                    "side": (row.get("side") or "").upper(),
                    "price": _num(row.get("price")),
                    "size": _num(row.get("size")),
                    "timestamp": row.get("timestamp") or row.get("block_time"),
                }
            )

    markets: dict[str, dict[str, Any]] = {}
    if markets_query:
        market_ids = sorted({t["market"] for trs in trades_by_wallet.values() for t in trs if t.get("market")})
        log.info("fetching resolutions for %d markets (query %d)", len(market_ids), markets_query)
        chunk_size = 1000  # Dune query param length limits
        for i in range(0, len(market_ids), chunk_size):
            chunk = market_ids[i : i + chunk_size]
            rows = client.execute(markets_query, {"markets": ",".join(chunk)})
            for row in rows:
                mid = str(row.get("id") or row.get("market_id") or row.get("market"))
                markets[mid] = row

    return {
        "version": 1,
        "fetched_at": int(time.time()),
        "window": f"{window_months}m",
        "wallets": wallets,
        "trades_by_wallet": trades_by_wallet,
        "markets": markets,
        "source": "dune",
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Fetch Polymarket data via Dune Analytics")
    p.add_argument("--api-key", default=os.getenv("DUNE_API_KEY"),
                   help="Dune API key (or set DUNE_API_KEY env var)")
    p.add_argument("--leaderboard-query", type=int, required=True)
    p.add_argument("--trades-query", type=int, required=True)
    p.add_argument("--markets-query", type=int, default=None)
    p.add_argument("--top", type=int, default=200)
    p.add_argument("--window-months", type=int, default=12)
    p.add_argument("--out", required=True)
    p.add_argument("--log-level", default="INFO")
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=getattr(logging, args.log_level.upper()),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    if not args.api_key:
        print("DUNE_API_KEY missing — set env var or pass --api-key", file=sys.stderr)
        return 2
    payload = fetch_via_dune(
        api_key=args.api_key,
        leaderboard_query=args.leaderboard_query,
        trades_query=args.trades_query,
        markets_query=args.markets_query,
        top=args.top,
        window_months=args.window_months,
    )
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, default=str))
    print(
        f"wrote {out_path} — {len(payload['wallets'])} wallets, "
        f"{sum(len(t) for t in payload['trades_by_wallet'].values())} trades, "
        f"{len(payload.get('markets', {}))} markets"
    )
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
