"""Replay-from-disk: load a fetched JSON and serve it via the PolymarketClient
interface so `run_walk_forward` can use it without network calls."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .api import PolymarketClient


class CachedClient(PolymarketClient):
    """Same surface as PolymarketClient, but reads from a pre-fetched JSON."""

    def __init__(self, payload: dict[str, Any]) -> None:
        self._wallets = payload.get("wallets", [])
        self._trades = {k.lower(): v for k, v in payload.get("trades_by_wallet", {}).items()}
        self._markets = payload.get("markets", {})
        self.session = None  # not used

    def leaderboard(self, window: str = "all", metric: str = "profit", limit: int = 100):
        key = (lambda w: -float(w.get("volume_usd") or 0)) if metric == "volume" \
              else (lambda w: -float(w.get("pnl_usd") or 0))
        ordered = sorted(self._wallets, key=key)[:limit]
        return [
            {
                "proxyWallet": w["wallet"],
                "name": w.get("name"),
                "pnl": w.get("pnl_usd"),
                "volume": w.get("volume_usd"),
                "positions": w.get("positions") or 0,
            }
            for w in ordered
        ]

    def all_trades(self, wallet: str, page_size: int = 500, hard_cap: int = 5000):
        return list(self._trades.get(wallet.lower(), []))[:hard_cap]

    def market(self, market_id: str):
        return self._markets.get(market_id, {})


def load_cached_client(path: str | Path) -> CachedClient:
    payload = json.loads(Path(path).read_text())
    if payload.get("version") != 1:
        raise ValueError(f"unsupported cache version: {payload.get('version')}")
    return CachedClient(payload)
