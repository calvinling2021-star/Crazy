"""Rank wallets by realised PnL and surface the top N."""
from __future__ import annotations

import logging
from dataclasses import dataclass, asdict
from typing import Any

from .api import PolymarketClient

log = logging.getLogger(__name__)


@dataclass
class WalletRank:
    rank: int
    wallet: str
    name: str | None
    pnl_usd: float
    volume_usd: float
    positions: int
    window: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _coerce_float(v: Any) -> float:
    try:
        return float(v) if v is not None else 0.0
    except (TypeError, ValueError):
        return 0.0


def fetch_top_profitable_wallets(
    client: PolymarketClient | None = None,
    n: int = 100,
    window: str = "all",
) -> list[WalletRank]:
    """Return the top `n` wallets by realised profit over `window`."""
    client = client or PolymarketClient()
    raw = client.leaderboard(window=window, metric="profit", limit=n)

    ranked: list[WalletRank] = []
    for i, row in enumerate(raw, start=1):
        wallet = row.get("proxyWallet") or row.get("address") or row.get("user")
        if not wallet:
            continue
        ranked.append(
            WalletRank(
                rank=i,
                wallet=wallet.lower(),
                name=row.get("name") or row.get("pseudonym") or None,
                pnl_usd=_coerce_float(row.get("pnl") or row.get("profit")),
                volume_usd=_coerce_float(row.get("volume")),
                positions=int(_coerce_float(row.get("positions"))),
                window=window,
            )
        )
        if len(ranked) >= n:
            break

    log.info(
        "fetched %d wallets (window=%s); top PnL=$%.0f bottom PnL=$%.0f",
        len(ranked),
        window,
        ranked[0].pnl_usd if ranked else 0.0,
        ranked[-1].pnl_usd if ranked else 0.0,
    )
    return ranked
