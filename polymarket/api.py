"""Thin client over Polymarket's public HTTP endpoints.

Endpoints used (all public, read-only, documented at https://docs.polymarket.com):
  * https://lb-api.polymarket.com/leaderboard       -> ranked trader leaderboards
  * https://data-api.polymarket.com/profit          -> PnL aggregates per wallet
  * https://data-api.polymarket.com/positions       -> open positions per wallet
  * https://data-api.polymarket.com/activity        -> historical trades per wallet
  * https://gamma-api.polymarket.com/markets/{id}   -> market metadata + resolution

Network errors and HTTP errors are retried with exponential backoff. The client
is purely read-only; nothing here signs transactions or places orders.
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Any, Iterable

import requests

log = logging.getLogger(__name__)

LB_BASE = "https://lb-api.polymarket.com"
DATA_BASE = "https://data-api.polymarket.com"
GAMMA_BASE = "https://gamma-api.polymarket.com"


@dataclass
class PolymarketClient:
    timeout: float = 20.0
    max_retries: int = 4
    backoff_base: float = 1.5
    session: requests.Session | None = None

    def __post_init__(self) -> None:
        if self.session is None:
            self.session = requests.Session()
            self.session.headers.update(
                {
                    "User-Agent": "polymarket-copy-sim/0.1 (+research)",
                    "Accept": "application/json",
                }
            )

    def _get(self, url: str, params: dict[str, Any] | None = None) -> Any:
        last_exc: Exception | None = None
        for attempt in range(self.max_retries):
            try:
                resp = self.session.get(url, params=params or {}, timeout=self.timeout)
                if resp.status_code == 429:
                    sleep_for = self.backoff_base ** (attempt + 1)
                    log.warning("rate-limited on %s, sleeping %.1fs", url, sleep_for)
                    time.sleep(sleep_for)
                    continue
                resp.raise_for_status()
                return resp.json()
            except (requests.RequestException, ValueError) as exc:
                last_exc = exc
                sleep_for = self.backoff_base**attempt
                log.warning(
                    "GET %s failed (attempt %d/%d): %s — retrying in %.1fs",
                    url,
                    attempt + 1,
                    self.max_retries,
                    exc,
                    sleep_for,
                )
                time.sleep(sleep_for)
        raise RuntimeError(f"GET {url} failed after {self.max_retries} attempts: {last_exc}")

    # ---------- Leaderboard ----------
    def leaderboard(
        self,
        window: str = "all",
        metric: str = "profit",
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        """Top wallets by `metric` ('profit' | 'volume') over `window`.

        `window` ∈ {'1d','7d','30d','all'}.  Returns a list of dicts with at
        least: proxyWallet, name, pnl (USDC), volume, positions.
        """
        url = f"{LB_BASE}/leaderboard"
        data = self._get(url, params={"window": window, "metric": metric, "limit": limit})
        if isinstance(data, dict) and "leaderboard" in data:
            data = data["leaderboard"]
        return list(data)[:limit]

    # ---------- Per-wallet ----------
    def profit(self, wallet: str) -> dict[str, Any]:
        return self._get(f"{DATA_BASE}/profit", params={"user": wallet})

    def positions(self, wallet: str, size_threshold: float = 1.0) -> list[dict[str, Any]]:
        return self._get(
            f"{DATA_BASE}/positions",
            params={"user": wallet, "sizeThreshold": size_threshold},
        )

    def activity(
        self,
        wallet: str,
        limit: int = 500,
        offset: int = 0,
        types: Iterable[str] = ("TRADE",),
    ) -> list[dict[str, Any]]:
        """Recent on-chain activity for a wallet, newest first."""
        params = {
            "user": wallet,
            "limit": limit,
            "offset": offset,
            "type": ",".join(types),
        }
        return self._get(f"{DATA_BASE}/activity", params=params)

    def all_trades(self, wallet: str, page_size: int = 500, hard_cap: int = 5000) -> list[dict[str, Any]]:
        """Paginate through a wallet's TRADE activity up to `hard_cap` events."""
        out: list[dict[str, Any]] = []
        offset = 0
        while len(out) < hard_cap:
            page = self.activity(wallet, limit=page_size, offset=offset, types=("TRADE",))
            if not page:
                break
            out.extend(page)
            if len(page) < page_size:
                break
            offset += page_size
        return out[:hard_cap]

    # ---------- Markets ----------
    def market(self, market_id: str) -> dict[str, Any]:
        return self._get(f"{GAMMA_BASE}/markets/{market_id}")
