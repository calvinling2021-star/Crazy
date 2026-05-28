"""Polymarket copy-trading simulator."""
from .api import PolymarketClient
from .leaderboard import fetch_top_profitable_wallets
from .simulator import CopyTradingSimulator, SimConfig

__all__ = [
    "PolymarketClient",
    "fetch_top_profitable_wallets",
    "CopyTradingSimulator",
    "SimConfig",
]
