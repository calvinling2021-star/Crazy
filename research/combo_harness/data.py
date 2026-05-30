"""Data layer: sources return a `MarketData` (near, far, basis) bundle.

  near  : back-adjusted continuous FRONT price  (return-correct, no roll gaps)
  far   : back-adjusted continuous SECOND price (return-correct)
  basis : RAW log(front/second) on the contemporaneously chosen contracts
          (true term-structure slope; NOT log(near/far) of the back-adjusted
          prices, which would be wrong once the two legs roll at different times)

Sources
-------
  SyntheticSource : offline generator (injected modest predictability). Pipeline
                    testing only — its Sharpe is circular, not evidence of edge.
  TqsdkSource     : free with a (sim or live) tqsdk account; downloads individual
                    maturities and builds near/far/basis via rolls.build_continuous.
  AkShareSource   : free, NO account (scrapes Sina/exchange); same roll builder.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

import numpy as np
import pandas as pd

from . import rolls


@dataclass
class MarketData:
    near: pd.DataFrame      # date x product, back-adjusted continuous front
    far: pd.DataFrame       # date x product, back-adjusted continuous second
    basis: pd.DataFrame     # date x product, raw log(front/second)
    reports: dict = None    # per-product roll diagnostics (None for synthetic)


# ~18 liquid contracts, ex-precious-metals (matches the deep-dive universe).
# Mapping: product -> tqsdk product code "EXCHANGE.symbol".
TQSDK_PRODUCTS = {
    "rb": "SHFE.rb", "hc": "SHFE.hc", "cu": "SHFE.cu", "al": "SHFE.al",
    "zn": "SHFE.zn", "ru": "SHFE.ru",
    "i": "DCE.i", "j": "DCE.j", "jm": "DCE.jm", "m": "DCE.m", "y": "DCE.y",
    "p": "DCE.p", "a": "DCE.a", "c": "DCE.c",
    "MA": "CZCE.MA", "TA": "CZCE.TA", "SA": "CZCE.SA", "FG": "CZCE.FG",
}
DEFAULT_UNIVERSE = list(TQSDK_PRODUCTS)


def returns_from_prices(prices: pd.DataFrame) -> pd.DataFrame:
    """Daily simple returns from a (back-adjusted) price panel."""
    return prices.pct_change().fillna(0.0)


# --------------------------------------------------------------------------- #
# Synthetic (offline)                                                         #
# --------------------------------------------------------------------------- #
class SyntheticSource:
    """Offline panel generator with injected (modest) factor predictability.

    NB: signal is injected, so any positive Sharpe is circular. Use only to
    exercise the pipeline, never as evidence of edge.
    """

    def __init__(self, universe=None, start="2012-01-03", n_days=3200, seed=7):
        self.universe = list(universe or DEFAULT_UNIVERSE)
        self.start, self.n_days, self.seed = start, int(n_days), int(seed)

    def load(self) -> MarketData:
        rng = np.random.default_rng(self.seed)
        n, cols = self.n_days, self.universe
        k = len(cols)
        dates = pd.bdate_range(self.start, periods=n)

        mom = np.zeros((n, k))
        phi_m, sig_m = 0.99, 0.000035
        for t in range(1, n):
            mom[t] = phi_m * mom[t - 1] + sig_m * rng.standard_normal(k)

        carry = np.zeros((n, k))
        phi_c, sig_c = 0.97, 0.5
        for t in range(1, n):
            carry[t] = phi_c * carry[t - 1] + sig_c * rng.standard_normal(k)
        carry = (carry - carry.mean(0)) / (carry.std(0) + 1e-9)

        kappa, base_vol = 0.00035, 0.012
        common = 0.004 * rng.standard_normal((n, 1))
        eps = base_vol * rng.standard_normal((n, k))
        near_ret = mom + kappa * carry + common + eps

        basis = 0.06 * carry
        dbasis = np.vstack([np.zeros((1, k)), np.diff(basis, axis=0)])
        far_ret = near_ret - dbasis

        near = pd.DataFrame(100.0 * np.exp(np.cumsum(near_ret, 0)), index=dates, columns=cols)
        far = pd.DataFrame(100.0 * np.exp(np.cumsum(far_ret, 0)), index=dates, columns=cols)
        basis_df = pd.DataFrame(basis, index=dates, columns=cols)   # raw injected basis
        return MarketData(near=near, far=far, basis=basis_df, reports=None)


# --------------------------------------------------------------------------- #
# Real sources: download individual maturities -> rolls.build_continuous       #
# --------------------------------------------------------------------------- #
def _frames_to_marketdata(contracts: dict, oi_min=1.0, verbose=True) -> MarketData:
    near, far, basis, reports = rolls.build_continuous(contracts, oi_min=oi_min)
    if verbose:
        for w in rolls.verify(reports):
            print("  [roll-warn]", w)
    return MarketData(near=near, far=far, basis=basis, reports=reports)


class TqsdkSource:
    """Free with a tqsdk account. Downloads daily individual maturities and
    builds the continuous near/far/basis via the verified roll engine.

    products : {product -> "EXCHANGE.symbol"} (defaults to TQSDK_PRODUCTS)
    auth     : (phone, password) for TqAuth
    """

    def __init__(self, products=None, auth=None, start="2010-01-01",
                 end=None, oi_min=1.0):
        self.products = dict(products or TQSDK_PRODUCTS)
        self.auth = auth
        self.start = start
        self.end = end or date.today().isoformat()
        self.oi_min = oi_min

    def load(self) -> MarketData:
        try:
            from tqsdk import TqApi, TqAuth
            from tqsdk.tools import DataDownloader
        except Exception as exc:  # pragma: no cover - needs lib + account
            raise RuntimeError(
                "tqsdk not installed/authed. `pip install tqsdk` + a (free) sim "
                "account, or use AkShareSource (no account) / SyntheticSource."
            ) from exc

        import tempfile, os, glob
        api = TqApi(auth=TqAuth(*self.auth))
        contracts = {}
        try:
            for product, code in self.products.items():
                # list all maturities tqsdk knows for this product
                exch, sym = code.split(".")
                quotes = api.query_quotes(ins_class="FUTURE", exchange_id=exch,
                                          product_id=sym, expired=True)
                quotes += api.query_quotes(ins_class="FUTURE", exchange_id=exch,
                                           product_id=sym, expired=False)
                frames = {}
                with tempfile.TemporaryDirectory() as td:
                    tasks = {}
                    for ins in sorted(set(quotes)):
                        fn = os.path.join(td, ins.replace(".", "_") + ".csv")
                        tasks[ins] = DataDownloader(
                            api, symbol_list=ins, dur_sec=86400,
                            start_dt=_d(self.start), end_dt=_d(self.end),
                            csv_file_name=fn)
                    while not all(t.is_finished() for t in tasks.values()):
                        api.wait_update()
                    for ins, fn in [(i, os.path.join(td, i.replace(".", "_") + ".csv"))
                                    for i in tasks]:
                        if not os.path.exists(fn):
                            continue
                        df = pd.read_csv(fn, parse_dates=["datetime"]).set_index("datetime")
                        col = lambda base: next((c for c in df.columns if c.endswith(base)), None)
                        frame = pd.DataFrame({
                            "settle": df[col("close")],
                            "oi": df[col("open_oi")] if col("open_oi") else df.get(col("close")),
                            "volume": df[col("volume")],
                        })
                        # contract code = the maturity part, e.g. cu2405
                        frames[ins.split(".")[-1]] = frame
                if len(frames) >= 2:
                    contracts[product] = frames
        finally:
            api.close()
        return _frames_to_marketdata(contracts, oi_min=self.oi_min)


class AkShareSource:
    """Free, NO account. Pulls per-contract daily (settle + OI) from Sina via
    AkShare, then builds near/far/basis with the same roll engine.

    contract_lists : {product -> [contract_code, ...]}  e.g.
        {"rb": ["RB2401","RB2405","RB2410", ...], ...}
    You supply the maturity codes (AkShare's `futures_zh_daily_sina` is per
    contract). Helper `list_contracts()` sketches how to enumerate them.
    """

    def __init__(self, contract_lists, oi_min=1.0):
        self.contract_lists = dict(contract_lists)
        self.oi_min = oi_min

    def load(self) -> MarketData:
        try:
            import akshare as ak
        except Exception as exc:  # pragma: no cover - needs lib + network
            raise RuntimeError("pip install akshare (no account needed).") from exc
        contracts = {}
        for product, codes in self.contract_lists.items():
            frames = {}
            for code in codes:
                try:
                    df = ak.futures_zh_daily_sina(symbol=code)
                except Exception:
                    continue
                df = df.rename(columns={"hold": "oi"}).copy()
                df["date"] = pd.to_datetime(df["date"])
                frames[code] = df.set_index("date")[["settle", "oi", "volume"]]
            if len(frames) >= 2:
                contracts[product] = frames
        return _frames_to_marketdata(contracts, oi_min=self.oi_min)


def _d(s: str) -> date:
    y, m, d = map(int, s.split("-"))
    return date(y, m, d)
