-- Capital Trust Center — Due-Diligence Catalog schema (SQLite).
-- Materialized from catalog.json by scripts/load_diligence.mjs.
-- Drives automation: assemble the checklist for a given capital source + stage,
-- then auto-prepare each item from connected data feeds and platform modules.

PRAGMA journal_mode = WAL;

-- One row per distinct diligence item.
CREATE TABLE IF NOT EXISTS diligence_item (
  id              TEXT PRIMARY KEY,
  item            TEXT NOT NULL,
  category        TEXT NOT NULL,
  description     TEXT NOT NULL,
  auto_preparable TEXT NOT NULL CHECK (auto_preparable IN ('full','partial','manual')),
  human_signoff   INTEGER NOT NULL DEFAULT 0 CHECK (human_signoff IN (0,1)),
  notes           TEXT
);

-- Which capital providers request the item (many-to-many).
CREATE TABLE IF NOT EXISTS item_capital_source (
  item_id        TEXT NOT NULL REFERENCES diligence_item(id) ON DELETE CASCADE,
  capital_source TEXT NOT NULL, -- lender | vc | pe | ma | ipo
  PRIMARY KEY (item_id, capital_source)
);

-- Financing stages/types that need the item (free-form tags).
CREATE TABLE IF NOT EXISTS item_stage (
  item_id TEXT NOT NULL REFERENCES diligence_item(id) ON DELETE CASCADE,
  stage   TEXT NOT NULL,
  PRIMARY KEY (item_id, stage)
);

-- Where the underlying data lives (drives the connector / auto-prep path).
CREATE TABLE IF NOT EXISTS item_data_source (
  item_id     TEXT NOT NULL REFERENCES diligence_item(id) ON DELETE CASCADE,
  data_source TEXT NOT NULL,
  PRIMARY KEY (item_id, data_source)
);

-- Which platform module/agent produces the item.
CREATE TABLE IF NOT EXISTS item_produced_by (
  item_id     TEXT NOT NULL REFERENCES diligence_item(id) ON DELETE CASCADE,
  produced_by TEXT NOT NULL,
  PRIMARY KEY (item_id, produced_by)
);

-- Provenance for the catalog itself (source URLs).
CREATE TABLE IF NOT EXISTS item_source_url (
  item_id TEXT NOT NULL REFERENCES diligence_item(id) ON DELETE CASCADE,
  url     TEXT NOT NULL,
  PRIMARY KEY (item_id, url)
);

CREATE INDEX IF NOT EXISTS idx_item_category ON diligence_item(category);
CREATE INDEX IF NOT EXISTS idx_item_auto ON diligence_item(auto_preparable);
CREATE INDEX IF NOT EXISTS idx_ics_source ON item_capital_source(capital_source);

-- Example: assemble the checklist for a Series A VC raise, with automation coverage.
--   SELECT di.id, di.item, di.category, di.auto_preparable
--   FROM diligence_item di
--   JOIN item_capital_source ics ON ics.item_id = di.id AND ics.capital_source = 'vc'
--   JOIN item_stage st ON st.item_id = di.id AND st.stage = 'series_a'
--   ORDER BY di.category, di.id;
