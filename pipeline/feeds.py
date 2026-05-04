"""Layer 3 (continuous) — RSS / Atom feed listeners.

Subscribes to:
  * EDGAR's "all forms" RSS for incremental 8-K / NT-10K / NT-10Q events.
  * GlobeNewswire / BusinessWire / PRNewswire indices for press releases
    matching strategic-alternatives keywords.

Each event is normalized into a Signal and written via `db.add_signal()`,
so the rest of the system (delinquency score, hot-prospects view) reacts
automatically.

Design choices
--------------
* Polling, not push. EDGAR has no webhook; the RSS feed updates ~every
  10 minutes. We checkpoint the last-seen GUID per source.
* Keyword filters live in a single config dict so they're easy to tune.
* No paid services required.

CLI
---
    python -m pipeline.feeds once          # one poll cycle, then exit
    python -m pipeline.feeds watch -i 600  # loop forever, every 600s
"""
from __future__ import annotations
import argparse
import logging
import re
import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import requests

from . import USER_AGENT, db

log = logging.getLogger(__name__)

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT, "Accept-Encoding": "gzip, deflate"})

CHECKPOINT = Path(__file__).parent / "data" / "feed_checkpoints.json"

# Map of feed-id -> (URL, parser, signal weights, signal label)
FEEDS: dict[str, dict] = {
    "edgar_8k": {
        "url": "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent"
               "&type=8-K&company=&dateb=&owner=include&count=100&output=atom",
        "type": "atom",
    },
    "edgar_nt10k": {
        "url": "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent"
               "&type=NT+10-K&company=&dateb=&owner=include&count=100&output=atom",
        "type": "atom",
    },
    "edgar_nt10q": {
        "url": "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent"
               "&type=NT+10-Q&company=&dateb=&owner=include&count=100&output=atom",
        "type": "atom",
    },
    # Public RSS — title + summary scanned for keywords below
    "globenewswire": {
        "url": "https://www.globenewswire.com/RssFeed/orgclass/1/feedTitle/GlobeNewswire+-+News+about+Public+Companies",
        "type": "rss",
    },
    "businesswire": {
        "url": "https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJfX1NKVA==",
        "type": "rss",
    },
}

KEYWORD_SIGNALS = [
    (re.compile(r"\b(strategic\s+alternatives|exploring\s+strategic|review\s+of\s+strategic|formal\s+process)\b", re.I),
     "strategic_alternatives", 10),
    (re.compile(r"\b(going\s+concern|substantial\s+doubt)\b", re.I),
     "going_concern", 20),
    (re.compile(r"\b(notice\s+of\s+failure|deficiency\s+notice|minimum\s+bid\s+price|delisting)\b", re.I),
     "deficiency", 25),
    (re.compile(r"\b(reverse\s+(?:stock|share)\s+split)\b", re.I),
     "reverse_split", 5),
    (re.compile(r"\b(form\s+nt\s*10-?[KQ])\b", re.I),
     "NT-10K", 30),
]


@dataclass
class FeedItem:
    feed_id: str
    guid: str
    title: str
    link: str
    summary: str
    published: str | None


def _ns(tag: str) -> str:
    """ElementTree namespace shortcut for Atom."""
    return tag.replace("atom:", "{http://www.w3.org/2005/Atom}")


def parse_atom(xml: str, feed_id: str) -> list[FeedItem]:
    out = []
    try:
        root = ET.fromstring(xml)
    except ET.ParseError as e:
        log.warning("atom parse failed for %s: %s", feed_id, e); return out
    for entry in root.findall(_ns("atom:entry")):
        guid    = (entry.findtext(_ns("atom:id")) or "").strip()
        title   = (entry.findtext(_ns("atom:title")) or "").strip()
        link_el = entry.find(_ns("atom:link"))
        link    = link_el.get("href", "") if link_el is not None else ""
        summary = (entry.findtext(_ns("atom:summary")) or "").strip()
        pub     = entry.findtext(_ns("atom:updated")) or entry.findtext(_ns("atom:published"))
        out.append(FeedItem(feed_id, guid, title, link, summary, pub))
    return out


def parse_rss(xml: str, feed_id: str) -> list[FeedItem]:
    out = []
    try:
        root = ET.fromstring(xml)
    except ET.ParseError as e:
        log.warning("rss parse failed for %s: %s", feed_id, e); return out
    channel = root.find("channel")
    if channel is None:
        return out
    for item in channel.findall("item"):
        title = (item.findtext("title") or "").strip()
        link  = (item.findtext("link") or "").strip()
        guid  = (item.findtext("guid") or link).strip()
        desc  = (item.findtext("description") or "").strip()
        pub   = item.findtext("pubDate")
        out.append(FeedItem(feed_id, guid, title, link, desc, pub))
    return out


def fetch_feed(feed_id: str) -> list[FeedItem]:
    cfg = FEEDS[feed_id]
    try:
        r = SESSION.get(cfg["url"], timeout=20)
        r.raise_for_status()
    except Exception as e:
        log.warning("fetch failed for %s: %s", feed_id, e); return []
    if cfg["type"] == "atom":
        return parse_atom(r.text, feed_id)
    return parse_rss(r.text, feed_id)


def load_checkpoints() -> dict[str, str]:
    import json
    if not CHECKPOINT.exists():
        return {}
    try:
        return json.loads(CHECKPOINT.read_text())
    except Exception:
        return {}


def save_checkpoints(cp: dict[str, str]) -> None:
    import json
    CHECKPOINT.parent.mkdir(parents=True, exist_ok=True)
    CHECKPOINT.write_text(json.dumps(cp, indent=2))


# ---------------------------------------------------------------------------
# Signal extraction from feed items
# ---------------------------------------------------------------------------

CIK_FROM_EDGAR_LINK = re.compile(r"/data/(\d+)/")
TICKER_FROM_TITLE   = re.compile(r"\(([A-Z]{1,5})(?:[:\.][A-Z]+)?\)\s*$")


def find_company(item: FeedItem, cur) -> tuple[str | None, str | None]:
    """Try CIK first (EDGAR) then ticker symbol from title (newswires).

    Returns (cik, ticker_or_None).
    """
    m = CIK_FROM_EDGAR_LINK.search(item.link or "")
    if m:
        cik = m.group(1).zfill(10)
        cur.execute("SELECT ticker FROM companies WHERE cik=?", (cik,))
        row = cur.fetchone()
        return cik, (row["ticker"] if row else None)

    m = TICKER_FROM_TITLE.search(item.title)
    if m:
        ticker = m.group(1)
        cur.execute("SELECT cik FROM companies WHERE ticker=?", (ticker,))
        row = cur.fetchone()
        if row:
            return row["cik"], ticker
    return None, None


def emit_signals(item: FeedItem) -> int:
    """Convert a feed item into 0+ DB signals."""
    text = f"{item.title}\n{item.summary}"
    matches = [(label, weight) for rx, label, weight in KEYWORD_SIGNALS if rx.search(text)]
    if not matches and not item.feed_id.startswith("edgar"):
        return 0
    with db.cursor() as cur:
        cik, _ = find_company(item, cur)
        if not cik:
            return 0
        added = 0
        # EDGAR-feed-specific: NT filings come in via dedicated URLs already.
        if item.feed_id == "edgar_nt10k":
            db.add_signal(cur, cik, "NT-10K", 30, item.link, _to_date(item.published))
            added += 1
        elif item.feed_id == "edgar_nt10q":
            db.add_signal(cur, cik, "NT-10Q", 30, item.link, _to_date(item.published))
            added += 1
        for label, weight in matches:
            db.add_signal(cur, cik, label, weight, item.link, _to_date(item.published))
            added += 1
        return added


def _to_date(s: str | None) -> str | None:
    if not s:
        return None
    for fmt in ("%a, %d %b %Y %H:%M:%S %Z", "%a, %d %b %Y %H:%M:%S %z",
                "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            continue
    return None


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def poll_once() -> int:
    """Run one full polling pass over every feed. Returns # signals added."""
    cp = load_checkpoints()
    total = 0
    for fid in FEEDS:
        items = fetch_feed(fid)
        last = cp.get(fid)
        new_items: list[FeedItem] = []
        for it in items:
            if it.guid == last:
                break
            new_items.append(it)
        if items:
            cp[fid] = items[0].guid  # newest first in EDGAR/RSS conventions
        log.info("%s: %d items, %d new", fid, len(items), len(new_items))
        for it in new_items:
            total += emit_signals(it)
    save_checkpoints(cp)
    log.info("Poll cycle complete — %d signals added.", total)
    return total


def watch(interval: float = 600.0) -> None:
    log.info("Watch loop starting (every %.0fs)…", interval)
    while True:
        try:
            poll_once()
        except KeyboardInterrupt:
            log.info("interrupted; stopping watch loop")
            return
        except Exception as e:
            log.error("poll cycle error: %s", e)
        time.sleep(interval)


def main() -> None:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("once")
    w = sub.add_parser("watch")
    w.add_argument("-i", "--interval", type=float, default=600.0)
    p.add_argument("-v", "--verbose", action="store_true")
    args = p.parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    )
    if args.cmd == "once":
        poll_once()
    else:
        watch(interval=args.interval)


if __name__ == "__main__":
    main()
