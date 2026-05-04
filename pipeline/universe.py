"""Layer 1 — Universe builder.

Pull every Nasdaq/NYSE-listed company from SEC EDGAR, then filter to those
with market cap < $25M using yfinance (free, no API key).

Run: `python -m pipeline.universe --max-cap 25000000`
"""
from __future__ import annotations
import argparse
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass

import requests
import yfinance as yf

from . import USER_AGENT, db

log = logging.getLogger(__name__)

EDGAR_TICKER_URL = "https://www.sec.gov/files/company_tickers.json"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT, "Accept-Encoding": "gzip, deflate"})


@dataclass
class Issuer:
    cik: str           # 10-digit zero-padded
    ticker: str
    name: str


def fetch_edgar_issuers() -> list[Issuer]:
    """SEC EDGAR maintains a free JSON of all SEC-registered tickers."""
    log.info("Fetching SEC EDGAR ticker list…")
    r = SESSION.get(EDGAR_TICKER_URL, timeout=30)
    r.raise_for_status()
    data = r.json()
    issuers = []
    for v in data.values():
        cik = str(v["cik_str"]).zfill(10)
        issuers.append(Issuer(cik=cik, ticker=v["ticker"].upper(), name=v["title"]))
    log.info("EDGAR returned %d issuers", len(issuers))
    return issuers


def market_cap_for(ticker: str) -> tuple[float | None, float | None, str | None, str | None]:
    """Return (market_cap, last_price, exchange, sector) via yfinance.

    yfinance pulls from public Yahoo Finance — no API key, but rate-limited.
    """
    try:
        info = yf.Ticker(ticker).info
        if not info or info.get("quoteType") not in {"EQUITY", "ETF"}:
            return None, None, None, None
        return (
            info.get("marketCap"),
            info.get("currentPrice") or info.get("regularMarketPrice"),
            info.get("exchange"),
            info.get("sector"),
        )
    except Exception as e:
        log.debug("yfinance lookup failed for %s: %s", ticker, e)
        return None, None, None, None


def build_universe(max_cap: float = 25_000_000, limit: int | None = None,
                   workers: int = 8) -> int:
    """Fetch all issuers, query market cap, write rows for those under max_cap.

    Returns the count of qualifying companies inserted.
    """
    issuers = fetch_edgar_issuers()
    if limit:
        issuers = issuers[:limit]

    qualified = 0
    with db.cursor() as cur:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(market_cap_for, i.ticker): i for i in issuers}
            for n, fut in enumerate(as_completed(futures), 1):
                issuer = futures[fut]
                mcap, price, exchange, sector = fut.result()
                if mcap and mcap > 0 and mcap < max_cap:
                    db.upsert_company(
                        cur, issuer.cik, issuer.ticker, issuer.name,
                        exchange=exchange, sector=sector,
                        market_cap=mcap, last_price=price,
                    )
                    qualified += 1
                if n % 100 == 0:
                    log.info("Processed %d/%d (qualified=%d)", n, len(issuers), qualified)
                # Polite throttle — yfinance frowns on aggressive parallelism
                if n % workers == 0:
                    time.sleep(0.2)
    log.info("Done. %d companies under $%.0fM stored.", qualified, max_cap / 1e6)
    return qualified


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--max-cap", type=float, default=25_000_000,
                   help="Maximum market cap in USD (default 25M)")
    p.add_argument("--limit", type=int, default=None,
                   help="Limit number of issuers processed (for testing)")
    p.add_argument("--workers", type=int, default=8)
    p.add_argument("-v", "--verbose", action="store_true")
    args = p.parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    )
    n = build_universe(max_cap=args.max_cap, limit=args.limit, workers=args.workers)
    print(f"\n  Qualified companies stored: {n}")


if __name__ == "__main__":
    main()
