"""Score confidence that a LinkedIn URL belongs to a given CEO.

Scoring is purely offline — no HTTP requests. It compares:
  - Name token overlap between the CEO's name and the LinkedIn slug
  - Whether the URL is an actual profile vs. a Google search redirect

Run as a pipeline step:
    python -m pipeline.main linkedin-score
"""
from __future__ import annotations
import re
from pathlib import Path


def _tokens(text: str) -> set[str]:
    """Lowercase alphabetic tokens of length >= 2."""
    return {t for t in re.split(r"[\s\-_]+", text.lower()) if len(t) >= 2 and t.isalpha()}


def score_match(ceo_name: str, linkedin_url: str) -> int:
    """Return 0-100 confidence that linkedin_url is the profile for ceo_name.

    Heuristic only — no network access required.
    """
    if not linkedin_url:
        return 0
    if "google.com" in linkedin_url:
        return 15  # generated search URL, not a confirmed profile
    if "linkedin.com" not in linkedin_url:
        return 5

    m = re.search(r"/in/([^/?#\s]+)", linkedin_url)
    if not m:
        return 20  # company page or malformed URL

    slug_tokens = _tokens(m.group(1))
    name_tokens = _tokens(ceo_name)

    if not name_tokens:
        return 20

    overlap = name_tokens & slug_tokens
    if not overlap:
        return 10

    # Both first and last name appear in slug → strong match
    if len(overlap) >= 2:
        return min(95, 70 + len(overlap) * 5)

    # One name token matched
    frac = len(overlap) / len(name_tokens)
    return min(60, int(30 + frac * 40))


def update_scores(db_path: Path | None = None) -> int:
    """Recompute linkedin contact scores for all non-manual linkedin contacts.

    Returns the number of rows updated.
    """
    from . import db as dbmod

    path = db_path or dbmod.DB_PATH
    with dbmod.cursor(path) as cur:
        cur.execute(
            """
            SELECT ct.id, ct.value, ceo.name
            FROM contacts ct
            JOIN ceos ceo ON ceo.id = ct.ceo_id
            WHERE ct.channel = 'linkedin' AND ct.source != 'manual'
            """
        )
        rows = cur.fetchall()
        count = 0
        for row in rows:
            s = score_match(row["name"], row["value"])
            cur.execute("UPDATE contacts SET score=? WHERE id=?", (s, row["id"]))
            count += 1
    return count
