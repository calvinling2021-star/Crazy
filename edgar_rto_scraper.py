"""
SEC EDGAR Full-Text Search Scraper
Finds brokers, finders, and financial advisors in reverse merger / shell company filings.

Usage:
    python edgar_rto_scraper.py                   # full run (overwrites CSVs)
    python edgar_rto_scraper.py --resume          # skip already-processed filings, append to CSVs
    python edgar_rto_scraper.py --limit 50        # process at most 50 filings
    python edgar_rto_scraper.py --test            # offline extraction smoke-test

Output:
    edgar_rto_brokers.csv              - one row per extracted broker/finder mention
    broker_summary.csv                 - one row per unique broker/finder (aggregated)
    .edgar_scraper_checkpoint          - processed accession numbers (used by --resume)
"""

import argparse
import csv
import logging
import os
import re
import time
from collections import defaultdict

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

USER_AGENT = "EDGAR-RTO-Scraper/1.0 calvinling2021@gmail.com"

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

EFTS_BASE     = "https://efts.sec.gov/LATEST/search-index"
SEC_ARCHIVES  = "https://www.sec.gov/Archives/edgar/data"

REQUEST_DELAY = 0.5    # seconds between requests (SEC rate limit)
PAGE_SIZE     = 20     # results per EFTS page (sent as &size=)
MAX_RETRIES   = 3      # retry attempts on transient errors

OUTPUT_FILINGS    = "edgar_rto_brokers.csv"
OUTPUT_SUMMARY    = "broker_summary.csv"
CHECKPOINT_FILE   = ".edgar_scraper_checkpoint"

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

BROKER_KEYWORDS = re.compile(
    r"\b(finder|broker|placement\s+agent|financial\s+advisor|advisory\s+fee|"
    r"brokerage\s+fee|consulting\s+fee|consulting\s+agreement|"
    r"finders?\s+fee|broker[- ]dealer)\b",
    re.IGNORECASE,
)

FEE_PATTERN = re.compile(
    r"(\$[\d,]+(?:\.\d+)?(?:\s*(?:million|thousand))?|"
    r"\d+(?:\.\d+)?\s*%|"
    r"\d+(?:\.\d+)?\s*percent)",
    re.IGNORECASE,
)

ROLE_PATTERNS = {
    "placement agent":   re.compile(r"\bplacement\s+agent\b",   re.IGNORECASE),
    "finder":            re.compile(r"\bfinder\b",               re.IGNORECASE),
    "broker":            re.compile(r"\bbroker\b",               re.IGNORECASE),
    "financial advisor": re.compile(r"\bfinancial\s+advisor\b",  re.IGNORECASE),
    "advisor":           re.compile(r"\badvisory\b",             re.IGNORECASE),
    "consultant":        re.compile(r"\bconsulting\b",           re.IGNORECASE),
}

COUNTRY_PATTERNS = re.compile(
    r"\b(Canada|Canadian|Australia|Australian|United\s+Kingdom|UK|British|"
    r"Europe|European|China|Chinese|Israel|Israeli|Singapore|Hong\s+Kong|"
    r"Germany|German|France|French|Netherlands|Dutch|Switzerland|Swiss|"
    r"Sweden|Swedish|Japan|Japanese|South\s+Korea|Korean|India|Indian|"
    r"UAE|Dubai|Cayman|British\s+Virgin\s+Islands|BVI|Bermuda|"
    r"Bahamas|Luxembourg|Ireland|Irish)\b",
    re.IGNORECASE,
)

# Title-cased proper name, optionally followed by an entity-type suffix
_ENTITY_SUFFIX = (
    r"(?:\s+(?:Ltd\.?|LLC|L\.L\.C\.|Inc\.?|Corp\.?|Co\.?|"
    r"Capital|Partners|Group|Advisors?|Securities|Investments?|"
    r"Financial|Management|Holdings?|Consulting|Broker|"
    r"International|Global|Ventures?|Associates?))?"
)
NAME_PATTERN = re.compile(
    r"\b([A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|&)){1,5}" + _ENTITY_SUFFIX + r")\b"
)

# Verb/preposition phrases that directly introduce a broker/finder name
_ROLE_INTRO = re.compile(
    r"(?:"
    r"fee\s+(?:of\s+[\$\d%,\.\s]+\s+)?to\s+"          # "fee of $X to ..."
    r"|paid\s+to\s+"                                    # "paid to ..."
    r"|payable\s+to\s+"                                 # "payable to ..."
    r"|due\s+to\s+"                                     # "due to ..."
    r"|paid\s+(?:by\s+the\s+[Cc]ompany\s+)?to\s+"      # "paid by the Company to ..."
    r"|(?:served?|acting|acts?)\s+as\s+(?:the\s+)?"    # "served as the ..."
    r"|(?:retained|engaged|appointed|hired)\s+"         # "retained ..."
    r"|introduced\s+by\s+"                              # "introduced by ..."
    r"|engagement\s+of\s+"                              # "engagement of ..."
    r")",
    re.IGNORECASE,
)

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
    "User-Agent":      USER_AGENT,
    "Accept":          "application/json, text/html, */*",
    "Accept-Encoding": "gzip, deflate",
})


def _get(url: str, params: dict | None = None) -> requests.Response | None:
    """GET with exponential-backoff retry on 5xx / connection errors."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = SESSION.get(url, params=params, timeout=30)
            if resp.status_code in (429, 500, 502, 503, 504):
                wait = 2 ** attempt
                log.warning("HTTP %d on attempt %d — retrying in %ds", resp.status_code, attempt, wait)
                time.sleep(wait)
                continue
            resp.raise_for_status()
            time.sleep(REQUEST_DELAY)
            return resp
        except requests.ConnectionError as exc:
            wait = 2 ** attempt
            log.warning("Connection error attempt %d/%d: %s — retrying in %ds", attempt, MAX_RETRIES, exc, wait)
            time.sleep(wait)
        except requests.RequestException as exc:
            log.warning("Request failed: %s  (%s)", url, exc)
            return None
    log.error("Giving up after %d attempts: %s", MAX_RETRIES, url)
    return None


# ---------------------------------------------------------------------------
# EFTS search (paginated)
# ---------------------------------------------------------------------------

def search_efts(query: str) -> list[dict]:
    """Return all EFTS hits for a query, walking all pages."""
    hits: list[dict] = []
    from_offset = 0
    log.info("Searching EFTS: %s", query)

    while True:
        params = {
            "q":         query,
            "dateRange": "custom",
            "startdt":   START_DATE,
            "enddt":     END_DATE,
            "forms":     FORM_TYPES,
            "from":      from_offset,
            "size":      PAGE_SIZE,
        }
        resp = _get(EFTS_BASE, params=params)
        if resp is None:
            break

        try:
            data = resp.json()
        except ValueError:
            log.warning("Non-JSON EFTS response for query: %s", query)
            break

        raw_hits = data.get("hits", {}).get("hits", [])
        if not raw_hits:
            break

        hits.extend(raw_hits)
        total = data.get("hits", {}).get("total", {}).get("value", 0)
        log.info("  page from=%d  got %d  total=%d", from_offset, len(raw_hits), total)

        from_offset += len(raw_hits)
        if from_offset >= total or len(raw_hits) < PAGE_SIZE:
            break

    return hits


# ---------------------------------------------------------------------------
# Filing document fetcher
# ---------------------------------------------------------------------------

def accession_from_id(hit_id: str) -> str:
    """
    EFTS _id examples:
      edgar/data/1234567/0001234567-22-012345.txt
      0001234567-22-012345
    Returns the bare accession number with dashes.
    """
    part = hit_id.split("/")[-1]
    return part.replace(".txt", "").replace(".htm", "").replace(".html", "")


def cik_from_id(hit_id: str) -> str:
    """Extract CIK from EFTS _id path (edgar/data/<CIK>/...)."""
    parts = hit_id.split("/")
    if "data" in parts:
        idx = parts.index("data")
        if idx + 1 < len(parts):
            return parts[idx + 1]
    return ""


def fetch_filing_text(cik: str, accession: str) -> str | None:
    """
    Fetch plain text of the primary document for a filing.
    Tries the filing index page first, falls back to the raw full-submission .txt.
    """
    acc_nodash = accession.replace("-", "")

    # Step 1: parse the filing index to find the primary document URL
    index_url = f"{SEC_ARCHIVES}/{cik}/{acc_nodash}/{accession}-index.htm"
    resp = _get(index_url)
    doc_url: str | None = None

    if resp is not None:
        soup = BeautifulSoup(resp.text, "html.parser")
        for row in soup.select("table tr"):
            cells = row.find_all("td")
            if len(cells) < 3:
                continue
            link = cells[2].find("a")
            if link and link.get("href", "").endswith((".htm", ".html", ".txt")):
                doc_url = "https://www.sec.gov" + link["href"]
                break

    # Step 2: fall back to raw full-submission text
    if doc_url is None:
        doc_url = f"{SEC_ARCHIVES}/{cik}/{acc_nodash}/{accession}.txt"

    resp2 = _get(doc_url)
    if resp2 is None:
        return None

    soup2 = BeautifulSoup(resp2.content, "html.parser")
    return soup2.get_text(separator=" ", strip=True)


# ---------------------------------------------------------------------------
# Text extraction helpers
# ---------------------------------------------------------------------------

CONTEXT_CHARS = 500


def extract_broker_snippets(text: str) -> list[dict]:
    snippets = []
    seen_keys: set[str] = set()
    for match in BROKER_KEYWORDS.finditer(text):
        start   = max(0, match.start() - CONTEXT_CHARS)
        end     = min(len(text), match.end() + CONTEXT_CHARS)
        excerpt = re.sub(r"\s{2,}", " ", text[start:end].replace("\n", " ").replace("\r", " "))
        key     = excerpt[:80]
        if key not in seen_keys:
            seen_keys.add(key)
            snippets.append({"keyword": match.group(), "excerpt": excerpt})
    return snippets


def classify_role(excerpt: str) -> str:
    for role, pat in ROLE_PATTERNS.items():
        if pat.search(excerpt):
            return role
    return "unknown"


def extract_fee(excerpt: str) -> str:
    m = FEE_PATTERN.search(excerpt)
    return m.group(0).strip() if m else ""


_NAME_NOISE = {
    "The", "This", "In", "As", "At", "On", "For", "By", "Of",
    "United States", "New York", "Common Stock", "Securities Act",
    "Exchange Act", "Board Of Directors", "Annual Report",
    "Form", "Item", "Section", "Exhibit",
}


def _is_valid_name(name: str) -> bool:
    return (
        bool(name)
        and len(name) > 4
        and name not in _NAME_NOISE
        and not COUNTRY_PATTERNS.fullmatch(name)
    )


def extract_names(excerpt: str) -> list[str]:
    """
    Extract broker/finder/advisor names from the excerpt.

    Strategy:
      1. Role-anchored: scan for intro phrases (\"fee to\", \"retained\", \"served as\", …)
         and grab the proper name that immediately follows — highest precision.
      2. Fallback: if nothing anchored is found, return the first valid proper name
         in the snippet so no filing is left entirely blank.
    """
    seen: set[str] = set()
    anchored: list[str] = []

    for intro in _ROLE_INTRO.finditer(excerpt):
        # Grab up to 120 chars after the intro phrase and look for a name at the start
        window = excerpt[intro.end():intro.end() + 120].lstrip()
        m = NAME_PATTERN.match(window)
        if m:
            name = m.group(0).strip().rstrip(".,;")
            if _is_valid_name(name) and name not in seen:
                seen.add(name)
                anchored.append(name)
        if len(anchored) == 5:
            break

    if anchored:
        return anchored

    # Fallback: first valid proper name anywhere in the snippet
    for name in NAME_PATTERN.findall(excerpt):
        name = name.strip()
        if _is_valid_name(name) and name not in seen:
            seen.add(name)
            return [name]

    return []


def extract_acquirer(text: str) -> str:
    m = ACQUIRER_PATTERN.search(text)
    return m.group(1).strip()[:120] if m else ""


def extract_country(text: str) -> str:
    m = COUNTRY_PATTERNS.search(text)
    return m.group(0).strip() if m else ""


def extract_ticker(text: str) -> str:
    m = TICKER_PATTERN.search(text)
    return m.group(1) if m else ""


# ---------------------------------------------------------------------------
# Per-filing processing
# ---------------------------------------------------------------------------

def process_hit(hit: dict) -> list[dict]:
    src        = hit.get("_source", {})
    hit_id     = hit.get("_id", "")

    filing_date = src.get("file_date") or src.get("display_date_filed", "")
    form_type   = src.get("form_type", "")
    pubco_name  = src.get("entity_name", "")

    cik       = cik_from_id(hit_id) or src.get("file_num", "")
    accession = accession_from_id(hit_id)
    acc_nodash = accession.replace("-", "")
    filing_url = (
        f"{SEC_ARCHIVES}/{cik}/{acc_nodash}/{accession}-index.htm" if cik else ""
    )

    log.info("  Fetching: %s  [%s] %s  (%s)", filing_date, form_type, pubco_name[:60], accession)

    text = fetch_filing_text(cik, accession)
    if not text:
        log.warning("  Skipped (no text): %s", accession)
        skipped_filings.append(accession)
        return []

    ticker   = extract_ticker(text[:5000])
    acquirer = extract_acquirer(text)
    snippets = extract_broker_snippets(text)

    rows: list[dict] = []
    for snip in snippets:
        excerpt     = snip["excerpt"]
        role        = classify_role(excerpt)
        fee         = extract_fee(excerpt)
        country     = extract_country(excerpt)
        names       = extract_names(excerpt) or ["[name not parsed]"]
        acq_country = extract_country(acquirer) or country

        for name in names:
            rows.append({
                "filing_date":              filing_date,
                "form_type":                form_type,
                "pubco_name":               pubco_name,
                "cik":                      cik,
                "ticker":                   ticker,
                "broker_finder_name":       name,
                "role":                     role,
                "fee_amount_or_percentage": fee,
                "acquirer_name":            acquirer,
                "acquirer_country":         acq_country,
                "filing_url":               filing_url,
                "relevant_excerpt":         excerpt[:800],
            })

    return rows


# ---------------------------------------------------------------------------
# Checkpoint helpers
# ---------------------------------------------------------------------------

def load_checkpoint() -> set[str]:
    """Return set of already-processed accession numbers."""
    try:
        with open(CHECKPOINT_FILE) as f:
            return {line.strip() for line in f if line.strip()}
    except FileNotFoundError:
        return set()


def append_checkpoint(accession: str) -> None:
    with open(CHECKPOINT_FILE, "a") as f:
        f.write(accession + "\n")


def clear_checkpoint() -> None:
    if os.path.exists(CHECKPOINT_FILE):
        os.remove(CHECKPOINT_FILE)


# ---------------------------------------------------------------------------
# CSV writers
# ---------------------------------------------------------------------------

def write_filings_csv(rows: list[dict], path: str, append: bool = False) -> None:
    mode = "a" if append else "w"
    with open(path, mode, newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FILINGS_FIELDNAMES)
        if not append:
            writer.writeheader()
        writer.writerows(rows)
    log.info("%s %d row(s) to %s", "Appended" if append else "Wrote", len(rows), path)


def _read_filings_csv(path: str) -> list[dict]:
    """Read all rows from an existing filings CSV (for resume-mode summary rebuild)."""
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_summary_csv(rows: list[dict], path: str) -> None:
    """Aggregate rows by broker name and write the summary CSV (always a full rewrite)."""
    by_broker: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        by_broker[row["broker_finder_name"]].append(row)

    summary: list[dict] = []
    for name, brows in sorted(by_broker.items(), key=lambda x: -len(x[1])):
        pubcos = list(dict.fromkeys(r["pubco_name"] for r in brows))
        dates  = sorted(r["filing_date"] for r in brows if r["filing_date"])
        summary.append({
            "broker_finder_name": name,
            "deal_count":         len({r["cik"] for r in brows}),
            "deals_list":         "; ".join(pubcos[:20]),
            "date_range_active":  f"{dates[0]} to {dates[-1]}" if dates else "",
            "cross_border_flag":  "yes" if any(r["acquirer_country"] for r in brows) else "no",
        })

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=SUMMARY_FIELDNAMES)
        writer.writeheader()
        writer.writerows(summary)
    log.info("Wrote %d broker summary rows to %s", len(summary), path)


# ---------------------------------------------------------------------------
# Offline smoke-test
# ---------------------------------------------------------------------------

_TEST_FILING = """
ACME Shell Corp (OTCQB: ACME) announced today the completion of its reverse merger
with Dragon Tech Ltd, a company incorporated in Hong Kong.

In connection with the transaction, the Company paid a finder's fee of $250,000 to
Apex Capital Partners LLC, who served as finder and introduced the parties. Apex
Capital Partners LLC is registered in Nevada.

Additionally, XYZ Securities Inc. acted as placement agent and received a brokerage
fee equal to 5% of the gross proceeds raised. The financial advisor to the acquirer
was Goldstone Advisory Group, based in Toronto, Canada.

The merger was structured as a reverse acquisition whereby Dragon Tech Ltd acquired
control of ACME Shell Corp.
"""


def run_test() -> None:
    print("=" * 70)
    print("OFFLINE EXTRACTION SMOKE-TEST")
    print("=" * 70)
    snippets = extract_broker_snippets(_TEST_FILING)
    print(f"Snippets found: {len(snippets)}\n")

    rows: list[dict] = []
    for snip in snippets:
        excerpt = snip["excerpt"]
        role    = classify_role(excerpt)
        fee     = extract_fee(excerpt)
        names   = extract_names(excerpt) or ["[name not parsed]"]
        country = extract_country(excerpt)
        print(f"  keyword  : {snip['keyword']}")
        print(f"  role     : {role}")
        print(f"  fee      : {fee}")
        print(f"  names    : {names}")
        print(f"  country  : {country}")
        print(f"  excerpt  : {excerpt[:120]}...")
        print()
        for name in names:
            rows.append({
                "filing_date": "2024-03-15", "form_type": "8-K",
                "pubco_name": "ACME Shell Corp", "cik": "0001234567",
                "ticker": extract_ticker(_TEST_FILING),
                "broker_finder_name": name, "role": role,
                "fee_amount_or_percentage": fee,
                "acquirer_name": extract_acquirer(_TEST_FILING),
                "acquirer_country": country,
                "filing_url": "https://www.sec.gov/test",
                "relevant_excerpt": excerpt[:800],
            })

    write_filings_csv(rows, OUTPUT_FILINGS)
    write_summary_csv(rows, OUTPUT_SUMMARY)
    print(f"Test complete — {len(rows)} row(s) written to {OUTPUT_FILINGS}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def print_summary(all_rows: list[dict], filings_scanned: int) -> None:
    unique_brokers = {r["broker_finder_name"] for r in all_rows
                      if r["broker_finder_name"] != "[name not parsed]"}
    by_count: dict[str, int] = defaultdict(int)
    for r in all_rows:
        name = r["broker_finder_name"]
        if name != "[name not parsed]":
            by_count[name] += 1

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total filings scanned   : {filings_scanned}")
    print(f"Filings skipped (error) : {len(skipped_filings)}")
    print(f"Total mentions extracted: {len(all_rows)}")
    print(f"Unique brokers/finders  : {len(unique_brokers)}")
    print()
    print("Top 10 most active brokers/finders by mention count:")
    for rank, (name, count) in enumerate(sorted(by_count.items(), key=lambda x: -x[1])[:10], 1):
        print(f"  {rank:2}. {name[:60]:<62} {count:4} mention(s)")

    if skipped_filings:
        print(f"\nSkipped accessions ({len(skipped_filings)}):")
        for acc in skipped_filings[:20]:
            print(f"  {acc}")
        if len(skipped_filings) > 20:
            print(f"  ... and {len(skipped_filings) - 20} more")


def main() -> None:
    parser = argparse.ArgumentParser(description="SEC EDGAR RTO Broker/Finder Scraper")
    parser.add_argument("--test",   action="store_true",
                        help="Run offline extraction smoke-test (no network required)")
    parser.add_argument("--resume", action="store_true",
                        help="Skip already-processed filings and append to existing CSVs")
    parser.add_argument("--limit",  type=int, default=0,
                        help="Stop after processing this many filings (0 = unlimited)")
    args = parser.parse_args()

    if args.test:
        run_test()
        return

    resume      = args.resume
    limit       = args.limit
    checkpoint  = load_checkpoint() if resume else set()

    if resume:
        print(f"Resuming — {len(checkpoint)} filing(s) already processed.")
    else:
        clear_checkpoint()
        # Write fresh CSV headers before the main loop so the file exists
        write_filings_csv([], OUTPUT_FILINGS, append=False)

    print("=" * 70)
    print("SEC EDGAR RTO Broker/Finder Scraper")
    print(f"Date range : {START_DATE} to {END_DATE}")
    print(f"Form types : {FORM_TYPES}")
    print(f"Queries    : {len(SEARCH_QUERIES)}")
    if limit:
        print(f"Limit      : {limit} filings")
    print("=" * 70)

    all_new_rows: list[dict] = []
    seen_accessions: set[str] = set(checkpoint)
    filings_scanned = 0
    done = False

    for idx, query in enumerate(SEARCH_QUERIES, 1):
        if done:
            break
        print(f"\n[{idx}/{len(SEARCH_QUERIES)}] Query: {query}")
        hits = search_efts(query)
        print(f"  Found {len(hits)} hits")

        for hit in hits:
            if done:
                break
            accession = accession_from_id(hit.get("_id", ""))
            if accession in seen_accessions:
                continue
            seen_accessions.add(accession)

            rows = process_hit(hit)
            if rows:
                # Append rows immediately so progress is saved even if interrupted
                write_filings_csv(rows, OUTPUT_FILINGS, append=True)
                all_new_rows.extend(rows)

            append_checkpoint(accession)
            filings_scanned += 1

            if limit and filings_scanned >= limit:
                log.info("Reached --limit %d, stopping.", limit)
                done = True

    # Rebuild summary from the full filings CSV (includes prior runs in resume mode)
    print("\n" + "=" * 70)
    print("Rebuilding summary...")
    all_rows_for_summary = _read_filings_csv(OUTPUT_FILINGS)
    write_summary_csv(all_rows_for_summary, OUTPUT_SUMMARY)
    print_summary(all_rows_for_summary, filings_scanned)
    print("\nDone.")


if __name__ == "__main__":
    main()
