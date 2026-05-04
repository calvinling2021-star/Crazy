"""Discover a company's email domain.

Email-pattern enrichment is useless without a domain. We try, in order:

  1. EDGAR submissions JSON — `website` field (rare but authoritative when present).
  2. Most recent 10-K / 10-Q cover page — most filings list the website
     immediately after the registrant's address.
  3. Heuristic guess from the company name (last resort, low confidence).

A domain-quality score (0..100) is attached to each result so callers can
decide whether to trust the result.
"""
from __future__ import annotations
import logging
import re
from urllib.parse import urlparse

import requests

from . import USER_AGENT, db

log = logging.getLogger(__name__)

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT, "Accept-Encoding": "gzip, deflate"})

EDGAR_SUBMISSIONS = "https://data.sec.gov/submissions/CIK{cik}.json"

# Common public-filing helper / legal / IR / wire domains we should never use
# as a corporate email domain.
DOMAIN_BLOCKLIST = {
    "sec.gov", "edgar-online.com", "globenewswire.com", "businesswire.com",
    "prnewswire.com", "marketwired.com", "bloomberg.com", "reuters.com",
    "nasdaq.com", "nyse.com", "yahoo.com", "google.com", "icrinc.com",
    "computershare.com", "broadridge.com", "wsj.com", "ft.com",
    "linkedin.com", "twitter.com", "facebook.com", "x.com",
}

# Extract the first https?:// URL from arbitrary text/HTML.
URL_RE = re.compile(
    r"https?://(?:www\.)?([A-Za-z0-9][A-Za-z0-9\-]*\.(?:[A-Za-z0-9\-]+\.)*[A-Za-z]{2,})",
    re.I,
)


def _domain_from_url(url: str) -> str | None:
    try:
        host = urlparse(url if "://" in url else f"http://{url}").hostname
    except ValueError:
        return None
    if not host:
        return None
    host = host.lower().lstrip("www.")
    if host in DOMAIN_BLOCKLIST:
        return None
    return host


def _scan_text_for_domain(text: str) -> str | None:
    """Return the first plausible non-blocklisted domain mentioned in text."""
    for m in URL_RE.finditer(text):
        host = m.group(1).lower()
        host = host.removeprefix("www.")
        # Strip subdomains like investors.foo.com -> foo.com (keep 2-label TLDs intact).
        labels = host.split(".")
        if len(labels) > 2 and labels[0] in {"investors", "ir", "investor", "www"}:
            host = ".".join(labels[1:])
        if host in DOMAIN_BLOCKLIST:
            continue
        return host
    return None


def from_edgar_submissions(cik: str) -> tuple[str | None, float]:
    cik10 = cik.zfill(10)
    try:
        r = SESSION.get(EDGAR_SUBMISSIONS.format(cik=cik10), timeout=15)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        log.debug("EDGAR submissions failed for %s: %s", cik, e)
        return None, 0.0
    website = (data.get("website") or "").strip()
    if website:
        d = _domain_from_url(website)
        if d:
            return d, 90.0
    return None, 0.0


def from_recent_10k(cik: str) -> tuple[str | None, float]:
    """Pull the most recent 10-K / 10-Q and grep the cover for a URL."""
    cik10 = cik.zfill(10)
    try:
        r = SESSION.get(EDGAR_SUBMISSIONS.format(cik=cik10), timeout=15)
        r.raise_for_status()
        recent = r.json().get("filings", {}).get("recent", {})
    except Exception as e:
        log.debug("EDGAR recent fetch failed for %s: %s", cik, e)
        return None, 0.0

    forms = recent.get("form", [])
    accs  = recent.get("accessionNumber", [])
    docs  = recent.get("primaryDocument", [])
    for i, f in enumerate(forms):
        if f not in {"10-K", "10-Q", "S-1", "F-1"}:
            continue
        try:
            url = (f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/"
                   f"{accs[i].replace('-', '')}/{docs[i]}")
        except (IndexError, ValueError):
            continue
        try:
            doc = SESSION.get(url, timeout=20, stream=True)
            doc.raise_for_status()
            buf, total = [], 0
            for chunk in doc.iter_content(chunk_size=32768):
                if not chunk:
                    break
                buf.append(chunk); total += len(chunk)
                # 10-K/Q cover pages are within the first ~120 KB.
                if total >= 200_000:
                    break
            text = b"".join(buf).decode("utf-8", errors="ignore")
            text = re.sub(r"<[^>]+>", " ", text)
            d = _scan_text_for_domain(text)
            if d:
                return d, 70.0
        except Exception as e:
            log.debug("doc fetch failed: %s", e)
            continue
    return None, 0.0


def heuristic_from_name(company_name: str) -> tuple[str | None, float]:
    """Strip Inc./Corp./Ltd. and try `<slug>.com`. Low confidence."""
    if not company_name:
        return None, 0.0
    name = re.sub(
        r"\s*(?:,?\s*(?:Inc\.?|Corp\.?|Corporation|Ltd\.?|LLC|Holdings|Co\.?|"
        r"Company|Group|Pharmaceuticals?|Therapeutics|Bio(?:tech)?|plc))+\s*$",
        "", company_name, flags=re.I,
    ).strip()
    slug = re.sub(r"[^a-z0-9]+", "", name.lower())
    if not slug or len(slug) < 3:
        return None, 0.0
    return f"{slug}.com", 25.0


def discover(cik: str, company_name: str) -> tuple[str | None, float, str]:
    """Try each strategy in order. Returns (domain, confidence, source)."""
    for fn, src in (
        (lambda: from_edgar_submissions(cik), "edgar_website"),
        (lambda: from_recent_10k(cik),         "10k_cover"),
    ):
        d, score = fn()
        if d:
            return d, score, src
    d, score = heuristic_from_name(company_name)
    return d, score, "name_heuristic"


def discover_for_universe(limit: int | None = None) -> int:
    """Walk all companies in the DB and store a domain on each row.

    Schema doesn't currently have a `domain` column on companies; we'll add
    it lazily and store discovered domains there.
    """
    with db.cursor() as cur:
        cur.execute("PRAGMA table_info(companies)")
        cols = {r["name"] for r in cur.fetchall()}
        if "domain" not in cols:
            cur.execute("ALTER TABLE companies ADD COLUMN domain TEXT")
            cur.execute("ALTER TABLE companies ADD COLUMN domain_source TEXT")
            cur.execute("ALTER TABLE companies ADD COLUMN domain_confidence REAL")

        cur.execute("""
            SELECT cik, ticker, name FROM companies
            WHERE (domain IS NULL OR domain = '')
            ORDER BY market_cap ASC
        """)
        rows = cur.fetchall()

    if limit:
        rows = rows[:limit]
    log.info("Discovering domains for %d companies…", len(rows))
    found = 0
    for n, row in enumerate(rows, 1):
        d, conf, src = discover(row["cik"], row["name"])
        if d:
            with db.cursor() as cur:
                cur.execute(
                    "UPDATE companies SET domain=?, domain_source=?, domain_confidence=? WHERE cik=?",
                    (d, src, conf, row["cik"]),
                )
            found += 1
        if n % 25 == 0:
            log.info("  %d/%d (%d domains)", n, len(rows), found)
    log.info("Done. %d domains discovered across %d companies.", found, len(rows))
    return found


def main() -> None:
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--limit", type=int)
    p.add_argument("-v", "--verbose", action="store_true")
    args = p.parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    )
    discover_for_universe(limit=args.limit)


if __name__ == "__main__":
    main()
