"""Offline smoke test — verifies pure logic without network access.

Run: `python -m pipeline.test_smoke`
"""
from __future__ import annotations
import tempfile
from pathlib import Path

from . import db, domains, enrich, feeds, linkedin_score, officers, verify


def test_db_schema():
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "test.db"
        with db.cursor(path) as cur:
            db.upsert_company(cur, "0000001", "TEST", "Test Co.",
                              exchange="Nasdaq", market_cap=12_000_000)
            db.add_signal(cur, "0000001", "NT-10K", 30, "https://example",
                          "2026-04-15")
        with db.cursor(path) as cur:
            cur.execute("SELECT * FROM companies WHERE cik='0000001'")
            row = cur.fetchone()
            assert row["ticker"] == "TEST"
            assert row["market_cap"] == 12_000_000
            cur.execute("SELECT SUM(score_delta) AS s FROM signals WHERE cik='0000001'")
            assert cur.fetchone()["s"] == 30
    print("  db schema OK")


def test_name_split():
    cases = {
        "Dr. Iraj Ali": ("iraj", "ali"),
        "George Lasezkay, PharmD, JD": ("george", "lasezkay"),
        "Mai-Britt Zocca, Ph.D.": ("mai-britt", "zocca"),
        "Lee-Lean Shu": ("lee-lean", "shu"),
        "Robert Antokol": ("robert", "antokol"),
    }
    for full, want in cases.items():
        got = enrich.split_name(full)
        assert got == want, f"split_name({full!r}) = {got}, want {want}"
    print("  name split OK")


def test_email_candidates():
    out = enrich.email_candidates("George Lasezkay", "clearsidebio.com")
    assert "george.lasezkay@clearsidebio.com" in out
    assert "glasezkay@clearsidebio.com" in out
    assert "george@clearsidebio.com" in out
    assert all("@clearsidebio.com" in e for e in out)
    print(f"  email candidates OK ({len(out)} patterns)")


def test_linkedin_search():
    url = enrich.linkedin_search_url("Jay Short", "BioAtla")
    assert url.startswith("https://www.google.com/search?q=")
    assert "linkedin.com" in url
    assert "Jay+Short" in url or "Jay%20Short" in url
    print("  linkedin url OK")


def test_ceo_extractor():
    """Stuff a tiny synthetic proxy snippet through extract_ceo()."""
    html = """
    <html><body><table>
      <tr><td>Name</td><td>Position</td></tr>
      <tr><td>Jane Q. Public</td><td>President and Chief Executive Officer</td></tr>
      <tr><td>John Doe</td><td>Chief Financial Officer</td></tr>
    </table></body></html>
    """
    name, conf = officers.extract_ceo(html)
    assert name == "Jane Q. Public", f"got {name!r}"
    assert conf >= 40
    print(f"  ceo extractor OK ({name}, conf={conf})")


def test_domain_blocklist():
    # IR/wire domains should never come back as company domains
    assert domains._domain_from_url("https://www.globenewswire.com/news/foo") is None
    assert domains._domain_from_url("https://investors.foo.com") == "investors.foo.com"
    # Multi-label blocklist match
    assert domains._scan_text_for_domain(
        "Visit us at https://investors.werewolftx.com for more"
    ) == "werewolftx.com"
    # Press-wire URLs should be skipped in favor of the company URL
    text = ("source: https://www.globenewswire.com/news/foo "
            "Visit our site at https://www.bioatla.com/")
    assert domains._scan_text_for_domain(text) == "bioatla.com"
    print("  domain blocklist OK")


def test_domain_heuristic():
    d, _ = domains.heuristic_from_name("Werewolf Therapeutics, Inc.")
    assert d == "werewolf.com", d
    d, _ = domains.heuristic_from_name("BioAtla, Inc.")
    assert d == "bioatla.com", d
    d, _ = domains.heuristic_from_name("X")
    assert d is None
    print("  domain heuristic OK")


def test_verify_syntax():
    assert verify.syntax_ok("a.b@c.io")
    assert not verify.syntax_ok("not an email")
    assert not verify.syntax_ok("")
    r = verify.verify("definitely not valid", do_smtp=False)
    assert r.verdict == "bad_syntax", r
    print("  verify syntax OK")


def test_linkedin_score():
    # Exact first+last name match → high confidence
    s = linkedin_score.score_match("John Smith", "https://linkedin.com/in/john-smith")
    assert s >= 70, f"expected >= 70, got {s}"
    # Google search URL → low score
    s = linkedin_score.score_match("John Smith", "https://www.google.com/search?q=john+smith+linkedin")
    assert s <= 20, f"expected <= 20, got {s}"
    # Slug has no name tokens → very low
    s = linkedin_score.score_match("John Smith", "https://linkedin.com/in/xyz-abc-999")
    assert s <= 15, f"expected <= 15, got {s}"
    # Empty URL → 0
    assert linkedin_score.score_match("John Smith", "") == 0
    print("  linkedin score OK")


def test_feed_parsers():
    atom = """<?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <id>tag:edgar,2026:e1</id>
        <title>BIOATLA INC (Ticker: BCAB) — 8-K filing</title>
        <link href="https://www.sec.gov/Archives/edgar/data/1815776/foo.htm"/>
        <updated>2026-04-15T12:00:00Z</updated>
        <summary>Item 3.01 deficiency notice received</summary>
      </entry>
    </feed>"""
    items = feeds.parse_atom(atom, "edgar_8k")
    assert len(items) == 1
    assert items[0].guid.endswith("e1")
    assert "BIOATLA" in items[0].title

    rss = """<?xml version="1.0"?>
    <rss><channel>
      <item>
        <title>SUNation Energy Announces Strategic Alternatives Review (SUNE)</title>
        <link>https://www.globenewswire.com/news/123</link>
        <guid>g1</guid>
        <description>The Board authorized a review of strategic alternatives.</description>
        <pubDate>Thu, 09 Apr 2026 10:00:00 +0000</pubDate>
      </item>
    </channel></rss>"""
    rss_items = feeds.parse_rss(rss, "globenewswire")
    assert len(rss_items) == 1
    assert "SUNation" in rss_items[0].title

    # Keyword regex hits
    matches = [(label, w) for rx, label, w in feeds.KEYWORD_SIGNALS
               if rx.search(rss_items[0].summary)]
    assert any(m[0] == "strategic_alternatives" for m in matches)
    print(f"  feed parsers OK ({len(items)} atom, {len(rss_items)} rss)")


def main():
    print("Running offline smoke tests...")
    test_db_schema()
    test_name_split()
    test_email_candidates()
    test_linkedin_search()
    test_ceo_extractor()
    test_domain_blocklist()
    test_domain_heuristic()
    test_verify_syntax()
    test_linkedin_score()
    test_feed_parsers()
    print("\nAll smoke tests passed.")


if __name__ == "__main__":
    main()
