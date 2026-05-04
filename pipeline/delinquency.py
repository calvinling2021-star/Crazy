"""Layer 3 — Delinquency / distress signals.

For each CIK, query EDGAR's submissions API and emit weighted signals:

    +30  NT-10K / NT-10Q in last 12 months
    +25  Nasdaq deficiency / bid-price 8-K
    +20  Going-concern in latest 10-K
    +15  Auditor change in last 12 months (8-K Item 4.01)
    +10  Strategic-alternatives 8-K language
    +5   Reverse-split announcement

Anything >= 40 lands in v_hot_prospects.

Run: `python -m pipeline.delinquency`
"""
from __future__ import annotations
import argparse
import logging
import re
import time
from datetime import date, datetime, timedelta

import requests

from . import USER_AGENT, db

log = logging.getLogger(__name__)

EDGAR_SUBMISSIONS = "https://data.sec.gov/submissions/CIK{cik}.json"
EDGAR_DOC = "https://www.sec.gov/Archives/edgar/data/{cik_int}/{accession_clean}/{primary_doc}"

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT, "Accept-Encoding": "gzip, deflate"})

WEIGHTS = {
    "NT-10K": 30, "NT-10-K": 30, "NT-10Q": 30, "NT-10-Q": 30,
    "deficiency": 25, "going_concern": 20, "auditor_change": 15,
    "strategic_alternatives": 10, "reverse_split": 5,
}

LOOKBACK = timedelta(days=365)

# 8-K Item codes we care about
ITEM_DEFICIENCY = "3.01"     # Notice of failure to satisfy listing standard
ITEM_AUDITOR    = "4.01"     # Auditor change

KEYWORDS = {
    "strategic_alternatives": re.compile(
        r"\b(strategic\s+alternatives|exploring\s+strategic|review\s+of\s+strategic)\b", re.I),
    "going_concern":          re.compile(r"\bgoing\s+concern\b", re.I),
    "reverse_split":          re.compile(r"\breverse\s+(stock|share)\s+split\b", re.I),
    "deficiency":             re.compile(
        r"\b(deficiency\s+notice|minimum\s+bid\s+price|listing\s+standard|delisting)\b", re.I),
}


def fetch_submissions(cik: str) -> dict | None:
    cik10 = cik.zfill(10)
    try:
        r = SESSION.get(EDGAR_SUBMISSIONS.format(cik=cik10), timeout=15)
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return r.json()
    except Exception as e:
        log.debug("submissions fetch failed for %s: %s", cik, e)
        return None


def recent_filings(submissions: dict, since: date) -> list[dict]:
    """Yield recent filings as dicts: form, accession, primary_doc, filing_date, items."""
    recent = submissions.get("filings", {}).get("recent", {}) or {}
    forms       = recent.get("form", [])
    accessions  = recent.get("accessionNumber", [])
    docs        = recent.get("primaryDocument", [])
    dates       = recent.get("filingDate", [])
    items_lists = recent.get("items", [])
    out = []
    for i, form in enumerate(forms):
        try:
            fdate = datetime.strptime(dates[i], "%Y-%m-%d").date()
        except (ValueError, IndexError):
            continue
        if fdate < since:
            continue
        out.append({
            "form": form,
            "accession": accessions[i] if i < len(accessions) else "",
            "primary_doc": docs[i] if i < len(docs) else "",
            "date": fdate,
            "items": items_lists[i] if i < len(items_lists) else "",
        })
    return out


def build_doc_url(cik: str, accession: str, primary_doc: str) -> str:
    return EDGAR_DOC.format(
        cik_int=int(cik), accession_clean=accession.replace("-", ""), primary_doc=primary_doc,
    )


def fetch_doc_text(url: str, max_bytes: int = 400_000) -> str:
    try:
        r = SESSION.get(url, timeout=20, stream=True)
        r.raise_for_status()
        chunks, total = [], 0
        for chunk in r.iter_content(chunk_size=16384, decode_unicode=False):
            if not chunk:
                break
            chunks.append(chunk)
            total += len(chunk)
            if total >= max_bytes:
                break
        raw = b"".join(chunks).decode("utf-8", errors="ignore")
        # cheap tag strip
        return re.sub(r"<[^>]+>", " ", raw)
    except Exception as e:
        log.debug("fetch_doc_text failed for %s: %s", url, e)
        return ""


def score_company(cik: str) -> int:
    """Pull recent EDGAR filings for cik, write signal rows. Returns # signals added."""
    subs = fetch_submissions(cik)
    if not subs:
        return 0
    cutoff = date.today() - LOOKBACK
    filings = recent_filings(subs, cutoff)
    added = 0
    with db.cursor() as cur:
        for f in filings:
            form, items = f["form"], f["items"] or ""
            url = build_doc_url(cik, f["accession"], f["primary_doc"]) if f["primary_doc"] else None

            # Direct form-name signals
            if form in WEIGHTS:
                db.add_signal(cur, cik, form, WEIGHTS[form], url, f["date"].isoformat())
                added += 1

            # 8-K item signals
            if form == "8-K":
                if ITEM_DEFICIENCY in items:
                    db.add_signal(cur, cik, "deficiency", WEIGHTS["deficiency"], url, f["date"].isoformat())
                    added += 1
                if ITEM_AUDITOR in items:
                    db.add_signal(cur, cik, "auditor_change", WEIGHTS["auditor_change"], url, f["date"].isoformat())
                    added += 1

            # Keyword scan on 10-K, 10-Q, 8-K bodies (one per form to limit fetches)
            if form in {"10-K", "10-Q", "8-K"} and url:
                text = fetch_doc_text(url)
                for sig_name, pattern in KEYWORDS.items():
                    if pattern.search(text):
                        db.add_signal(cur, cik, sig_name, WEIGHTS[sig_name], url, f["date"].isoformat())
                        added += 1
                time.sleep(0.12)   # SEC fair-use throttle

    return added


def score_universe(limit: int | None = None) -> None:
    with db.cursor() as cur:
        cur.execute("SELECT cik, ticker FROM companies ORDER BY market_cap ASC")
        rows = cur.fetchall()
    if limit:
        rows = rows[:limit]
    log.info("Scoring delinquency signals for %d companies…", len(rows))
    total_signals = 0
    for n, row in enumerate(rows, 1):
        added = score_company(row["cik"])
        total_signals += added
        if n % 25 == 0:
            log.info("  %d/%d companies scored, %d signals so far", n, len(rows), total_signals)
        time.sleep(0.12)
    log.info("Done. %d signals captured across %d companies.", total_signals, len(rows))


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--limit", type=int, default=None)
    p.add_argument("-v", "--verbose", action="store_true")
    args = p.parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    )
    score_universe(limit=args.limit)


if __name__ == "__main__":
    main()
