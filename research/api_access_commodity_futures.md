# How to Get API Access for (Chinese) Commodity Futures Trading

**Prepared:** 2026‑05‑30
**Context:** execution/data plumbing for Pick 1 (the commodity multi-factor combo) in `deepdive_commodity_combo_and_capacity.md`.

> **Not investment, legal, or tax advice.** API access to Chinese futures is gated by *who you are* (domestic vs. foreign) far more than by technology. Read §4 before assuming you can trade the full universe.

---

## 0. One-minute decision tree

```
Are you trading as a MAINLAND CHINA resident / entity?
├─ YES → open a domestic futures account at a Chinese broker → you get a free CTP login
│         → use tqsdk or vn.py (Python) for data + execution → FULL ~60-contract universe. Easiest path.
└─ NO (foreign individual/fund):
    ├─ Want the FULL cross-section the combo needs (~15-20 contracts)?
    │     → requires a Chinese entity OR the QFI (institutional) scheme. High bar.
    ├─ OK with the ~10 "internationalised" contracts only?
    │     → open via an Overseas Intermediary broker (e.g. Orient Futures SG) → still CTP-compatible.
    └─ Just want a liquid USD proxy?
          → SGX iron ore / global commodity futures via Interactive Brokers etc.
```

**The blunt reality for your strategy:** the multi-factor combo needs a broad cross-section. **Foreigners can only trade ~10 internationalised contracts directly** — not enough for the full combo. The full universe needs a **domestic account** (Chinese ID/entity) or the **QFI institutional scheme**. This is the binding constraint, not the code.

---

## 1. You need two APIs, not one

| Layer | What it does | Standard in China |
|---|---|---|
| **Market-data API** | historical + real-time prices for research/backtest/signals | tqsdk, AkShare, Tushare, Wind (see §3) |
| **Execution (trading) API** | place/cancel orders, positions, fills | **CTP** is the de-facto standard (see §2) |

You can (and should) develop signals on data APIs long before you have execution wired up.

---

## 2. Execution: CTP — the de-facto standard

**CTP (Comprehensive Transaction Platform)**, built by SFIT (上期技术, a SHFE subsidiary), is the dominant trading gateway for Chinese futures. Key facts:

- **It's free**, but you don't get it standalone — you get a **CTP login (broker server address + investor ID) when you open a futures account at a Chinese broker.** The broker runs a CTP "front."
- **Covers all domestic futures + options** across SHFE, DCE, CZCE, INE, GFEX, and CFFEX.
- C++ native API with mature Python/other wrappers.

### Simulation before you risk money
- **SimNow** — the official free CTP simulation environment (run by SFIT). Same CTP API, fake money. The standard place to develop/test. (Note: SimNow has had reliability/registration hiccups over the years.)
- **openctp** — open-source project providing a **SimNow replacement** (TTS-based sim) plus **CTP-compatible adapters** for many other broker backends (Zhongtai XTP, Huaxin TORA, IB TWS, etc.). Lets one CTP program target many venues by swapping the DLL. Has Python interfaces. → [github.com/openctp/openctp](https://github.com/openctp/openctp) · [openctp.cn](http://www.openctp.cn/)

---

## 3. Python SDKs / frameworks (pick one to start)

| Tool | Best for | Data | Live trading | Notes |
|---|---|---|---|---|
| **tqsdk** (TianQin / Shinnytech) | **Quant Python dev — recommended start** | **Free** tick + minute, history from listing date for all contracts | Yes, via CTP direct | Clean Python, sim + live multi-account, backtest built in. → [pypi.org/project/tqsdk](https://pypi.org/project/tqsdk/) · [github](https://github.com/shinnytech/tqsdk-python) |
| **vn.py (VeighNa)** | Full event-driven trading platform | via gateways | Yes — CTP + many gateways (incl. international) | Heavier; great for production multi-strategy. |
| **openctp** | Multi-broker / SimNow replacement | — | Yes, CTP-compatible across venues | Use for the sim env + broker-abstraction layer. |

**Recommended quant stack:** `tqsdk` for research/backtest/signals → **SimNow or openctp-TTS** for paper trading → **CTP via your broker** for live. Wrap it all in **vn.py** if/when you go multi-strategy production.

---

## 4. Market-data sources (research/backtest)

| Source | Cost | Coverage / granularity | Notes |
|---|---|---|---|
| **tqsdk** | **Free** | Futures **tick + minute**, full history | Best free futures data; same lib you'll trade on. |
| **AkShare** | **Free / open-source** | Very broad (futures, stocks, options, macro) | ~150k monthly devs; great for breadth & prototyping. → [github](https://github.com/akfamily/awesome-data) |
| **Tushare** | Freemium (points) | Strong A-share; futures available | Paid points for deeper/higher-quality data. → [github](https://github.com/waditu/tushare) |
| **RiceQuant (米筐)** | Paid tiers | Down to **1ms** OHLCV | Institutional-grade; integrated backtest. |
| **JoinQuant (聚宽)** | Paid tiers | **1-min** OHLCV | Hosted research/backtest. |
| **Wind / 同花顺 iFinD** | Expensive (institutional) | Everything | Standard at Chinese funds. |

For building the combo: **tqsdk (prices/rolls) + AkShare (basis, warehouse stocks, fundamentals)** is a strong, low-cost research starting point.

---

## 5. Foreign access — the eligibility detail that decides everything

Two legal routes for non-mainland investors:

1. **Overseas Intermediary (OI) route** — open an account with a **registered overseas broker** that has connectivity to the Chinese exchanges (e.g., **Orient Futures Singapore**). Lets you trade only the **"internationalised" contracts**:
   - INE crude oil, low-sulphur fuel oil, TSR20 rubber, copper (BC); DCE iron ore, palm olein, soybeans (No.1/2); CZCE PTA — roughly **~10 contracts** (list expands periodically; verify current).
   - These are denominated in RMB but open to foreign capital.

2. **QFI scheme** (QFII + RQFII, merged) — **institutional** regime. Since **Nov 1, 2021**, QFIs can trade **commodity futures, commodity options, and stock-index options**, and the list keeps widening. High setup bar (custodian, regulatory approval) — realistic only for funds.

**Consequence for the combo (re-stating, because it matters):** the OI route's ~10 contracts is **too narrow** for the diversified cross-sectional combo. To run the real strategy as a foreigner you need **QFI** (institutional) or a **mainland entity/account**. Otherwise, scope the strategy down to the internationalised subset, or use **SGX USD iron ore** and other global futures (via Interactive Brokers etc.) as liquid proxies — accepting that you're no longer trading the exact Chinese-domestic premium the research documents.

---

## 6. Concrete next steps (dev → sim → live)

1. **This week (no account needed):** `pip install tqsdk akshare`; pull historical tick/minute for ~15 liquid contracts; build the basis/momentum/curve signals from the deep-dive spec.
2. **Paper trade:** register **SimNow** (or spin up **openctp-TTS**); run the strategy on the CTP sim API end-to-end (orders, fills, rolls).
3. **Confirm eligibility (§0/§5):** domestic entity → pick a Chinese broker with a good CTP front; foreign fund → start QFI onboarding; foreign individual → OI-route subset or global proxies.
4. **Go live:** swap the sim CTP login for your broker's live CTP front (tqsdk/vn.py change is just credentials + server address).
5. **Capacity test** (from the deep dive): re-run with realistic impact at 1×/3×/5× target AUM before scaling.

---

## 6b. Your path — mainland resident/entity (full access) ✅

You're in the best case: a domestic futures account gives you a **free CTP login and the full ~60-contract universe** — the entire combo cross-section is tradable, no QFI/OI restriction, no contract scoping needed.

**Concrete checklist:**
1. **Open a domestic futures account** at a mainstream Chinese broker with a solid CTP front and low commissions (e.g. 中信期货 / CITIC, 国泰君安期货, 永安期货, 银河期货, 华泰期货). Ask specifically for: **CTP API access enabled**, commission close to exchange-minimum + small markup, and a **fast/colocated front** if you'll scale.
   - Requires China ID/entity + bank account; for the *combo's* speculative contracts, complete the **适当性 (investor-suitability) test** and any per-exchange trading-permission unlocks (e.g. iron ore, certain CZCE/SHFE products need a one-time qualification).
2. **Get credentials:** broker gives you CTP broker-ID, front address(es), investor-ID, password.
3. **Develop now (no live account needed yet):** `pip install tqsdk akshare`, build signals on free tick/minute history.
4. **Paper trade:** tqsdk sim account or SimNow → full strategy loop incl. rolls.
5. **Go live:** drop your broker's live CTP login into tqsdk/vn.py (just credentials + server address). Start with 1 contract, tiny size, to validate fills/slippage vs. backtest.
6. **Capacity test** at 1×/3×/5× target AUM before scaling (per the deep dive).

**Two China-specific gotchas to plan for:**
- **Per-exchange trading permissions / suitability:** some combo contracts (iron ore, crude, stock-index-adjacent, certain options) require one-time qualification before CTP will accept orders on them. Clear these up front so backtested contracts are actually executable.
- **Position limits & intraday-vs-overnight margins:** speculative position caps and night-session margin changes can bind the combo's sizing; model them in the capacity test.

**Recommended stack for you:** `tqsdk` (data + research + sim) → live via your broker's **CTP** front → graduate to **vn.py** if you run the combo + CH-4 long-short + options VRP as a multi-strategy book.

---

## 7. Sources
- openctp — [GitHub](https://github.com/openctp/openctp) · [openctp.cn](http://www.openctp.cn/)
- tqsdk — [PyPI](https://pypi.org/project/tqsdk/) · [GitHub](https://github.com/shinnytech/tqsdk-python)
- AkShare data list — [akfamily/awesome-data](https://github.com/akfamily/awesome-data) · Tushare — [waditu/tushare](https://github.com/waditu/tushare)
- Foreign access (OI / QFI, internationalised contracts) — [FIA: China expands international access](https://www.fia.org/marketvoice/articles/china-further-expands-international-access-its-commodity-markets) · [Orient Futures SG — China market access](https://www.orientfutures.com.sg/china-market-access/china-futures-international-access/) · [HFW: Revised QFII scheme + commodity futures](https://www.hfw.com/insights/revised-qfii-scheme-broadens-market-access-to-prc-exchange-traded-commodity-futures-and-options-contracts-feb-2023/)
- SGX iron ore alternative — [Orient Futures: DCE iron ore](https://www.orientfutures.com.sg/post-detail/Dalian-Commodity-Exchange-Iron-Ore-Futures)
