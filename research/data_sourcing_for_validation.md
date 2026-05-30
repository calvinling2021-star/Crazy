# Where to Get Data to Validate the Commodity Combo

**Prepared:** 2026‑05‑30
**For:** the kill-test in `combo_harness/` — running the real walk-forward through the deflated-Sharpe / marginal-IR / capacity gates.

> The harness is data-source agnostic. This doc says exactly where to get data,
> what it must contain, and how to turn raw contracts into the `near`/`far`
> panels the harness expects. Free sources are sufficient for validation (you're
> not redistributing data).

---

## 1. What the harness actually needs (the spec)

| Requirement | Why |
|---|---|
| **Per-contract daily OHLC for every maturity** (not just a pre-made continuous series) | To build a *verified* back-adjusted roll and the near/far term structure yourself. A black-box continuous series can leak look-ahead. |
| **Settlement price + open interest (OI) + volume per contract/day** | OI/volume drive the roll rule; settlement is the back-adjustment reference. |
| **~15–18 liquid commodities** (rebar, hot-rolled coil, iron ore, coke/coking coal, copper, aluminium, zinc, rubber, soybean meal/oil, palm, corn, methanol, PTA, soda ash, glass) | The combo's edge is cross-sectional diversification. |
| **2010 → 2024+**, incl. **expired/delisted contracts** | Regime coverage (2015–16, 2021–22 stress) and no survivorship bias. |
| Trading calendar / holidays | Alignment across exchanges. |

From individual-contract data you derive: `near`, `far`, `basis = log(near/far)`, and back-adjusted continuous returns.

---

## 2. Recommended FREE stack (use this for the kill-test)

### Primary — tqsdk `DataDownloader` (Shinnytech)
Free with registration; the **same library you'll trade on**, so dev = prod. Pulls individual maturities, main-continuous (`KQ.m@...`), and index-continuous (`KQ.i@...`) at daily/minute/tick, history from listing date.

```python
from datetime import date
from tqsdk import TqApi, TqAuth
from tqsdk.tools import DataDownloader

api = TqApi(auth=TqAuth("phone", "password"))
tasks = {}
# individual maturities (build your own near/far + rolls):
tasks["cu2405"] = DataDownloader(api, symbol_list="SHFE.cu2405",
    dur_sec=86400, start_dt=date(2010,1,1), end_dt=date(2024,12,31),
    csv_file_name="cu2405_d.csv")
# main-continuous (quick sanity baseline for `near`):
tasks["cu_main"] = DataDownloader(api, symbol_list="KQ.m@SHFE.cu",
    dur_sec=86400, start_dt=date(2010,1,1), end_dt=date(2024,12,31),
    csv_file_name="cu_main_d.csv")
while not all(t.is_finished() for t in tasks.values()):
    api.wait_update()
api.close()
```
Docs: [tqsdk DataDownloader](https://doc.shinnytech.com/tqsdk/latest/reference/tqsdk.tools.download.html)

### Cross-check + fundamentals — AkShare (free, open-source)
Per-contract daily **with settlement + open interest**, plus warehouse-receipt/basis helpers — use to verify tqsdk and to compute OI-crossover roll dates.
```python
import akshare as ak
df = ak.futures_zh_daily_sina(symbol="V2105")   # date,open,high,low,volume,hold(OI),settle
```
Docs: [AKShare futures](https://akshare.akfamily.xyz/data/futures/futures.html)

### Ground truth — exchange settlement files
SHFE / DCE / CZCE / INE publish authoritative daily settlement; use them to validate your back-adjustment against a known reference.

---

## 3. PAID options (for scale / convenience — not needed for the kill-test)

| Source | What you get | Notes |
|---|---|---|
| **RiceQuant (米筐)** | Point-in-time, dominant-contract + continuous, 1ms/daily, integrated backtest | Cleanest PIT; paid tiers, trial available. |
| **JoinQuant (聚宽)** | 1-min + daily, dominant-contract, hosted research | Free trial; paid tiers. |
| **Tushare** | `fut_daily` (per-contract), **`fut_mapping`** (main-contract roll dates), `fut_basic` | Freemium *points*; `fut_mapping` is a handy roll reference. → [github](https://github.com/waditu/tushare) |
| **Wind / 同花顺 iFinD / 东方财富 Choice** | Most complete: continuous, basis, warehouse stocks | Institutional, expensive. |
| **Nasdaq Data Link "Chinese Futures Data" (DY8)** | Third-party packaged history | Paid; convenient outside China. |

---

## 4. Building near/far + rolls (do NOT skip — the #1 risk)

The panel's top operational risk was a bad roll fabricating or hiding alpha. Build it explicitly:

1. Pull **all individual maturities** per commodity (tqsdk `symbol_list`).
2. Each day: **`near` = nearest expiry with adequate volume/OI**, **`far` = next**.
3. **Roll** when the next contract's OI/volume overtakes the front (verify with AkShare `hold`); avoid delivery-month windows (retail can't hold into delivery).
4. **Back-adjust** on each roll (ratio or difference) so the continuous return series has no roll gaps; cross-check against exchange settlement.
5. `basis = log(near/far)` → carry / basis-momentum / curve legs.
6. **Roll-sanity asserts**: no single-day jump > X%, continuity at roll, monotone calendar, OI sane. Fail loudly.

---

## 5. Point-in-time & survivorship checklist
- **Include expired/delisted contracts** — individual-maturity datasets do by default; never filter to "currently listed."
- Use **settlement** (not last-trade) prices for back-adjustment consistency.
- Liquidity-screen *as of each date* (don't use today's liquidity to pick yesterday's universe).
- Keep raw individual-contract files; derive continuous series in code so the roll is auditable and reproducible.

---

## 6. Minimal recipe to start today
1. Register tqsdk (free), `pip install tqsdk akshare`.
2. Download daily individual maturities for the ~15-contract universe, 2010–2024, via `DataDownloader`.
3. Build the roll + near/far panels with the §4 asserts.
4. Feed into `combo_harness` `TqsdkSource.load()` → run the existing gates with an honest `N_eff`.
5. Cross-check a couple of contracts against AkShare + exchange settlement before trusting anything.

**Sources:** [tqsdk DataDownloader](https://doc.shinnytech.com/tqsdk/latest/reference/tqsdk.tools.download.html) · [AKShare futures](https://akshare.akfamily.xyz/data/futures/futures.html) · [Tushare](https://github.com/waditu/tushare) · [awesome-data (source comparison)](https://github.com/akfamily/awesome-data)
