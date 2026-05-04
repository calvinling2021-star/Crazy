"""
Seed the CEO intelligence database from the hand-compiled prospect list.

Run:  python -m pipeline.seed_demo

Populates companies, signals, CEOs, and all known email + LinkedIn contacts
for 11 confirmed micro-cap hot prospects (market cap < $25M) from the
CEO_Contacts_Strategic_Alternatives_v2.xlsx research file.

Safe to re-run: uses upsert / INSERT OR IGNORE throughout.
"""
from __future__ import annotations
import sys
from pathlib import Path

# Allow running as a script directly
sys.path.insert(0, str(Path(__file__).parent.parent))

from pipeline import db
from pipeline.enrich import email_candidates, split_name

# ──────────────────────────────────────────────────────────────────────────────
# 1.  Prospect data
#     Fields: (cik, ticker, exchange, name, sector, market_cap,
#              ceo_name, ceo_title,
#              domain, confirmed_email,       # None = use pattern only
#              linkedin_url,                  # None = no known profile
#              signals)                       # list of (signal_type, score_delta, date)
# ──────────────────────────────────────────────────────────────────────────────

PROSPECTS = [
    (
        "0001739566", "ATER", "Nasdaq",
        "Aterian, Inc.", "E-Commerce / Consumer Brands", 6_100_000,
        "Arturo Rodriguez", "Chief Executive Officer",
        "aterian.io", "arturo@aterian.io",
        "https://www.linkedin.com/in/arturorodriguezcpa/",
        [
            ("strategic_alternatives", 10, "2025-12-08"),
            ("NT-10K",                 30, "2026-02-15"),
            ("going_concern",          20, "2026-01-10"),
        ],
    ),
    (
        "0001815776", "BCAB", "Nasdaq",
        "BioAtla, Inc.", "Biotech / Oncology", 18_700_000,
        "Jay M. Short", "President and Chief Executive Officer",
        "bioatla.com", None,
        "https://www.linkedin.com/in/jay-short-5244171/",
        [
            ("strategic_alternatives", 10, "2026-03-02"),
            ("NT-10K",                 30, "2026-02-20"),
            ("auditor_change",         15, "2025-11-05"),
        ],
    ),
    (
        "0001624823", "CLSD", "Nasdaq",
        "Clearside Biomedical, Inc.", "Biotech / Ophthalmology", 20_000_000,
        "George Lasezkay", "President and Chief Executive Officer",
        "clearsidebio.com", None,
        "https://www.linkedin.com/in/george-lasezkay-1848679/",
        [
            ("strategic_alternatives", 10, "2025-07-10"),
            ("NT-10K",                 30, "2026-01-15"),
            ("going_concern",          20, "2026-01-15"),
        ],
    ),
    (
        "0001801392", "ACHL", "Nasdaq",
        "Achilles Therapeutics plc", "Biotech / TIL Oncology", 10_000_000,
        "Dr. Iraj Ali", "Chief Executive Officer",
        "achillestx.com", None,
        "https://www.linkedin.com/in/iraj-ali-0b57621",
        [
            ("strategic_alternatives", 10, "2024-09-19"),
            ("NT-10K",                 30, "2025-04-01"),
            ("going_concern",          20, "2025-04-01"),
        ],
    ),
    (
        "0001828748", "SNSE", "Nasdaq",
        "Sensei Biotherapeutics, Inc.", "Biotech / Immuno-oncology", 15_000_000,
        "Christopher W. Gerry", "President and Chief Executive Officer",
        "senseibio.com", None,
        "https://www.linkedin.com/company/sensei-bio",
        [
            ("strategic_alternatives", 10, "2025-10-30"),
            ("NT-10K",                 30, "2026-02-28"),
            ("auditor_change",         15, "2025-12-01"),
        ],
    ),
    (
        "0001888649", "SUNE", "Nasdaq",
        "SUNation Energy, Inc.", "Clean Energy / Residential Solar", 5_200_000,
        "Scott Maskin", "Chief Executive Officer",
        "sunation.com", None,
        "https://www.linkedin.com/in/scott-maskin-b3980522/",
        [
            ("strategic_alternatives", 10, "2026-04-09"),
            ("NT-10K",                 30, "2026-03-10"),
            ("deficiency",             25, "2025-12-15"),
        ],
    ),
    (
        "0001907982", "BNBX", "Nasdaq",
        "BNB Plus Corp.", "Digital Asset / Treasury", 3_600_000,
        "Clay Shorrock", "Chief Executive Officer",
        "icrinc.com", None,
        "https://www.linkedin.com/in/clay-shorrock-esq/",
        [
            ("strategic_alternatives", 10, "2026-04-01"),
            ("deficiency",             25, "2026-02-01"),
            ("NT-10K",                 30, "2026-03-01"),
        ],
    ),
    (
        "0001001792", "ASTC", "Nasdaq",
        "Astrotech Corporation", "Technology / Chemical Detection", 6_100_000,
        "Thomas B. Pickens III", "Chief Executive Officer",
        "aglab.com", None,
        "https://www.linkedin.com/in/thomas-b-pickens-iii/",
        [
            ("strategic_alternatives", 10, "2025-11-19"),
            ("NT-10K",                 30, "2026-02-01"),
            ("going_concern",          20, "2025-10-01"),
        ],
    ),
    (
        "0001679379", "HOOK", "Nasdaq",
        "HOOKIPA Pharma Inc.", "Biotech / Infectious Disease & Cancer", 11_000_000,
        "Dr. Malte Peters", "Chief Executive Officer",
        "hookipapharma.com", None,
        "https://www.linkedin.com/in/malte-peters-55111510/",
        [
            ("strategic_alternatives", 10, "2025-06-01"),
            ("going_concern",          20, "2025-04-01"),
            ("NT-10K",                 30, "2025-11-01"),
            ("auditor_change",         15, "2025-09-01"),
        ],
    ),
    (
        "0001823549", "IOBT", "Nasdaq",
        "IO Biotech, Inc.", "Biotech / TIL Cancer Immunotherapy", 3_500_000,
        "Mai-Britt Zocca", "Chief Executive Officer",
        "iobiotech.com", None,
        "https://www.linkedin.com/in/mai-britt-zocca-66b70b6",
        [
            ("strategic_alternatives", 10, "2026-01-21"),
            ("going_concern",          20, "2026-01-21"),
            ("NT-10K",                 30, "2026-03-01"),
        ],
    ),
    (
        "0001801282", "CARM", "Nasdaq",
        "Carisma Therapeutics Inc.", "Biotech / CAR-M Oncology", 6_400_000,
        "Steven Kelly", "Chief Executive Officer",
        "carismatx.com", None,
        "https://www.linkedin.com/in/skelly5",
        [
            ("strategic_alternatives", 10, "2025-03-25"),
            ("going_concern",          20, "2025-04-01"),
            ("NT-10K",                 30, "2025-06-01"),
            ("deficiency",             25, "2025-07-01"),
        ],
    ),
]

SIGNAL_NOTES = {
    "ATER":  "Signed $18M deal to sell brand portfolio to Trademark Global; CEO transition underway",
    "BCAB":  "70% workforce cut; Tungsten Advisors as exclusive advisor",
    "CLSD":  "Exploring sale/license of SCS platform; Piper Sandler as advisor",
    "ACHL":  "Discontinued cNeT TIL program; BofA Securities as advisor",
    "SNSE":  "65% workforce cut; board/CEO reshuffle; Anand Parikh incoming CEO",
    "SUNE":  "Exploring sale, business combinations, divestitures; debt→equity conversion",
    "BNBX":  "Treasury ~$12.2M (3.4x market cap); also has Nasdaq compliance issue",
    "ASTC":  "Exploring equity raise, reverse mergers, combination transactions",
    "HOOK":  "Sold HB-400/500 assets to Gilead; Nasdaq delisting & dissolution vote pending",
    "IOBT":  "Filed Chapter 7 bankruptcy Mar 31, 2026; Raymond James as advisor",
    "CARM":  "Delisted from Nasdaq Oct 2025; 95% staff laid off",
}


# ──────────────────────────────────────────────────────────────────────────────
# 2.  Seeding logic
# ──────────────────────────────────────────────────────────────────────────────

def seed() -> None:
    conn = db.connect()
    cur = conn.cursor()

    total_companies = total_ceos = total_contacts = total_signals = 0

    for row in PROSPECTS:
        (cik, ticker, exchange, name, sector, market_cap,
         ceo_name, ceo_title, domain, confirmed_email,
         linkedin_url, signals) = row

        # ── Company ──────────────────────────────────────────────────────────
        db.upsert_company(cur, cik, ticker, name,
                          exchange=exchange, sector=sector,
                          market_cap=market_cap)
        total_companies += 1

        # ── Signals ──────────────────────────────────────────────────────────
        for sig_type, delta, date in signals:
            db.add_signal(cur, cik, sig_type, delta, filing_date=date)
            total_signals += 1

        # ── CEO ──────────────────────────────────────────────────────────────
        # Check if we already have a current CEO record for this CIK
        cur.execute(
            "SELECT id FROM ceos WHERE cik=? AND is_current=1 ORDER BY id DESC LIMIT 1",
            (cik,)
        )
        existing = cur.fetchone()
        if existing:
            ceo_id = existing["id"]
            # Update notes with strategic context
            note = SIGNAL_NOTES.get(ticker, "")
            cur.execute("UPDATE ceos SET notes=? WHERE id=?", (note, ceo_id))
        else:
            note = SIGNAL_NOTES.get(ticker, "")
            cur.execute(
                """INSERT INTO ceos (cik, name, title, confidence, is_current, notes)
                   VALUES (?, ?, ?, 90, 1, ?)""",
                (cik, ceo_name, ceo_title, note),
            )
            ceo_id = cur.lastrowid
            total_ceos += 1

        # ── Contacts: LinkedIn ───────────────────────────────────────────────
        if linkedin_url:
            cur.execute(
                "SELECT id FROM contacts WHERE ceo_id=? AND channel='linkedin' AND value=?",
                (ceo_id, linkedin_url),
            )
            if not cur.fetchone():
                from pipeline import linkedin_score
                score = linkedin_score.score_match(ceo_name, linkedin_url)
                cur.execute(
                    """INSERT INTO contacts (ceo_id, channel, value, source, score)
                       VALUES (?, 'linkedin', ?, 'manual', ?)""",
                    (ceo_id, linkedin_url, score),
                )
                total_contacts += 1

        # ── Contacts: Confirmed email ─────────────────────────────────────────
        if confirmed_email:
            cur.execute(
                "SELECT id FROM contacts WHERE ceo_id=? AND channel='email' AND value=?",
                (ceo_id, confirmed_email),
            )
            if not cur.fetchone():
                cur.execute(
                    """INSERT INTO contacts (ceo_id, channel, value, source, score)
                       VALUES (?, 'email', ?, 'manual', 100)""",
                    (ceo_id, confirmed_email),
                )
                total_contacts += 1

        # ── Contacts: Pattern emails ──────────────────────────────────────────
        for email in email_candidates(ceo_name, domain):
            if confirmed_email and email == confirmed_email:
                continue  # don't duplicate the confirmed one
            cur.execute(
                "SELECT id FROM contacts WHERE ceo_id=? AND channel='email' AND value=?",
                (ceo_id, email),
            )
            if not cur.fetchone():
                cur.execute(
                    """INSERT INTO contacts (ceo_id, channel, value, source, score)
                       VALUES (?, 'email', ?, 'pattern', 40)""",
                    (ceo_id, email),
                )
                total_contacts += 1

        conn.commit()

    conn.close()
    print(f"\n✓ Seeded {total_companies} companies, {total_ceos} CEOs, "
          f"{total_contacts} contacts, {total_signals} signals")
    print("\nHot prospects in DB:")
    _print_summary()


def _print_summary() -> None:
    conn = db.connect()
    cur = conn.cursor()
    cur.execute("""
        SELECT c.ticker, c.name, c.market_cap,
               COALESCE(SUM(s.score_delta),0) AS score,
               GROUP_CONCAT(DISTINCT s.signal_type) AS sigs,
               ceo.name AS ceo_name,
               (SELECT value FROM contacts
                WHERE ceo_id=ceo.id AND channel='email'
                  AND source='manual' LIMIT 1) AS confirmed_email,
               (SELECT COUNT(*) FROM contacts
                WHERE ceo_id=ceo.id AND channel='email') AS email_count,
               (SELECT value FROM contacts
                WHERE ceo_id=ceo.id AND channel='linkedin' LIMIT 1) AS linkedin
        FROM companies c
        LEFT JOIN signals s ON s.cik=c.cik
        LEFT JOIN ceos ceo ON ceo.cik=c.cik AND ceo.is_current=1
        WHERE c.market_cap < 25000000
        GROUP BY c.cik
        HAVING score >= 40
        ORDER BY score DESC
    """)
    rows = cur.fetchall()
    conn.close()
    print(f"\n{'Ticker':<6} {'Score':>5}  {'Mkt Cap':>8}  {'CEO':<28}  {'Email':>5} {'Confirmed Email / Pattern'}")
    print("─" * 110)
    for r in rows:
        cap = f"${r['market_cap']/1e6:.1f}M"
        email_disp = r["confirmed_email"] or f"({r['email_count']} patterns)"
        linkedin_disp = "✓ LinkedIn" if r["linkedin"] else "—"
        print(f"{r['ticker']:<6} {int(r['score']):>5}  {cap:>8}  {(r['ceo_name'] or 'Unknown'):<28}  "
              f"{linkedin_disp:<12}  {email_disp}")


if __name__ == "__main__":
    seed()
