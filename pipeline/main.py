"""Top-level orchestrator + CSV/XLSX export.

Examples:
    # Full daily refresh (everything end-to-end)
    python -m pipeline.main daily --max-cap 25000000

    # Just rebuild universe
    python -m pipeline.main universe --max-cap 25000000 --limit 200

    # Score signals on an already-built universe
    python -m pipeline.main signals

    # Extract CEOs
    python -m pipeline.main officers

    # Enrich emails / LinkedIn
    python -m pipeline.main enrich

    # Export the hot-prospect list to xlsx
    python -m pipeline.main export --out hot_prospects.xlsx
"""
from __future__ import annotations
import argparse
import logging
from pathlib import Path

from . import db, universe, delinquency, officers, enrich


def cmd_universe(args):
    universe.build_universe(max_cap=args.max_cap, limit=args.limit, workers=args.workers)


def cmd_signals(args):
    delinquency.score_universe(limit=args.limit)


def cmd_officers(args):
    officers.run(limit=args.limit)


def cmd_enrich(args):
    enrich.run(limit=args.limit)


def cmd_daily(args):
    universe.build_universe(max_cap=args.max_cap, limit=args.limit, workers=args.workers)
    delinquency.score_universe(limit=args.limit)
    officers.run(limit=args.limit)
    enrich.run(limit=args.limit)
    cmd_export(argparse.Namespace(out=str(Path("pipeline/data") / "hot_prospects.xlsx"),
                                   min_score=0, hot_only=False))


def cmd_export(args):
    """Export the joined CEO + contact + signal data to an XLSX file."""
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    where = "WHERE c.market_cap < 25000000"
    having = ""
    if args.hot_only:
        having = "HAVING delinquency_score >= 40"
    elif args.min_score:
        having = f"HAVING delinquency_score >= {args.min_score}"

    sql = f"""
        SELECT
            c.ticker, c.name AS company, c.exchange, c.sector,
            c.market_cap,
            COALESCE(SUM(DISTINCT s.score_delta), 0) AS delinquency_score,
            (SELECT GROUP_CONCAT(DISTINCT signal_type)
               FROM signals WHERE cik = c.cik) AS signal_types,
            (SELECT name FROM ceos
               WHERE cik = c.cik AND is_current = 1
               ORDER BY id DESC LIMIT 1) AS ceo_name,
            (SELECT confidence FROM ceos
               WHERE cik = c.cik AND is_current = 1
               ORDER BY id DESC LIMIT 1) AS ceo_conf,
            (SELECT GROUP_CONCAT(value, ' | ') FROM contacts
               WHERE channel = 'email' AND ceo_id IN
                 (SELECT id FROM ceos WHERE cik = c.cik AND is_current = 1)
               ) AS emails,
            (SELECT value FROM contacts
               WHERE channel = 'linkedin' AND ceo_id IN
                 (SELECT id FROM ceos WHERE cik = c.cik AND is_current = 1)
               LIMIT 1) AS linkedin
        FROM companies c
        LEFT JOIN signals s ON s.cik = c.cik
        {where}
        GROUP BY c.cik
        {having}
        ORDER BY delinquency_score DESC, c.market_cap ASC
    """

    with db.cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Hot Prospects"
    headers = ["Ticker", "Company", "Exchange", "Sector", "Market Cap",
               "Delinquency Score", "Signals", "CEO Name", "CEO Confidence",
               "Email Candidates", "LinkedIn Search"]
    for ci, h in enumerate(headers, 1):
        c = ws.cell(row=1, column=ci, value=h)
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="1F4E79")
        c.alignment = Alignment(horizontal="center")
    for ri, row in enumerate(rows, 2):
        ws.cell(row=ri, column=1, value=row["ticker"])
        ws.cell(row=ri, column=2, value=row["company"])
        ws.cell(row=ri, column=3, value=row["exchange"])
        ws.cell(row=ri, column=4, value=row["sector"])
        ws.cell(row=ri, column=5, value=row["market_cap"])
        ws.cell(row=ri, column=6, value=row["delinquency_score"])
        ws.cell(row=ri, column=7, value=row["signal_types"])
        ws.cell(row=ri, column=8, value=row["ceo_name"])
        ws.cell(row=ri, column=9, value=row["ceo_conf"])
        ws.cell(row=ri, column=10, value=row["emails"])
        ws.cell(row=ri, column=11, value=row["linkedin"])
    widths = [8, 30, 10, 22, 14, 12, 30, 28, 12, 50, 50]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[chr(64 + i)].width = w
    ws.freeze_panes = "A2"
    wb.save(out_path)
    print(f"Exported {len(rows)} rows -> {out_path}")


def main():
    p = argparse.ArgumentParser(description="Micro-cap CEO contact intelligence pipeline")
    p.add_argument("-v", "--verbose", action="store_true")
    sub = p.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("universe");  sp.add_argument("--max-cap", type=float, default=25_000_000); sp.add_argument("--limit", type=int); sp.add_argument("--workers", type=int, default=8); sp.set_defaults(func=cmd_universe)
    sp = sub.add_parser("signals");   sp.add_argument("--limit", type=int); sp.set_defaults(func=cmd_signals)
    sp = sub.add_parser("officers");  sp.add_argument("--limit", type=int); sp.set_defaults(func=cmd_officers)
    sp = sub.add_parser("enrich");    sp.add_argument("--limit", type=int); sp.set_defaults(func=cmd_enrich)
    sp = sub.add_parser("daily");     sp.add_argument("--max-cap", type=float, default=25_000_000); sp.add_argument("--limit", type=int); sp.add_argument("--workers", type=int, default=8); sp.set_defaults(func=cmd_daily)
    sp = sub.add_parser("export")
    sp.add_argument("--out", default="pipeline/data/hot_prospects.xlsx")
    sp.add_argument("--min-score", type=float, default=0)
    sp.add_argument("--hot-only", action="store_true")
    sp.set_defaults(func=cmd_export)

    args = p.parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    )
    args.func(args)


if __name__ == "__main__":
    main()
