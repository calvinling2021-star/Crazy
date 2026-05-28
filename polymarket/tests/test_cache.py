"""Cache round-trip: synth pool -> serialise -> load -> backtest must match."""
from __future__ import annotations

import json
import tempfile
from pathlib import Path

from polymarket.backtest import BacktestConfig, run_walk_forward
from polymarket.cache import load_cached_client
from polymarket.simulator import SimConfig
from polymarket.synthetic import _FakeClient, _generate_population


def _baseline_cfg() -> BacktestConfig:
    return BacktestConfig(
        candidate_pool=40, top_k=20,
        selection_months=6, validation_months=6,
        trades_per_wallet=2000, capital_usd=10_000.0,
        sim=SimConfig(starting_capital_usd=10_000.0, min_leader_pnl_usd=0.0),
    )


def test_cache_roundtrip_matches_live_run():
    """Identical pipeline must yield identical metrics whether we feed the
    FakeClient directly or via the JSON cache loader."""
    wallets, trades, markets = _generate_population(n_wallets=80, n_markets=200, horizon_days=400, seed=21)
    live_client = _FakeClient(wallets, trades, markets)
    live = run_walk_forward(live_client, _baseline_cfg())

    payload = {
        "version": 1,
        "wallets": [w.to_dict() for w in wallets],
        "trades_by_wallet": trades,
        "markets": markets,
    }
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "cache.json"
        path.write_text(json.dumps(payload, default=str))
        cached_client = load_cached_client(path)
        cached = run_walk_forward(cached_client, _baseline_cfg())

    # Same selected wallets and same number of copy trades.
    assert set(live["selection_pnl"].keys()) == set(cached["selection_pnl"].keys())
    assert live["num_copy_trades"] == cached["num_copy_trades"]
    # PnL agreement: small float diffs are fine, structural metrics must match.
    assert abs(live["return_pct"] - cached["return_pct"]) < 1e-6


def test_cache_loader_rejects_unknown_version(tmp_path):
    p = tmp_path / "bad.json"
    p.write_text(json.dumps({"version": 999}))
    try:
        load_cached_client(p)
    except ValueError as e:
        assert "version" in str(e)
    else:
        raise AssertionError("expected ValueError for unknown cache version")
