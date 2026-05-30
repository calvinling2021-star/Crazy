"""CLI: run the commodity-combo backtest end-to-end and print a report.

    python -m research.combo_harness.run_backtest                 # synthetic data
    python -m research.combo_harness.run_backtest --source tqsdk  # real (needs account)

The synthetic path runs anywhere (no account, no network). It exists to prove
the pipeline and exercise the validation gates -- the Sharpe it prints is from
*generated* data and means nothing on its own.
"""
from __future__ import annotations

import argparse

from .data import SyntheticSource
from . import backtest, validation


def _fmt(m):
    return (f"ann_return={m['ann_return']*100:6.2f}%  vol={m['ann_vol']*100:5.2f}%  "
            f"Sharpe={m['sharpe']:.2f}  maxDD={m['max_drawdown']*100:6.2f}%  "
            f"turnover={m['ann_turnover_x']:.1f}x/yr  years={m['years']:.1f}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", choices=["synthetic", "tqsdk"], default="synthetic")
    ap.add_argument("--n-trials", type=int, default=56,
                    help="effective independent configs searched (deflation N_eff)")
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    if args.source == "synthetic":
        md = SyntheticSource(seed=args.seed).load()
    else:
        raise SystemExit(
            "For real data: in code, build TqsdkSource(auth=(phone,pwd)).load() "
            "or AkShareSource(contract_lists=...).load(), then pass the MarketData "
            "to backtest.run(). See data.py and README.")

    near = md.near
    print(f"\n=== Commodity multi-factor combo — backtest ({args.source} data) ===")
    print(f"universe: {near.shape[1]} contracts   sample: "
          f"{near.index[0].date()} -> {near.index[-1].date()}   rows: {near.shape[0]}")

    base_legs = ["ts_mom", "xs_mom", "carry", "basis_mom", "curve_mom"]
    run_kw = dict(target_leg_vol=0.10, target_port_vol=0.10, vol_window=60,
                  crash_cap=2.0, rebalance_days=5)

    # --- full combo ---
    res = backtest.run(md, legs_subset=base_legs, **run_kw)
    m = res["metrics"]
    print("\n[FULL COMBO]")
    print("  " + _fmt(m))
    print(f"  gross Sharpe (pre-cost): {m['gross_sharpe']:.2f}")

    # --- each leg standalone ---
    print("\n[STANDALONE LEGS]")
    for leg in base_legs:
        lm = backtest.run(md, legs_subset=[leg], **run_kw)["metrics"]
        print(f"  {leg:10s} Sharpe={lm['sharpe']:5.2f}  ann={lm['ann_return']*100:6.2f}%  "
              f"turnover={lm['ann_turnover_x']:.1f}x")

    # --- marginal IR (does each leg earn its place?) ---
    print("\n[MARGINAL CONTRIBUTION]  (combo Sharpe minus combo-without-leg)")
    mir = validation.marginal_ir(md, base_legs, **run_kw)
    for leg, d in sorted(mir.items(), key=lambda x: -x[1]["marginal"]):
        flag = "keep" if d["marginal"] > 0 else "DROP?"
        print(f"  {leg:10s} marginal={d['marginal']:+.3f}  "
              f"(combo {d['combo_sharpe']:.2f} -> without {d['without_leg']:.2f})  [{flag}]")

    # --- deflated-Sharpe gate: simplified N_eff sensitivity + FULL skew-corrected DSR
    import math
    raw_t = m["sharpe"] * math.sqrt(m["years"])
    print(f"\n[DEFLATED-SHARPE GATE]  combo Sharpe={m['sharpe']:.2f} over {m['years']:.1f}y")
    print(f"  raw t-stat (no deflation) = {raw_t:.2f}  (looks great -- but ignores search)")
    print("  simplified floor (sqrt(2 ln N)) by configs searched (N_eff):")
    for ne in sorted({10, 30, args.n_trials, 100}):
        passes, t_defl, floor = validation.deflated_gate(m["sharpe"], m["years"], ne)
        tag = "  <- reported" if ne == args.n_trials else ""
        print(f"    N_eff={ne:>4}: floor={floor:.3f}  deflated t={t_defl:5.2f}  "
              f"-> {'PASS' if passes else 'FAIL'}{tag}")
    dsr = validation.deflated_sharpe(res["net"], args.n_trials)
    if not dsr.get("insufficient"):
        print(f"  FULL DSR (skew/kurtosis-corrected, N_eff={args.n_trials}):")
        print(f"    skew={dsr['skew']:+.2f} excess_kurt={dsr['excess_kurt']:+.2f}  "
              f"raw t={dsr['t_raw']:.2f}  emax floor={dsr['emax_floor']:.2f}  "
              f"deflated t={dsr['t_deflated']:.2f}")
        print(f"    DSR prob = {dsr['dsr_prob']:.3f}  -> "
              f"{'PASS (>0.95)' if dsr['passes'] else 'FAIL (<=0.95)'}")
    print("  (More configs => higher bar. Be honest about N_eff.)")

    # --- capacity test ---
    print("\n[CAPACITY TEST]  (impact multiplier on costs)")
    for row in validation.capacity_test(md, legs_subset=base_legs, **run_kw):
        print(f"  impact x{row['capacity_mult']:.0f}: Sharpe={row['sharpe']:.2f}  "
              f"ann={row['ann_return']*100:6.2f}%  maxDD={row['max_drawdown']*100:6.2f}%")

    print("\nNote: synthetic data — numbers prove the pipeline, not the strategy.\n")


if __name__ == "__main__":
    main()
