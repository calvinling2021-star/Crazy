"""Offline smoke test — verifies pure logic without network access.

Run: `python -m pipeline.test_smoke`
"""
from __future__ import annotations
import tempfile
from pathlib import Path

from . import db, enrich, officers


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


def main():
    print("Running offline smoke tests...")
    test_db_schema()
    test_name_split()
    test_email_candidates()
    test_linkedin_search()
    test_ceo_extractor()
    print("\nAll smoke tests passed.")


if __name__ == "__main__":
    main()
