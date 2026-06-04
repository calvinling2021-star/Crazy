#!/usr/bin/env node
// Load the due-diligence catalog (catalog.json) into a SQLite database.
//
// Usage:
//   node scripts/load_diligence.mjs [--out pipeline/data/diligence.db]
//
// Idempotent: drops & recreates rows from catalog.json each run.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CATALOG = path.join(ROOT, "src", "data", "diligence", "catalog.json");
const SCHEMA = path.join(ROOT, "src", "data", "diligence", "schema.sql");

const outArg = process.argv.indexOf("--out");
const OUT = outArg !== -1 ? process.argv[outArg + 1] : path.join(ROOT, "pipeline", "data", "diligence.db");

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const schema = fs.readFileSync(SCHEMA, "utf8");

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const db = new Database(OUT);
db.exec(schema);

// Clean slate so re-runs reflect the current catalog.
for (const t of [
  "item_capital_source",
  "item_stage",
  "item_data_source",
  "item_produced_by",
  "item_source_url",
  "diligence_item",
]) {
  db.exec(`DELETE FROM ${t};`);
}

const insItem = db.prepare(
  `INSERT INTO diligence_item (id, item, category, description, auto_preparable, human_signoff, notes)
   VALUES (@id, @item, @category, @description, @auto_preparable, @human_signoff, @notes)`
);
const insCS = db.prepare(`INSERT OR IGNORE INTO item_capital_source (item_id, capital_source) VALUES (?, ?)`);
const insStage = db.prepare(`INSERT OR IGNORE INTO item_stage (item_id, stage) VALUES (?, ?)`);
const insDS = db.prepare(`INSERT OR IGNORE INTO item_data_source (item_id, data_source) VALUES (?, ?)`);
const insPB = db.prepare(`INSERT OR IGNORE INTO item_produced_by (item_id, produced_by) VALUES (?, ?)`);
const insURL = db.prepare(`INSERT OR IGNORE INTO item_source_url (item_id, url) VALUES (?, ?)`);

const load = db.transaction((items) => {
  for (const it of items) {
    insItem.run({
      id: it.id,
      item: it.item,
      category: it.category,
      description: it.description,
      auto_preparable: it.auto_preparable,
      human_signoff: it.human_signoff ? 1 : 0,
      notes: it.notes ?? null,
    });
    for (const c of it.capital_sources ?? []) insCS.run(it.id, c);
    for (const s of it.stages ?? []) insStage.run(it.id, s);
    for (const d of it.data_source ?? []) insDS.run(it.id, d);
    for (const p of it.produced_by ?? []) insPB.run(it.id, p);
    for (const u of it.sources ?? []) insURL.run(it.id, u);
  }
});

load(catalog.items);

const count = db.prepare("SELECT COUNT(*) n FROM diligence_item").get().n;
const byCat = db
  .prepare("SELECT category, COUNT(*) n FROM diligence_item GROUP BY category ORDER BY n DESC")
  .all();
const auto = db
  .prepare("SELECT auto_preparable, COUNT(*) n FROM diligence_item GROUP BY auto_preparable")
  .all();

console.log(`Loaded ${count} diligence items into ${path.relative(ROOT, OUT)}`);
console.log("By category:", byCat.map((r) => `${r.category}=${r.n}`).join(", "));
console.log("Automation:", auto.map((r) => `${r.auto_preparable}=${r.n}`).join(", "));

db.close();
