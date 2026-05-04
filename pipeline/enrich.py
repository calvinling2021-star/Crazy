"""Layer 4 — Email + LinkedIn enrichment.

This module:
  1. Detects the corporate email domain from the EDGAR business address (when
     the issuer's website appears in 10-K cover pages or via a heuristic web
     search), or accepts an explicit map.
  2. Generates pattern-based email candidates (first.last@, flast@, first@, ...)
  3. Optionally calls Hunter / Apollo / RocketReach if API keys are set.
  4. Optionally SMTP-verifies candidates via NeverBounce / ZeroBounce / direct.
  5. Builds a LinkedIn search URL the operator can click into.

For the spike, only steps 1, 2, and 5 are wired up (no paid keys assumed).
Add API keys to env vars HUNTER_API_KEY / APOLLO_API_KEY / NEVERBOUNCE_API_KEY
to upgrade.

Run: `python -m pipeline.enrich`
"""
from __future__ import annotations
import argparse
import logging
import os
import re
import time
from urllib.parse import quote_plus

import requests

from . import USER_AGENT, db, verify as verifier

log = logging.getLogger(__name__)

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT})

EMAIL_PATTERNS = [
    "{first}.{last}@{domain}",
    "{first}{last}@{domain}",
    "{f}{last}@{domain}",
    "{first}@{domain}",
    "{first}_{last}@{domain}",
    "{f}.{last}@{domain}",
    "{last}.{first}@{domain}",
]


_HONORIFIC = re.compile(r"^(?:Dr\.?|Mr\.?|Ms\.?|Mrs\.?|Prof\.?)\s+", re.I)
_SUFFIX = re.compile(r"^(?:Ph\.?D\.?|M\.?D\.?|J\.?D\.?|MBA|MPH|Esq\.?|Jr\.?|Sr\.?|II|III|IV)$", re.I)


def split_name(full: str) -> tuple[str, str]:
    """Strip honorifics/suffixes, lowercase first + last."""
    # Drop everything after the first comma (suffixes like ", PharmD, JD")
    cleaned = full.split(",")[0]
    cleaned = _HONORIFIC.sub("", cleaned).strip()
    parts = [p for p in re.split(r"\s+", cleaned) if p and not _SUFFIX.match(p)]
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0].lower(), parts[0].lower()
    return parts[0].lower(), parts[-1].lower()


def email_candidates(name: str, domain: str) -> list[str]:
    first, last = split_name(name)
    if not first or not domain:
        return []
    f = first[0]
    out, seen = [], set()
    for tpl in EMAIL_PATTERNS:
        cand = tpl.format(first=first, last=last, f=f, domain=domain)
        cand = re.sub(r"[^a-z0-9._@-]", "", cand)
        if cand and cand not in seen:
            seen.add(cand); out.append(cand)
    return out


def linkedin_search_url(name: str, company: str | None = None) -> str:
    q = name + (f" {company}" if company else "")
    return f"https://www.google.com/search?q={quote_plus('site:linkedin.com/in ' + q)}"


# ---------------------------------------------------------------------------
# Optional integrations (off unless API keys present)
# ---------------------------------------------------------------------------

def hunter_lookup(domain: str, first: str, last: str) -> tuple[str | None, float]:
    key = os.getenv("HUNTER_API_KEY")
    if not key:
        return None, 0.0
    try:
        r = SESSION.get(
            "https://api.hunter.io/v2/email-finder",
            params={"domain": domain, "first_name": first, "last_name": last, "api_key": key},
            timeout=15,
        )
        r.raise_for_status()
        d = r.json().get("data", {})
        return d.get("email"), float(d.get("score") or 0)
    except Exception as e:
        log.debug("Hunter lookup failed: %s", e)
        return None, 0.0


def neverbounce_verify(email: str) -> str:
    """Returns 'valid' | 'invalid' | 'unknown'. No-op without key."""
    key = os.getenv("NEVERBOUNCE_API_KEY")
    if not key:
        return "unknown"
    try:
        r = SESSION.get(
            "https://api.neverbounce.com/v4/single/check",
            params={"email": email, "key": key},
            timeout=15,
        )
        r.raise_for_status()
        return r.json().get("result", "unknown")
    except Exception as e:
        log.debug("NeverBounce verify failed: %s", e)
        return "unknown"


def verify_email(email: str) -> tuple[str, float]:
    """Verify via NeverBounce when key is set, else built-in SMTP probe.

    Returns (verdict, score). Score is the credit assigned to the contact.
    """
    if os.getenv("NEVERBOUNCE_API_KEY"):
        verdict = neverbounce_verify(email)
        return verdict, {"valid": 90, "invalid": 0, "unknown": 30}.get(verdict, 30)
    r = verifier.verify(email, do_smtp=os.getenv("SMTP_VERIFY", "1") == "1")
    return r.verdict, r.score


# ---------------------------------------------------------------------------
# Main enrichment loop
# ---------------------------------------------------------------------------

def enrich_one(cik: str, name: str, ceo_id: int, domain: str | None,
               company_name: str) -> int:
    """Add candidate contacts for one CEO. Returns # rows inserted."""
    inserted = 0
    with db.cursor() as cur:
        # LinkedIn (search URL — 0 cost, ~always useful)
        cur.execute("""
            INSERT INTO contacts (ceo_id, channel, value, source, score)
            VALUES (?, 'linkedin', ?, 'search_url', 50)
        """, (ceo_id, linkedin_search_url(name, company_name)))
        inserted += 1

        if not domain:
            return inserted

        # Hunter (paid) — best email if available
        first, last = split_name(name)
        h_email, h_score = hunter_lookup(domain, first, last)
        if h_email:
            cur.execute("""
                INSERT INTO contacts (ceo_id, channel, value, source, score)
                VALUES (?, 'email', ?, 'hunter', ?)
            """, (ceo_id, h_email, h_score))
            inserted += 1

        # Pattern guesses + verify
        for cand in email_candidates(name, domain):
            verdict, score = verify_email(cand)
            if score <= 0:
                continue
            cur.execute("""
                INSERT INTO contacts (ceo_id, channel, value, source, score)
                VALUES (?, 'email', ?, ?, ?)
            """, (ceo_id, cand, f"pattern:{verdict}", score))
            inserted += 1
    return inserted


def run(limit: int | None = None, default_domain_map: dict[str, str] | None = None) -> None:
    """Iterate CEOs and enrich them.

    Uses each company's discovered `domain` from the DB (populated by
    `pipeline.domains`). `default_domain_map` overrides on a per-ticker basis
    when you have higher-quality mappings.
    """
    default_domain_map = default_domain_map or {}
    with db.cursor() as cur:
        # Tolerate the schema migration in `domains.py` (column may be absent)
        cur.execute("PRAGMA table_info(companies)")
        cols = {r["name"] for r in cur.fetchall()}
        domain_col = "companies.domain" if "domain" in cols else "NULL"
        cur.execute(f"""
            SELECT ceos.id AS ceo_id, ceos.cik, ceos.name AS ceo_name,
                   companies.ticker, companies.name AS company_name,
                   {domain_col} AS domain
            FROM ceos
            JOIN companies ON companies.cik = ceos.cik
            WHERE ceos.is_current = 1
            ORDER BY companies.market_cap ASC
        """)
        rows = cur.fetchall()
    if limit:
        rows = rows[:limit]

    log.info("Enriching contacts for %d CEOs…", len(rows))
    total = 0
    for n, row in enumerate(rows, 1):
        domain = default_domain_map.get(row["ticker"]) or row["domain"]
        added = enrich_one(row["cik"], row["ceo_name"], row["ceo_id"],
                           domain, row["company_name"])
        total += added
        if n % 25 == 0:
            log.info("  %d/%d (%d contacts written)", n, len(rows), total)
        time.sleep(0.05)
    log.info("Done. %d contact rows written.", total)


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
