"""SQLite schema + helpers for the micro-cap CEO contact DB."""
from __future__ import annotations
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "ceos.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS companies (
    cik         TEXT PRIMARY KEY,
    ticker      TEXT NOT NULL,
    name        TEXT NOT NULL,
    exchange    TEXT,
    sector      TEXT,
    market_cap  REAL,
    last_price  REAL,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_companies_ticker ON companies(ticker);
CREATE INDEX IF NOT EXISTS idx_companies_mktcap ON companies(market_cap);

CREATE TABLE IF NOT EXISTS ceos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    cik             TEXT NOT NULL,
    name            TEXT NOT NULL,
    title           TEXT,
    source_filing   TEXT,
    confidence      REAL,
    is_current      INTEGER DEFAULT 1,
    captured_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(cik) REFERENCES companies(cik)
);
CREATE INDEX IF NOT EXISTS idx_ceos_cik ON ceos(cik);

CREATE TABLE IF NOT EXISTS contacts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ceo_id          INTEGER NOT NULL,
    channel         TEXT NOT NULL,        -- 'email' | 'linkedin'
    value           TEXT NOT NULL,
    source          TEXT,                 -- 'pattern' | 'hunter' | 'rocketreach' | 'manual'
    score           REAL,                 -- 0..100
    verified_at     TIMESTAMP,
    captured_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ceo_id) REFERENCES ceos(id)
);
CREATE INDEX IF NOT EXISTS idx_contacts_ceo ON contacts(ceo_id);
CREATE INDEX IF NOT EXISTS idx_contacts_value ON contacts(value);

CREATE TABLE IF NOT EXISTS signals (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    cik             TEXT NOT NULL,
    signal_type     TEXT NOT NULL,        -- 'NT-10K' | 'deficiency' | 'going_concern' | 'strategic_alternatives' | ...
    score_delta     REAL NOT NULL,
    evidence_url    TEXT,
    filing_date     DATE,
    captured_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(cik) REFERENCES companies(cik)
);
CREATE INDEX IF NOT EXISTS idx_signals_cik ON signals(cik);
CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(signal_type);

CREATE VIEW IF NOT EXISTS v_hot_prospects AS
SELECT
    c.ticker, c.name, c.market_cap,
    COALESCE(SUM(s.score_delta), 0) AS delinquency_score,
    GROUP_CONCAT(DISTINCT s.signal_type) AS signal_types
FROM companies c
LEFT JOIN signals s ON s.cik = c.cik
WHERE c.market_cap IS NOT NULL AND c.market_cap < 25000000
GROUP BY c.cik
HAVING delinquency_score >= 40
ORDER BY delinquency_score DESC;
"""


def connect(db_path: Path | str = DB_PATH) -> sqlite3.Connection:
    db_path = Path(db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn


@contextmanager
def cursor(db_path: Path | str = DB_PATH):
    conn = connect(db_path)
    try:
        yield conn.cursor()
        conn.commit()
    finally:
        conn.close()


def upsert_company(cur, cik: str, ticker: str, name: str,
                   exchange: str | None = None, sector: str | None = None,
                   market_cap: float | None = None, last_price: float | None = None) -> None:
    cur.execute("""
        INSERT INTO companies (cik, ticker, name, exchange, sector, market_cap, last_price, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(cik) DO UPDATE SET
            ticker=excluded.ticker, name=excluded.name,
            exchange=COALESCE(excluded.exchange, exchange),
            sector=COALESCE(excluded.sector, sector),
            market_cap=COALESCE(excluded.market_cap, market_cap),
            last_price=COALESCE(excluded.last_price, last_price),
            updated_at=CURRENT_TIMESTAMP
    """, (cik, ticker, name, exchange, sector, market_cap, last_price))


def add_signal(cur, cik: str, signal_type: str, score_delta: float,
               evidence_url: str | None = None, filing_date: str | None = None) -> None:
    cur.execute("""
        INSERT INTO signals (cik, signal_type, score_delta, evidence_url, filing_date)
        VALUES (?, ?, ?, ?, ?)
    """, (cik, signal_type, score_delta, evidence_url, filing_date))
