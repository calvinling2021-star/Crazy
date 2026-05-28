"""Dune adapter: mock the HTTP and verify the payload shape matches what the
cache loader + backtest expect."""
from __future__ import annotations

import json
from unittest.mock import patch

from polymarket.sources.dune import fetch_via_dune


def _stub_execute(payload_by_query: dict[int, list[dict]]):
    """Build a DuneClient.execute stub that returns canned rows by query_id."""

    def _fake(self, query_id, params=None):
        return payload_by_query[query_id]

    return _fake


def test_dune_payload_shape_matches_cache_loader():
    leaderboard_rows = [
        {"wallet": "0xAAA", "pnl_usd": 50000, "volume_usd": 500000, "trades": 250},
        {"wallet": "0xBBB", "pnl_usd": 30000, "volume_usd": 400000, "trades": 180},
    ]
    trade_rows = [
        {"wallet": "0xaaa", "market": "m1", "outcome": "YES", "side": "BUY",
         "price": 0.4, "size": 100, "timestamp": "2025-01-01T00:00:00Z"},
        {"wallet": "0xaaa", "market": "m1", "outcome": "YES", "side": "SELL",
         "price": 0.6, "size": 100, "timestamp": "2025-02-01T00:00:00Z"},
        {"wallet": "0xbbb", "market": "m2", "outcome": "NO", "side": "BUY",
         "price": 0.3, "size": 200, "timestamp": "2025-01-15T00:00:00Z"},
    ]
    market_rows = [
        {"id": "m1", "outcomes": ["YES", "NO"], "outcomePrices": [1, 0], "closed": True, "resolved": True},
        {"id": "m2", "outcomes": ["YES", "NO"], "outcomePrices": [0, 1], "closed": True, "resolved": True},
    ]
    by_q = {100: leaderboard_rows, 200: trade_rows, 300: market_rows}

    with patch("polymarket.sources.dune.DuneClient.execute", _stub_execute(by_q)):
        payload = fetch_via_dune(
            api_key="dummy",
            leaderboard_query=100,
            trades_query=200,
            markets_query=300,
            top=2,
            window_months=12,
        )

    assert payload["version"] == 1
    assert payload["source"] == "dune"
    assert len(payload["wallets"]) == 2
    assert payload["wallets"][0]["wallet"] == "0xaaa"  # lower-cased
    assert payload["wallets"][0]["pnl_usd"] == 50000
    assert len(payload["trades_by_wallet"]["0xaaa"]) == 2
    assert "m1" in payload["markets"]

    # Round-trip through the cache loader -> the existing CachedClient.
    from polymarket.cache import CachedClient
    client = CachedClient(payload)
    lb = client.leaderboard(metric="profit", limit=10)
    assert lb[0]["proxyWallet"] == "0xaaa"
    assert client.all_trades("0xaaa")[0]["side"] == "BUY"
    assert client.market("m1")["closed"] is True


def test_dune_handles_missing_markets_query():
    """User may skip the markets query — payload should still be valid (markets={})."""
    by_q = {
        100: [{"wallet": "0xAAA", "pnl_usd": 10, "volume_usd": 100, "trades": 5}],
        200: [],
    }
    with patch("polymarket.sources.dune.DuneClient.execute", _stub_execute(by_q)):
        payload = fetch_via_dune(
            api_key="dummy",
            leaderboard_query=100,
            trades_query=200,
            markets_query=None,
            top=1,
            window_months=6,
        )
    assert payload["markets"] == {}
