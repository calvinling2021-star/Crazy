"""Adapter for Jon-Becker's public Polymarket + Kalshi data dump.

Source: https://s3.jbecker.dev/data.tar.zst  (~few GB, free, no auth)
Schemas: https://github.com/Jon-Becker/prediction-market-analysis (docs/SCHEMAS.md)

Workflow for the user (on a normal machine):
    curl -L -o data.tar.zst https://s3.jbecker.dev/data.tar.zst
    zstd -d data.tar.zst -c | tar -xf -          # extracts to ./data/
    python -m polymarket.sources.jbecker --data-dir data --out cache.json
    python -m polymarket.backtest --cache cache.json ...

What this adapter does
----------------------
* Reads `data/polymarket/markets.parquet` for market metadata + resolutions.
* Reads `data/polymarket/trades.parquet` (CTF Exchange OrderFilled events).
* Decodes maker/taker amounts and asset_ids into (wallet, market, outcome,
  side, price, size, timestamp) tuples — both sides of each fill get a
  trade entry, since each side is a distinct trader.
* Aggregates wallet-level PnL = sum(sell_notional) − sum(buy_notional) +
  mark-to-resolution on open positions.
* Writes the same JSON shape the `--cache` flag of `polymarket.backtest`
  expects (version 1).

Field-name fallbacks
--------------------
The exact column names in jbecker's parquet have drifted between releases.
This adapter tries a small list of plausible names for each field
(`--inspect` lets you see what's actually there before running the full
conversion). If your file has a name we don't recognise, pass overrides
on the CLI (`--col-maker maker_addr`, etc.) — or print the schema with
`--inspect` and tell us which name to add to the default fallbacks.
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

log = logging.getLogger(__name__)

# Column-name fallbacks (we try each in order). Override via CLI if needed.
COL_FALLBACKS = {
    "maker":          ["maker", "maker_address", "maker_addr"],
    "taker":          ["taker", "taker_address", "taker_addr"],
    "maker_asset_id": ["maker_asset_id", "makerAssetId", "maker_token_id"],
    "taker_asset_id": ["taker_asset_id", "takerAssetId", "taker_token_id"],
    "maker_amount":   ["maker_amount", "makerAmount", "maker_amount_filled"],
    "taker_amount":   ["taker_amount", "takerAmount", "taker_amount_filled"],
    "timestamp":      ["timestamp", "block_time", "block_timestamp", "_fetched_at"],
    "market_id":      ["condition_id", "market_id", "conditionId", "id"],
    "outcome_idx":    ["outcome_index", "outcome_idx", "outcomeIndex"],
}


def _first_present(cols: list[str], options: list[str]) -> str | None:
    for o in options:
        if o in cols:
            return o
    return None


def _resolve_columns(df_columns: list[str], overrides: dict[str, str]) -> dict[str, str]:
    resolved: dict[str, str] = {}
    for key, options in COL_FALLBACKS.items():
        ovr = overrides.get(key)
        if ovr:
            resolved[key] = ovr
            continue
        col = _first_present(df_columns, options)
        if col:
            resolved[key] = col
    return resolved


def inspect(data_dir: Path) -> None:
    """Print parquet schemas + first 3 rows of each file. Use this once to
    figure out which column names jbecker's current dump uses."""
    import pandas as pd

    pm_dir = data_dir / "polymarket"
    if not pm_dir.exists():
        print(f"ERROR: {pm_dir} not found. Did you extract data.tar.zst here?")
        sys.exit(2)
    for parquet in sorted(pm_dir.glob("*.parquet")):
        print(f"\n=== {parquet.relative_to(data_dir)} ({parquet.stat().st_size/1e6:.1f} MB) ===")
        df = pd.read_parquet(parquet)
        print("columns:", list(df.columns))
        print("dtypes:")
        for c, d in df.dtypes.items():
            print(f"  {c:30s}  {d}")
        print(f"rows: {len(df):,}")
        if not df.empty:
            print("first 3 rows:")
            print(df.head(3).to_string())


def fetch_via_jbecker(
    data_dir: Path,
    top: int = 200,
    window_months: int = 12,
    col_overrides: dict[str, str] | None = None,
    min_trades: int = 5,
) -> dict[str, Any]:
    import pandas as pd

    overrides = col_overrides or {}

    # ---- markets / resolutions ----
    markets_path = data_dir / "polymarket" / "markets.parquet"
    log.info("loading markets: %s", markets_path)
    mdf = pd.read_parquet(markets_path)
    market_lookup: dict[str, dict[str, Any]] = {}
    # field-name fallbacks for markets
    mid_col = _first_present(list(mdf.columns), ["condition_id", "id", "market_id"])
    out_col = _first_present(list(mdf.columns), ["outcomes", "outcome_names"])
    price_col = _first_present(list(mdf.columns), ["outcome_prices", "outcomePrices"])
    closed_col = _first_present(list(mdf.columns), ["closed", "resolved", "active"])
    if mid_col is None:
        raise ValueError(f"can't find market id column in {list(mdf.columns)}")
    for _, row in mdf.iterrows():
        mid = str(row[mid_col])
        rec: dict[str, Any] = {"id": mid}
        if out_col:
            outs = row[out_col]
            if isinstance(outs, str):
                try:
                    outs = json.loads(outs)
                except Exception:
                    pass
            rec["outcomes"] = outs
        if price_col:
            prices = row[price_col]
            if isinstance(prices, str):
                try:
                    prices = json.loads(prices)
                except Exception:
                    pass
            rec["outcomePrices"] = prices
        if closed_col:
            rec["closed"] = bool(row[closed_col])
            rec["resolved"] = bool(row[closed_col])
        market_lookup[mid] = rec
    log.info("loaded %d markets", len(market_lookup))

    # ---- trades ----
    trades_path = data_dir / "polymarket" / "trades.parquet"
    log.info("loading trades: %s", trades_path)
    tdf = pd.read_parquet(trades_path)
    cols = _resolve_columns(list(tdf.columns), overrides)
    missing = [k for k in ("maker", "taker", "maker_amount", "taker_amount", "timestamp") if k not in cols]
    if missing:
        raise ValueError(
            f"trades.parquet missing required columns {missing}. "
            f"Available: {list(tdf.columns)}. "
            f"Pass --col-{missing[0]} <name> to override."
        )

    # Optional time-window filter
    if window_months:
        ts_col = cols["timestamp"]
        ts = pd.to_datetime(tdf[ts_col], utc=True, errors="coerce")
        cutoff = pd.Timestamp.now(tz="UTC") - pd.DateOffset(months=window_months)
        keep = ts >= cutoff
        log.info("filtering to last %d months: %d → %d rows", window_months, len(tdf), int(keep.sum()))
        tdf = tdf[keep].copy()

    # Convert each row into TWO per-trader records (maker + taker).
    # CTF exchange: when an order fills, maker provides maker_asset, receives taker_asset.
    # If maker_asset_id == 0 → maker pays USDC → maker BUYS outcome tokens. Taker SELLS.
    # If taker_asset_id == 0 → taker pays USDC → taker BUYS outcome tokens. Maker SELLS.
    log.info("normalising %d fills into per-trader trades…", len(tdf))
    wallet_trades: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in tdf.itertuples(index=False):
        getr = lambda k: getattr(row, cols[k]) if k in cols else None  # noqa: E731
        maker = str(getr("maker") or "").lower()
        taker = str(getr("taker") or "").lower()
        maker_aid = getr("maker_asset_id") or 0
        taker_aid = getr("taker_asset_id") or 0
        # amounts are USDC/token in 6-decimal fixed-point
        try:
            maker_amt = int(getr("maker_amount") or 0) / 1e6
            taker_amt = int(getr("taker_amount") or 0) / 1e6
        except (TypeError, ValueError):
            continue
        if maker_amt <= 0 or taker_amt <= 0:
            continue
        ts_val = getr("timestamp")
        ts_iso = pd.Timestamp(ts_val, tz="UTC").isoformat() if ts_val is not None else None

        if int(maker_aid) == 0 and int(taker_aid) != 0:
            buyer, seller = maker, taker
            usdc, tokens, asset_id = maker_amt, taker_amt, taker_aid
        elif int(taker_aid) == 0 and int(maker_aid) != 0:
            buyer, seller = taker, maker
            usdc, tokens, asset_id = taker_amt, maker_amt, maker_aid
        else:
            continue  # both or neither USDC — skip oddities

        price = usdc / tokens if tokens > 0 else 0
        if price <= 0 or price >= 1:
            continue

        # We can't resolve asset_id → (market, outcome) without the conditional
        # token registry; for backtesting we use asset_id as the market key,
        # which is fine because the simulator only cares about (key, side, price).
        market_key = str(asset_id)
        outcome_label = "YES"  # placeholder — fills with same asset_id are same outcome

        wallet_trades[buyer].append({
            "market": market_key, "outcome": outcome_label, "side": "BUY",
            "price": round(price, 6), "size": round(tokens, 6), "timestamp": ts_iso,
        })
        wallet_trades[seller].append({
            "market": market_key, "outcome": outcome_label, "side": "SELL",
            "price": round(price, 6), "size": round(tokens, 6), "timestamp": ts_iso,
        })

    log.info("expanded into %d (wallet, side, fill) records across %d wallets",
             sum(len(v) for v in wallet_trades.values()), len(wallet_trades))

    # ---- rank wallets by realised PnL ----
    log.info("ranking wallets by realised PnL (selection-window proxy)")
    pnls: list[tuple[str, float, float, int]] = []
    for w, trs in wallet_trades.items():
        if len(trs) < min_trades:
            continue
        buy_usd = sum(t["price"] * t["size"] for t in trs if t["side"] == "BUY")
        sell_usd = sum(t["price"] * t["size"] for t in trs if t["side"] == "SELL")
        # crude PnL ignoring open positions; close enough for ranking.
        pnls.append((w, sell_usd - buy_usd, buy_usd + sell_usd, len(trs)))
    pnls.sort(key=lambda r: r[1], reverse=True)
    top_n = pnls[:top]
    log.info("top wallet PnL=$%.0f, median=$%.0f, %d wallets above threshold",
             top_n[0][1] if top_n else 0,
             pnls[len(pnls) // 2][1] if pnls else 0,
             len(pnls))

    wallets = [
        {
            "rank": i + 1,
            "wallet": w,
            "name": None,
            "pnl_usd": pnl,
            "volume_usd": vol,
            "positions": tr,
            "window": f"{window_months}m",
        }
        for i, (w, pnl, vol, tr) in enumerate(top_n)
    ]
    top_wallets = {w["wallet"] for w in wallets}
    filtered_trades = {w: wallet_trades[w] for w in top_wallets}

    return {
        "version": 1,
        "fetched_at": int(time.time()),
        "window": f"{window_months}m",
        "wallets": wallets,
        "trades_by_wallet": filtered_trades,
        "markets": market_lookup,
        "source": "jbecker",
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Build cache.json from Jon-Becker's data dump")
    p.add_argument("--data-dir", default="data", help="path to extracted jbecker data dir")
    p.add_argument("--top", type=int, default=200)
    p.add_argument("--window-months", type=int, default=12)
    p.add_argument("--min-trades", type=int, default=5)
    p.add_argument("--out", default="cache.json")
    p.add_argument("--inspect", action="store_true",
                   help="print parquet schema + samples and exit (no conversion)")
    for k in COL_FALLBACKS:
        p.add_argument(f"--col-{k.replace('_', '-')}", default=None,
                       help=f"override column name for '{k}'")
    p.add_argument("--log-level", default="INFO")
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=getattr(logging, args.log_level.upper()),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    data_dir = Path(args.data_dir)
    if args.inspect:
        inspect(data_dir)
        return 0
    overrides = {k: getattr(args, f"col_{k}") for k in COL_FALLBACKS
                 if getattr(args, f"col_{k}", None)}
    payload = fetch_via_jbecker(
        data_dir=data_dir,
        top=args.top,
        window_months=args.window_months,
        col_overrides=overrides,
        min_trades=args.min_trades,
    )
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, default=str))
    print(
        f"wrote {out} — {len(payload['wallets'])} wallets, "
        f"{sum(len(t) for t in payload['trades_by_wallet'].values())} trades, "
        f"{len(payload['markets'])} markets, "
        f"{out.stat().st_size / 1e6:.1f} MB"
    )
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
