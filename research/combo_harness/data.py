"""Data layer: a DataSource returns aligned NEAR and FAR futures price panels.

Returns two DataFrames (index = trading date, columns = commodity symbol):
  - near : front-contract back-adjusted continuous price (used for returns)
  - far  : second/deferred-contract back-adjusted continuous price (term structure)

From these we derive everything: returns (near, far), basis/carry, basis-
momentum and curve momentum.

Two implementations:
  - SyntheticSource : offline generator with realistic, *modest* injected
                      predictability so every leg has some signal. For pipeline
                      testing only.
  - TqsdkSource     : adapter for live/historical data from tqsdk (Shinnytech).
                      Requires `pip install tqsdk` and a (sim or live) account.
"""
from __future__ import annotations

import numpy as np
import pandas as pd


# ~18 liquid contracts, ex-precious-metals (matches the deep-dive universe).
DEFAULT_UNIVERSE = [
    "rb",  # rebar (SHFE)
    "hc",  # hot-rolled coil (SHFE)
    "i",   # iron ore (DCE)
    "j",   # coke (DCE)
    "jm",  # coking coal (DCE)
    "cu",  # copper (SHFE)
    "al",  # aluminium (SHFE)
    "zn",  # zinc (SHFE)
    "ru",  # rubber (SHFE)
    "m",   # soybean meal (DCE)
    "y",   # soybean oil (DCE)
    "p",   # palm oil (DCE)
    "a",   # soybean no.1 (DCE)
    "c",   # corn (DCE)
    "MA",  # methanol (CZCE)
    "TA",  # PTA (CZCE)
    "SA",  # soda ash (CZCE)
    "FG",  # glass (CZCE)
]


class SyntheticSource:
    """Offline panel generator with injected (modest) factor predictability.

    Injects:
      - momentum  : a persistent latent drift (AR1) per commodity,
      - carry     : basis that positively predicts next-day return,
      - curve/basis-momentum : persistent basis dynamics so near-minus-far
                    cumulative returns trend.
    Signal strength is deliberately small (target single-leg Sharpe ~0.5-1.0),
    so this is a believable pipeline test, not a fantasy.
    """

    def __init__(self, universe=None, start="2012-01-03", n_days=3200, seed=7):
        self.universe = list(universe or DEFAULT_UNIVERSE)
        self.start = start
        self.n_days = int(n_days)
        self.seed = int(seed)

    def load(self):
        rng = np.random.default_rng(self.seed)
        n = self.n_days
        cols = self.universe
        k = len(cols)
        dates = pd.bdate_range(self.start, periods=n)

        # --- latent momentum drift: AR(1), SMALL persistent expected return ---
        # Tuned so TS/XS-momentum standalone Sharpe lands ~1.0 (cf. literature
        # XS-mom Sharpe 1.11), not a fantasy. Stationary drift std ~0.00025/day.
        mom = np.zeros((n, k))
        phi_m, sig_m = 0.99, 0.000035
        for t in range(1, n):
            mom[t] = phi_m * mom[t - 1] + sig_m * rng.standard_normal(k)

        # --- latent standardized carry: AR(1) term-structure state ---
        carry = np.zeros((n, k))
        phi_c, sig_c = 0.97, 0.5
        for t in range(1, n):
            carry[t] = phi_c * carry[t - 1] + sig_c * rng.standard_normal(k)
        carry = (carry - carry.mean(0)) / (carry.std(0) + 1e-9)

        # --- near-contract daily return: drift + carry premium + noise ---
        # kappa tuned so the carry leg lands ~0.4-0.6 (cf. literature 0.43).
        kappa = 0.00035         # carry -> next-day return loading (carry premium)
        base_vol = 0.012        # ~19% annual idiosyncratic vol
        common = 0.004 * rng.standard_normal((n, 1))   # a market/average factor
        eps = base_vol * rng.standard_normal((n, k))
        near_ret = mom + kappa * carry + common + eps

        # --- basis (annualized) tied to latent carry; far return = near - dBasis
        basis = 0.06 * carry                     # +/- ~6% annualized carry
        dbasis = np.vstack([np.zeros((1, k)), np.diff(basis, axis=0)])
        far_ret = near_ret - dbasis              # spreading return drives curve legs

        near = 100.0 * np.exp(np.cumsum(near_ret, axis=0))
        far = 100.0 * np.exp(np.cumsum(far_ret, axis=0))

        near_df = pd.DataFrame(near, index=dates, columns=cols)
        far_df = pd.DataFrame(far, index=dates, columns=cols)
        return near_df, far_df


class TqsdkSource:
    """Adapter for real data via tqsdk (https://github.com/shinnytech/tqsdk-python).

    Usage (once you have a sim or live account):

        from tqsdk import TqApi, TqAuth
        src = TqsdkSource(symbols={"rb": "KQ.m@SHFE.rb", ...},
                          auth=("phone", "password"),
                          start="2015-01-01", end="2024-12-31")
        near, far = src.load()

    Implementation notes (kept as a guided stub on purpose — needs an account):
      - Use tqsdk's main continuous contracts (KQ.m@EXCHANGE.product) for `near`.
      - For `far`, request the next maturity or build the deferred continuous
        series; align on the trading calendar and forward-fill holidays.
      - Back-adjust on roll so returns are continuous.
    """

    def __init__(self, symbols, auth=None, start="2015-01-01", end=None,
                 far_symbols=None):
        self.symbols = dict(symbols)
        self.far_symbols = dict(far_symbols) if far_symbols else None
        self.auth = auth
        self.start = start
        self.end = end

    def load(self):
        try:
            from tqsdk import TqApi, TqAuth  # noqa: F401
            from tqsdk.tools import DataDownloader  # noqa: F401
        except Exception as exc:  # pragma: no cover - needs the lib + account
            raise RuntimeError(
                "tqsdk not available. `pip install tqsdk` and supply an account, "
                "or use SyntheticSource for offline development."
            ) from exc
        raise NotImplementedError(
            "Fill in DataDownloader calls for your symbols/date range, then "
            "back-adjust and return (near_df, far_df). The rest of the harness "
            "is data-source agnostic."
        )


def returns_from_prices(prices: pd.DataFrame) -> pd.DataFrame:
    """Daily simple returns from a (back-adjusted) price panel."""
    return prices.pct_change().fillna(0.0)
