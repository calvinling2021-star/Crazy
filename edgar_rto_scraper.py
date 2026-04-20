"""
SEC EDGAR Full-Text Search Scraper
Finds brokers, finders, and financial advisors in reverse merger / shell company filings.

Usage:
    python edgar_rto_scraper.py

Output:
    edgar_rto_brokers.csv   - one row per extracted broker/finder mention
    broker_summary.csv      - one row per unique broker/finder (aggregated)
"""

import csv
import json
import logging
import re
import time
from collections import defaultdict
from datetime import datetime
from urllib.parse import quote_plus

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

USER_AGENT = "calvinling2021@gmail.com"

START_DATE = "2022-01-01"
END_DATE   = "2025-12-31"

FORM_TYPES = "8-K,DEFM14A,DEF 14A,S-1,S-4"

SEARCH_QUERIES = [
    '"finder\'s fee" AND "reverse merger"',
    '"finder\'s fee" AND "reverse acquisition"',
    '"consulting fee" AND "change of control" AND "shell"',
    '"advisory fee" AND "reverse merger"',
    '"brokerage fee" AND "shell company"',
    '"financial advisor" AND "reverse acquisition"',
]

EFTS_BASE    = "https://efts.sec.gov/LATEST/search-index"
EDGAR_VIEWER = "https://www.sec.gov/Archives/edgar/data"
EFTS_SEARCH  = "https://efts.sec.gov/LATEST/search-index"

REQUEST_DELAY = 0.5   # seconds between requests (SEC rate limit)
PAGE_SIZE     = 20    # results per page

OUTPUT_FILINGS = "edgar_rto_brokers.csv"
OUTPUT_SUMMARY = "broker_summary.csv"

FILINGS_FIELDNAMES = [
    "filing_date", "form_type", "pubco_name", "cik", "ticker",
    "broker_finder_name", "role", "fee_amount_or_percentage",
    "acquirer_name", "acquirer_country", "filing_url", "relevant_excerpt",
]

SUMMARY_FIELDNAMES = [
    "broker_finder_name", "deal_count", "deals_list",
    "date_range_active", "cross_border_flag",
]

# ---------------------------------------------------------------------------
# Patterns
# ---------------------------------------------------------------------------

# Keywords that signal a broker/finder/advisor paragraph
BROKER_KEYWORDS = re.compile(
    r"\b(finder|broker|placement\s+agent|financial\s+advisor|advisory\s+fee|"
    r"brokerage\s+fee|consulting\s+fee|consulting\s+agreement|"
    r"finders?\s+fee|broker[- ]dealer)\b",
    re.IGNORECASE,
)

# Fee amounts: "$1,500,000", "3%", "3.5 percent", "three percent"
FEE_PATTERN = re.compile(
    r"(\$[\d,]+(?:\.\d+)?(?:\s*(?:million|thousand))?|"
    r"\d+(?:\.\d+)?\s*%|"
    r"\d+(?:\.\d+)?\s*percent)",
    re.IGNORECASE,
)

# Role classifier
ROLE_PATTERNS = {
    "placement agent": re.compile(r"\bplacement\s+agent\b", re.IGNORECASE),
    "finder":          re.compile(r"\bfinder\b", re.IGNORECASE),
    "broker":          re.compile(r"\bbroker\b", re.IGNORECASE),
    "financial advisor": re.compile(r"\bfinancial\s+advisor\b", re.IGNORECASE),
    "advisor":         re.compile(r"\badvisory\b", re.IGNORECASE),
    "consultant":      re.compile(r"\bconsulting\b", re.IGNORECASE),
}

# Countries for cross-border flag
COUNTRY_PATTERNS = re.compile(
    r"\b(Canada|Canadian|Australia|Australian|United\s+Kingdom|UK|British|"
    r"Europe|European|China|Chinese|Israel|Israeli|Singapore|Hong\s+Kong|"
    r"Germany|German|France|French|Netherlands|Dutch|Switzerland|Swiss|"
    r"Sweden|Swedish|Japan|Japanese|South\s+Korea|Korean|India|Indian|"
    r"UAE|Dubai|Cayman|British\s+Virgin\s+Islands|BVI|Bermuda|"
    r"Bahamas|Luxembourg|Ireland|Irish)\b",
    re.IGNORECASE,
)

# Proper name heuristic: Title-cased words (2-5 consecutive), possibly with Ltd/Inc/Corp/LLC
NAME_PATTERN = re.compile(
    r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}"
    r"(?:\s+(?:Ltd|LLC|Inc|Corp|Capital|Partners|Group|Advisors?|Securities|"
    r"Investments?|Financial|Management|Holdings?|Consulting|Broker|"
    r"International|Global|Ventures?))?)\b"
)

# Acquirer patterns: "acquired by X", "the acquiree is X", "merger with X"
ACQUIRER_PATTERN = re.compile(
    r"(?:acquired\s+by|acquiree|acquirer|merger\s+with|"
    r"transaction\s+with|combining\s+with)\s+([A-Z][A-Za-z0-9\s,\.]+?)(?:[,\.]|\s{2,}|$)",
    re.IGNORECASE,
)

TICKER_PATTERN = re.compile(r"\((?:NASDAQ|NYSE|OTC[BQ]?|OTCQB|OTCQX):\s*([A-Z]{1,5})\)")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

skipped_filings: list[str] = []

# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": USER_AGENT,
    "Accept-Encoding": "gzip, deflate",
    "Host": "efts.sec.gov",
})


def _get(url: str, params: dict | None = None, host_override: str | None = None) -> requests.Response | None:
    headers = {}
    if host_override:
        headers["Host"] = host_override
    try:
        resp = SESSION.get(url, params=params, headers=headers, timeout=30)
        resp.raise_for_status()
        time.sleep(REQUEST_DELAY)
        return resp
    except requests.RequestException as exc:
        log.warning("Request failed: %s  (%s)", url, exc)
        return None


# ---------------------------------------------------------------------------
# EFTS search  (paginated)
# ---------------------------------------------------------------------------

def search_efts(query: str) -> list[dict]:
    """Return all hits for a query across all pages."""
    hits: list[dict] = []
    from_offset = 0

    encoded = quote_plus(query)
    log.info("Searching EFTS: %s", query)

    while True:
        params = {
            "q":         query,
            "dateRange": "custom",
            "startdt":   START_DATE,
            "enddt":     END_DATE,
            "forms":     FORM_TYPES,
            "from":      from_offset,
            "_source":   "file_date,form_type,entity_name,file_num,period_of_report,biz_location,"
                         "inc_states,display_date_filed,id",
        }
        resp = _get(EFTS_BASE, params=params, host_override="efts.sec.gov")
        if resp is None:
            break

        try:
            data = resp.json()
        except ValueError:
            log.warning("Non-JSON response from EFTS for query: %s", query)
            break

        # EFTS wraps results in hits.hits
        raw_hits = data.get("hits", {}).get("hits", [])
        if not raw_hits:
            break

        hits.extend(raw_hits)
        total = data.get("hits", {}).get("total", {}).get("value", 0)
        log.info("  page offset=%d  got %d  total=%d", from_offset, len(raw_hits), total)

        from_offset += len(raw_hits)
        if from_offset >= total or len(raw_hits) < PAGE_SIZE:
            break

    return hits


# ---------------------------------------------------------------------------
# Filing document fetcher
# ---------------------------------------------------------------------------

def build_filing_url(cik: str, accession: str) -> str:
    """Return the EDGAR filing index URL."""
    acc_clean = accession.replace("-", "")
    return f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type=&dateb=&owner=include&count=40"


def accession_from_id(hit_id: str) -> str:
    """
    EFTS hit _id is like:  0001234567-22-012345
    or sometimes a path like edgar/data/CIK/0001234567-22-012345.txt
    """
    # strip path components
    part = hit_id.split("/")[-1]
    part = part.replace(".txt", "").replace(".htm", "")
    return part


def fetch_filing_text(cik: str, accession: str) -> str | None:
    """Download raw text of the primary document in an EDGAR filing."""
    acc_nodash = accession.replace("-", "")
    # Try the filing index page to find the primary document
    index_url = (
        f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc_nodash}/{accession}-index.htm"
    )
    SESSION.headers["Host"] = "www.sec.gov"
    resp = _get(index_url, host_override="www.sec.gov")

    doc_url: str | None = None

    if resp is not None:
        soup = BeautifulSoup(resp.text, "html.parser")
        # Look for the primary document link in the filing index table
        for row in soup.select("table tr"):
            cells = row.find_all("td")
            if len(cells) >= 3:
                doc_type = cells[3].get_text(strip=True) if len(cells) > 3 else ""
                link = cells[2].find("a") if len(cells) > 2 else None
                if link and link.get("href"):
                    href = link["href"]
                    # prefer .htm or .txt primary documents
                    if href.endswith((".htm", ".txt", ".html")):
                        doc_url = "https://www.sec.gov" + href
                        break

    if doc_url is None:
        # Fall back: try the raw .txt full submission
        doc_url = (
            f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc_nodash}/{accession}.txt"
        )

    resp2 = _get(doc_url, host_override="www.sec.gov")
    if resp2 is None:
        return None

    # Strip HTML tags to get plain text
    soup2 = BeautifulSoup(resp2.content, "html.parser")
    return soup2.get_text(separator=" ", strip=True)


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------

CONTEXT_CHARS = 500  # characters each side of keyword match


def extract_broker_snippets(text: str) -> list[dict]:
    """Find all broker/finder keyword occurrences and return context snippets."""
    snippets = []
    for match in BROKER_KEYWORDS.finditer(text):
        start = max(0, match.start() - CONTEXT_CHARS)
        end   = min(len(text), match.end() + CONTEXT_CHARS)
        snippet = text[start:end].replace("\n", " ").replace("\r", " ")
        # collapse whitespace
        snippet = re.sub(r"\s{2,}", " ", snippet)
        snippets.append({
            "keyword": match.group(),
            "excerpt": snippet,
        })
    return snippets


def classify_role(excerpt: str) -> str:
    for role, pat in ROLE_PATTERNS.items():
        if pat.search(excerpt):
            return role
    return "unknown"


def extract_fee(excerpt: str) -> str:
    m = FEE_PATTERN.search(excerpt)
    return m.group(0).strip() if m else ""


def extract_names(excerpt: str) -> list[str]:
    """Heuristically pull proper names / entity names from the excerpt."""
    candidates = NAME_PATTERN.findall(excerpt)
    # Filter out common false-positives (section headers, states, etc.)
    noise = {
        "The", "This", "In", "As", "At", "On", "For", "By", "Of",
        "United States", "New York", "Common Stock", "Securities Act",
        "Exchange Act", "Board Of Directors", "Annual Report",
        "Form", "Item", "Section", "Exhibit",
    }
    names = []
    for name in candidates:
        name = name.strip()
        if name and name not in noise and len(name) > 4:
            names.append(name)
    # deduplicate while preserving order
    seen: set[str] = set()
    unique = []
    for n in names:
        if n not in seen:
            seen.add(n)
            unique.append(n)
    return unique[:5]  # return top 5 candidates


def extract_acquirer(text: str) -> str:
    m = ACQUIRER_PATTERN.search(text)
    if m:
        return m.group(1).strip()[:120]
    return ""


def extract_country(excerpt: str) -> str:
    m = COUNTRY_PATTERNS.search(excerpt)
    return m.group(0).strip() if m else ""


def extract_ticker(text: str) -> str:
    m = TICKER_PATTERN.search(text)
    return m.group(1) if m else ""


# ---------------------------------------------------------------------------
# Main processing
# ---------------------------------------------------------------------------

def process_hit(hit: dict) -> list[dict]:
    """Return a list of row dicts (one per broker mention) for a single EDGAR hit."""
    src = hit.get("_source", {})
    hit_id = hit.get("_id", "")

    filing_date = src.get("file_date") or src.get("display_date_filed", "")
    form_type   = src.get("form_type", "")
    pubco_name  = src.get("entity_name", "")
    cik_raw     = src.get("file_num", "") or ""

    # CIK is embedded in the _id path: edgar/data/CIK/accession
    cik = ""
    id_parts = hit_id.split("/")
    if "data" in id_parts:
        idx = id_parts.index("data")
        if idx + 1 < len(id_parts):
            cik = id_parts[idx + 1]

    if not cik:
        cik = cik_raw

    accession = accession_from_id(hit_id)
    acc_nodash = accession.replace("-", "")
    filing_url = (
        f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc_nodash}/{accession}-index.htm"
        if cik else ""
    )

    log.info("  Fetching: %s  [%s] %s  (%s)", filing_date, form_type, pubco_name[:60], accession)

    text = fetch_filing_text(cik, accession)
    if not text:
        log.warning("  Skipped (no text): %s", accession)
        skipped_filings.append(accession)
        return []

    ticker    = extract_ticker(text[:5000])  # ticker usually near top
    acquirer  = extract_acquirer(text)
    snippets  = extract_broker_snippets(text)

    if not snippets:
        return []

    rows = []
    seen_excerpts: set[str] = set()

    for snip in snippets:
        excerpt = snip["excerpt"]
        # Deduplicate nearly identical excerpts within same filing
        key = excerpt[:80]
        if key in seen_excerpts:
            continue
        seen_excerpts.add(key)

        role        = classify_role(excerpt)
        fee         = extract_fee(excerpt)
        country     = extract_country(excerpt)
        names       = extract_names(excerpt)
        acq_country = extract_country(acquirer) or country

        if not names:
            # Still record even without a name (for manual review)
            names = ["[name not parsed]"]

        for name in names:
            rows.append({
                "filing_date":           filing_date,
                "form_type":             form_type,
                "pubco_name":            pubco_name,
                "cik":                   cik,
                "ticker":                ticker,
                "broker_finder_name":    name,
                "role":                  role,
                "fee_amount_or_percentage": fee,
                "acquirer_name":         acquirer[:120],
                "acquirer_country":      acq_country,
                "filing_url":            filing_url,
                "relevant_excerpt":      excerpt[:800],
            })

    return rows


# ---------------------------------------------------------------------------
# CSV writers
# ---------------------------------------------------------------------------

def write_filings_csv(rows: list[dict], path: str) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FILINGS_FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)
    log.info("Wrote %d rows to %s", len(rows), path)


def write_summary_csv(rows: list[dict], path: str) -> None:
    """Aggregate by broker_finder_name and write summary CSV."""
    # group rows
    by_broker: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        name = row["broker_finder_name"]
        by_broker[name].append(row)

    summary_rows = []
    for name, broker_rows in sorted(by_broker.items(), key=lambda x: -len(x[1])):
        pubcos = list(dict.fromkeys(r["pubco_name"] for r in broker_rows))  # preserve order, dedupe
        dates  = [r["filing_date"] for r in broker_rows if r["filing_date"]]
        cross_border = any(r["acquirer_country"] for r in broker_rows)

        summary_rows.append({
            "broker_finder_name": name,
            "deal_count":         len(set(r["cik"] for r in broker_rows)),
            "deals_list":         "; ".join(pubcos[:20]),
            "date_range_active":  f"{min(dates)} to {max(dates)}" if dates else "",
            "cross_border_flag":  "yes" if cross_border else "no",
        })

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=SUMMARY_FIELDNAMES)
        writer.writeheader()
        writer.writerows(summary_rows)
    log.info("Wrote %d broker summary rows to %s", len(summary_rows), path)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 70)
    print("SEC EDGAR RTO Broker/Finder Scraper")
    print(f"Date range: {START_DATE} to {END_DATE}")
    print(f"Form types: {FORM_TYPES}")
    print(f"Queries   : {len(SEARCH_QUERIES)}")
    print("=" * 70)

    all_rows: list[dict] = []
    seen_accessions: set[str] = set()
    filings_scanned = 0

    for query_idx, query in enumerate(SEARCH_QUERIES, 1):
        print(f"\n[{query_idx}/{len(SEARCH_QUERIES)}] Query: {query}")
        hits = search_efts(query)
        print(f"  Found {len(hits)} hits")

        for hit in hits:
            accession = accession_from_id(hit.get("_id", ""))
            if accession in seen_accessions:
                log.info("  Duplicate accession, skipping: %s", accession)
                continue
            seen_accessions.add(accession)
            filings_scanned += 1

            rows = process_hit(hit)
            all_rows.extend(rows)

    # Write outputs
    print("\n" + "=" * 70)
    print("Writing output files...")
    write_filings_csv(all_rows, OUTPUT_FILINGS)
    write_summary_csv(all_rows, OUTPUT_SUMMARY)

    # Summary stats
    unique_brokers = set(r["broker_finder_name"] for r in all_rows
                         if r["broker_finder_name"] != "[name not parsed]")
    by_broker_count: dict[str, int] = defaultdict(int)
    for r in all_rows:
        name = r["broker_finder_name"]
        if name != "[name not parsed]":
            by_broker_count[name] += 1

    top10 = sorted(by_broker_count.items(), key=lambda x: -x[1])[:10]

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total filings scanned   : {filings_scanned}")
    print(f"Filings skipped (error) : {len(skipped_filings)}")
    print(f"Total mentions extracted: {len(all_rows)}")
    print(f"Unique brokers/finders  : {len(unique_brokers)}")
    print()
    print("Top 10 most active brokers/finders by mention count:")
    for rank, (name, count) in enumerate(top10, 1):
        print(f"  {rank:2}. {name[:60]:<62} {count:4} mention(s)")

    if skipped_filings:
        print(f"\nSkipped accessions ({len(skipped_filings)}):")
        for acc in skipped_filings[:20]:
            print(f"  {acc}")
        if len(skipped_filings) > 20:
            print(f"  ... and {len(skipped_filings) - 20} more")

    print("\nDone.")


if __name__ == "__main__":
    main()
