"""Layer 2 — Officer extraction.

For each CIK, locate the most recent DEF 14A (proxy) — fall back to 10-K Item 10
or 8-K Item 5.02 — and extract the current CEO. Officers' tables in proxies follow
predictable patterns: a person's name is followed by a title cell containing
"Chief Executive Officer", "President and Chief Executive Officer", etc.

Run: `python -m pipeline.officers`
"""
from __future__ import annotations
import argparse
import logging
import re
import time
from datetime import datetime

import requests
from bs4 import BeautifulSoup

from . import USER_AGENT, db

log = logging.getLogger(__name__)

EDGAR_SUBMISSIONS = "https://data.sec.gov/submissions/CIK{cik}.json"

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT, "Accept-Encoding": "gzip, deflate"})

CEO_TITLE = re.compile(
    r"\b(Chief\s+Executive\s+Officer|President\s+and\s+Chief\s+Executive\s+Officer|CEO)\b",
    re.I,
)
NAME_PATTERN = re.compile(
    r"^\s*((?:Dr\.|Mr\.|Ms\.|Mrs\.)?\s*[A-Z][a-zA-Z\.\-']+(?:\s+[A-Z][a-zA-Z\.\-']+){1,3})(?:,\s*(Ph\.?D\.?|M\.?D\.?|J\.?D\.?))?\s*$"
)
PREFERRED_FORMS = ["DEF 14A", "DEFA14A", "10-K", "8-K"]


def fetch_submissions(cik: str) -> dict | None:
    cik10 = cik.zfill(10)
    try:
        r = SESSION.get(EDGAR_SUBMISSIONS.format(cik=cik10), timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        log.debug("submissions failed for %s: %s", cik, e)
        return None


def best_officer_filing(submissions: dict) -> tuple[str, str, str, str] | None:
    """Pick the most useful filing to extract the CEO from.

    Returns (form, accession, primary_doc, filing_date).
    """
    recent = submissions.get("filings", {}).get("recent", {}) or {}
    forms       = recent.get("form", [])
    accessions  = recent.get("accessionNumber", [])
    docs        = recent.get("primaryDocument", [])
    dates       = recent.get("filingDate", [])

    # Build (form, accession, doc, date) tuples sorted by date desc
    items = []
    for i, form in enumerate(forms):
        items.append((form, accessions[i] if i < len(accessions) else "",
                      docs[i] if i < len(docs) else "",
                      dates[i] if i < len(dates) else ""))
    items.sort(key=lambda t: t[3], reverse=True)

    for preferred in PREFERRED_FORMS:
        for f, a, d, dt in items:
            if f == preferred and d:
                return f, a, d, dt
    return None


def doc_url(cik: str, accession: str, primary_doc: str) -> str:
    return (f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/"
            f"{accession.replace('-', '')}/{primary_doc}")


def fetch_html(url: str, max_bytes: int = 1_500_000) -> str:
    try:
        r = SESSION.get(url, timeout=25, stream=True)
        r.raise_for_status()
        chunks, total = [], 0
        for chunk in r.iter_content(chunk_size=32768):
            if not chunk:
                break
            chunks.append(chunk); total += len(chunk)
            if total >= max_bytes:
                break
        return b"".join(chunks).decode("utf-8", errors="ignore")
    except Exception as e:
        log.debug("fetch_html failed for %s: %s", url, e)
        return ""


def extract_ceo(html: str) -> tuple[str | None, float]:
    """Scan a proxy/10-K HTML for a name adjacent to a CEO-style title.

    Returns (name_or_None, confidence in 0..100).
    """
    if not html:
        return None, 0.0

    soup = BeautifulSoup(html, "lxml")
    text_blocks = []

    # Strategy A: Scan tables — proxies put name + title in adjacent cells/rows
    for tr in soup.find_all("tr"):
        cells = [c.get_text(" ", strip=True) for c in tr.find_all(["td", "th"])]
        if not cells:
            continue
        joined = " | ".join(cells)
        if CEO_TITLE.search(joined):
            text_blocks.append(joined)

    # Strategy B: Scan paragraphs near CEO title mentions
    full_text = soup.get_text("\n", strip=True)
    for m in CEO_TITLE.finditer(full_text):
        start = max(0, m.start() - 200)
        end = min(len(full_text), m.end() + 50)
        text_blocks.append(full_text[start:end])

    # Score candidate names
    candidates: dict[str, int] = {}
    for block in text_blocks:
        # Find capitalized name patterns near the CEO title
        for line in re.split(r"[\n|]", block):
            line = line.strip(" \t,;:")
            if not line or len(line) > 120:
                continue
            m = NAME_PATTERN.match(line)
            if m:
                name = m.group(1).strip()
                # Filter obvious non-names
                if name.lower() in {"the company", "our company", "chief executive officer"}:
                    continue
                candidates[name] = candidates.get(name, 0) + 1

    if not candidates:
        return None, 0.0
    best = max(candidates.items(), key=lambda kv: kv[1])
    name, hits = best
    confidence = min(100.0, 40.0 + 15.0 * hits)
    return name, confidence


def process(cik: str, ticker: str) -> str | None:
    subs = fetch_submissions(cik)
    if not subs:
        return None
    pick = best_officer_filing(subs)
    if not pick:
        log.debug("%s: no usable filing", ticker)
        return None
    form, accession, doc, fdate = pick
    url = doc_url(cik, accession, doc)
    html = fetch_html(url)
    name, conf = extract_ceo(html)
    if not name:
        log.debug("%s: no CEO match in %s (%s)", ticker, form, fdate)
        return None
    with db.cursor() as cur:
        cur.execute("UPDATE ceos SET is_current=0 WHERE cik=?", (cik,))
        cur.execute("""
            INSERT INTO ceos (cik, name, title, source_filing, confidence, is_current)
            VALUES (?, ?, ?, ?, ?, 1)
        """, (cik, name, "Chief Executive Officer", url, conf))
    log.info("%s: CEO=%s (conf=%.0f, src=%s %s)", ticker, name, conf, form, fdate)
    return name


def run(limit: int | None = None) -> None:
    with db.cursor() as cur:
        cur.execute("SELECT cik, ticker FROM companies ORDER BY market_cap ASC")
        rows = cur.fetchall()
    if limit:
        rows = rows[:limit]
    log.info("Extracting CEO for %d companies…", len(rows))
    found = 0
    for n, row in enumerate(rows, 1):
        if process(row["cik"], row["ticker"]):
            found += 1
        if n % 25 == 0:
            log.info("  %d/%d (%d CEOs identified)", n, len(rows), found)
        time.sleep(0.15)
    log.info("Done. %d CEOs identified across %d companies.", found, len(rows))


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--limit", type=int, default=None)
    p.add_argument("-v", "--verbose", action="store_true")
    args = p.parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    )
    run(limit=args.limit)


if __name__ == "__main__":
    main()
