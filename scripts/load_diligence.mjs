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
const PROVIDERS = path.join(ROOT, "src", "data", "diligence", "providers.json");
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
  "provider_requirement",
  "provider_extra",
  "capital_provider",
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

// Providers + requirement mappings.
const providers = JSON.parse(fs.readFileSync(PROVIDERS, "utf8"));
const insProvider = db.prepare(
  `INSERT INTO capital_provider (id, name, type, stage, eligibility, terms, fee_model, source_url)
   VALUES (@id, @name, @type, @stage, @eligibility, @terms, @fee_model, @source_url)`
);
const insReq = db.prepare(`INSERT OR IGNORE INTO provider_requirement (provider_id, item_id) VALUES (?, ?)`);
const insExtra = db.prepare(`INSERT INTO provider_extra (provider_id, extra) VALUES (?, ?)`);
const validItemIds = new Set(catalog.items.map((i) => i.id));
const danglingRefs = [];

const loadProviders = db.transaction((list) => {
  for (const p of list) {
    insProvider.run({
      id: p.id,
      name: p.name,
      type: p.type,
      stage: JSON.stringify(p.stage ?? []),
      eligibility: JSON.stringify(p.eligibility ?? {}),
      terms: p.terms ?? null,
      fee_model: p.fee_model ?? null,
      source_url: p.source_url ?? null,
    });
    for (const itemId of p.required_item_ids ?? []) {
      if (!validItemIds.has(itemId)) danglingRefs.push(`${p.id} -> ${itemId}`);
      else insReq.run(p.id, itemId);
    }
    for (const x of p.provider_extras ?? []) insExtra.run(p.id, x);
  }
});
loadProviders(providers.providers);

const count = db.prepare("SELECT COUNT(*) n FROM diligence_item").get().n;
const byCat = db
  .prepare("SELECT category, COUNT(*) n FROM diligence_item GROUP BY category ORDER BY n DESC")
  .all();
const auto = db
  .prepare("SELECT auto_preparable, COUNT(*) n FROM diligence_item GROUP BY auto_preparable")
  .all();

const provCount = db.prepare("SELECT COUNT(*) n FROM capital_provider").get().n;
const reqCount = db.prepare("SELECT COUNT(*) n FROM provider_requirement").get().n;

console.log(`Loaded ${count} diligence items into ${path.relative(ROOT, OUT)}`);
console.log("By category:", byCat.map((r) => `${r.category}=${r.n}`).join(", "));
console.log("Automation:", auto.map((r) => `${r.auto_preparable}=${r.n}`).join(", "));
console.log(`Loaded ${provCount} capital providers with ${reqCount} requirement mappings.`);
if (danglingRefs.length) {
  console.warn(`WARNING: ${danglingRefs.length} provider->item refs point to unknown item ids:`);
  console.warn(danglingRefs.join("\n"));
}

db.close();
