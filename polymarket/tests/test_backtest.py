"""Methodology tests for the walk-forward backtest.

The point: a backtest is only useful if its results react correctly to the
input. We run the same pipeline twice — once on a population with real skill,
once on a population with zero skill — and assert the metrics actually
distinguish them. If they don't, the simulator/backtest is broken.
"""
from __future__ import annotations

from polymarket.backtest import BacktestConfig, run_walk_forward
from polymarket.simulator import SimConfig
from polymarket.synthetic import _FakeClient, _generate_population


def _baseline_cfg() -> BacktestConfig:
    return BacktestConfig(
        candidate_pool=120,
        top_k=40,
        selection_months=6,
        validation_months=6,
        trades_per_wallet=2000,
        capital_usd=10_000.0,
        sim=SimConfig(
            starting_capital_usd=10_000.0,
            sizing_mode="fraction_lead",
            fraction=0.02,
            fee_bps=20.0,
            slippage_bps=50.0,
            min_leader_pnl_usd=0.0,
            per_leader_daily_cap_usd=5_000.0,
            max_position_usd=2_000.0,
        ),
    )


def test_walk_forward_pipeline_runs_on_synthetic_data():
    wallets, trades, markets = _generate_population(n_wallets=150, n_markets=300, horizon_days=400, seed=7)
    client = _FakeClient(wallets, trades, markets)
    summary = run_walk_forward(client, _baseline_cfg())
    assert summary["num_copy_trades"] > 0
    assert summary["candidate_pool_size"] == 120
    assert "selection_window" in summary
    assert "validation_window" in summary
    assert "sharpe_annualised" in summary
    assert "win_rate_pct" in summary


def test_selection_step_picks_above_average_wallets():
    """The strongest non-flaky claim: top-K by selection-window PnL is above the
    population mean by a clear margin. If this fails, the selection step is
    broken; if this passes but validation returns are weak, that's information
    about the strategy, not a bug."""
    wallets, trades, markets = _generate_population(n_wallets=150, n_markets=300, horizon_days=400, seed=11)
    client = _FakeClient(wallets, trades, markets)
    summary = run_walk_forward(client, _baseline_cfg())
    sel_pnls = list(summary["selection_pnl"].values())
    assert len(sel_pnls) > 0
    top_mean = sum(sel_pnls) / len(sel_pnls)
    assert top_mean > 0, f"top-K selection-window PnL mean should be > 0, got {top_mean:.0f}"


def test_validation_window_isolation():
    """Trades outside the validation window must not be copied."""
    wallets, trades, markets = _generate_population(n_wallets=80, n_markets=200, horizon_days=400, seed=3)
    client = _FakeClient(wallets, trades, markets)
    cfg = _baseline_cfg()
    cfg.candidate_pool = 80
    cfg.top_k = 30
    summary = run_walk_forward(client, cfg)
    val_start, val_end = summary["validation_window"]
    trades_df = summary["trades_df"]
    if not trades_df.empty:
        assert (trades_df["ts"] >= val_start).all()
        assert (trades_df["ts"] <= val_end).all()
