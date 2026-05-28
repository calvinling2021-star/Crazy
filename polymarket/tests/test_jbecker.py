"""Jbecker adapter: build a tiny parquet pair, run the converter, verify the
output round-trips through CachedClient + backtest."""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import pytest

from polymarket.cache import CachedClient
from polymarket.sources.jbecker import fetch_via_jbecker


def _make_fake_dump(tmp_path: Path) -> Path:
    pm = tmp_path / "polymarket"
    pm.mkdir(parents=True)

    # Two markets, both resolved
    markets = pd.DataFrame([
        {"condition_id": "m1", "outcomes": '["YES","NO"]', "outcome_prices": '[1,0]', "closed": True},
        {"condition_id": "m2", "outcomes": '["YES","NO"]', "outcome_prices": '[0,1]', "closed": True},
    ])
    markets.to_parquet(pm / "markets.parquet")

    # Four fills: alice buys from bob (m1, 0.40), then bob buys from alice (m1, 0.60),
    # carol buys from bob (m2, 0.30), bob buys from carol (m2, 0.45).
    trades = pd.DataFrame([
        {"maker": "0xalice", "taker": "0xbob",
         "maker_asset_id": 0, "taker_asset_id": 101,
         "maker_amount": int(0.40 * 100 * 1e6),
         "taker_amount": int(100 * 1e6),
         "timestamp": "2026-01-01T00:00:00Z"},
        {"maker": "0xbob", "taker": "0xalice",
         "maker_asset_id": 0, "taker_asset_id": 101,
         "maker_amount": int(0.60 * 100 * 1e6),
         "taker_amount": int(100 * 1e6),
         "timestamp": "2026-02-01T00:00:00Z"},
        {"maker": "0xcarol", "taker": "0xbob",
         "maker_asset_id": 0, "taker_asset_id": 202,
         "maker_amount": int(0.30 * 200 * 1e6),
         "taker_amount": int(200 * 1e6),
         "timestamp": "2026-01-15T00:00:00Z"},
        {"maker": "0xbob", "taker": "0xcarol",
         "maker_asset_id": 0, "taker_asset_id": 202,
         "maker_amount": int(0.45 * 200 * 1e6),
         "taker_amount": int(200 * 1e6),
         "timestamp": "2026-02-15T00:00:00Z"},
    ])
    trades.to_parquet(pm / "trades.parquet")
    return tmp_path


def test_jbecker_converts_dump_to_cache(tmp_path):
    data_dir = _make_fake_dump(tmp_path)
    payload = fetch_via_jbecker(
        data_dir=data_dir, top=10, window_months=None, min_trades=1,
    )
    assert payload["version"] == 1
    assert payload["source"] == "jbecker"
    # 3 distinct wallets generated trades (alice, bob, carol)
    wallets = {w["wallet"] for w in payload["wallets"]}
    assert wallets == {"0xalice", "0xbob", "0xcarol"}
    # Markets came through with resolutions decoded
    assert "m1" in payload["markets"]
    assert payload["markets"]["m1"]["outcomes"] == ["YES", "NO"]

    # Cache loader accepts the produced payload
    client = CachedClient(payload)
    lb = client.leaderboard(metric="profit", limit=5)
    assert {row["proxyWallet"] for row in lb} == {"0xalice", "0xbob", "0xcarol"}
    # alice's trade history is non-empty and well-formed
    trades = client.all_trades("0xalice")
    assert trades
    assert all("side" in t and "price" in t and "size" in t for t in trades)


def test_jbecker_requires_canonical_columns(tmp_path):
    pm = tmp_path / "polymarket"
    pm.mkdir(parents=True)
    pd.DataFrame([{"condition_id": "m1", "outcomes": '["YES","NO"]', "closed": True}]).to_parquet(pm / "markets.parquet")
    pd.DataFrame([{"foo": 1, "bar": 2}]).to_parquet(pm / "trades.parquet")
    with pytest.raises(ValueError, match="missing required columns"):
        fetch_via_jbecker(data_dir=tmp_path, top=1, window_months=None, min_trades=1)


def test_jbecker_min_trades_filter(tmp_path):
    data_dir = _make_fake_dump(tmp_path)
    payload = fetch_via_jbecker(
        data_dir=data_dir, top=10, window_months=None, min_trades=100,
    )
    # min_trades=100 with our tiny dataset → no wallet qualifies
    assert payload["wallets"] == []
