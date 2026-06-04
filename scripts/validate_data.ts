// Data validation for the diligence dataset (catalog.json + providers.json).
// Pure JSON checks (no SQLite) so it runs in CI: `npm run validate:data`.
// Exits non-zero on hard errors (broken refs, dup ids, bad enums, missing fields).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DIR = resolve(process.cwd(), "src/data/diligence");
const catalog = JSON.parse(readFileSync(resolve(DIR, "catalog.json"), "utf8"));
const providersDoc = JSON.parse(readFileSync(resolve(DIR, "providers.json"), "utf8"));

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

// --- enums (mirror src/data/diligence/types.ts) ---
const CATEGORIES = new Set(["Corporate/Legal","Financial","Quality of Earnings","Working Capital/Net Debt","Revenue/Metrics","Banking/Cash","Cap Table/Equity","Contracts/Commercial","Customers","IP","Product/Tech","Team/HR","Tax","Debt/Obligations","Collateral/UCC","KYC/AML","Insurance","Compliance/Data Privacy","Market","Fundraising History","Operations","Other"]);
const DATA_SOURCE = new Set(["revenue_rails","bank_feed","accounting_gl","cap_table","expense","board_consents","legal_docs","contracts","hr_system","product_analytics","tax_filings","insurance","founder_input","external_partner"]);
const PRODUCED_BY = new Set(["revenue_truth","audit_automation","cap_table","expense","legal_stack","data_room","scoring","manual"]);
const AUTO = new Set(["full","partial","manual"]);
const CAPITAL_SOURCES = new Set(["lender","vc","pe","ma","ipo"]);
// Provider types the debt-wedge matcher (src/lib/cdp/capital.ts) understands:
const DEBT_TYPES = new Set(["rbf","venture_debt","startup_bank","smb_lender","bank","sba","grant"]);

// ---------- catalog ----------
const items: any[] = catalog.items || [];
const itemIds = new Set<string>();
if (!Array.isArray(items) || items.length === 0) err("catalog.items is empty or not an array");
if (!catalog.version) warn("catalog.version missing");

for (const [i, it] of items.entries()) {
  const at = `catalog[${i}] ${it?.id ?? "?"}`;
  if (!it.id) err(`${at}: missing id`);
  else if (itemIds.has(it.id)) err(`${at}: duplicate id`);
  else itemIds.add(it.id);
  if (!it.item) err(`${at}: missing 'item' text`);
  if (!it.description) warn(`${at}: missing description`);
  if (!CATEGORIES.has(it.category)) err(`${at}: bad category '${it.category}'`);
  if (!AUTO.has(it.auto_preparable)) err(`${at}: bad auto_preparable '${it.auto_preparable}'`);
  if (typeof it.human_signoff !== "boolean") err(`${at}: human_signoff must be boolean`);
  for (const c of it.capital_sources ?? []) if (!CAPITAL_SOURCES.has(c)) err(`${at}: bad capital_source '${c}'`);
  for (const d of it.data_source ?? []) if (!DATA_SOURCE.has(d)) err(`${at}: bad data_source '${d}'`);
  for (const p of it.produced_by ?? []) if (!PRODUCED_BY.has(p)) err(`${at}: bad produced_by '${p}'`);
  if (!(it.produced_by?.length)) warn(`${at}: no produced_by`);
}

// ---------- providers ----------
const providers: any[] = providersDoc.providers || [];
const provIds = new Set<string>();
let totalReqs = 0;
let danglingRefs = 0;
const typeCounts: Record<string, number> = {};
const referenced = new Set<string>();

if (!Array.isArray(providers) || providers.length === 0) err("providers.providers is empty or not an array");

for (const [i, p] of providers.entries()) {
  const at = `provider[${i}] ${p?.id ?? "?"}`;
  if (!p.id) err(`${at}: missing id`);
  else if (provIds.has(p.id)) err(`${at}: duplicate id`);
  else provIds.add(p.id);
  if (!p.name) err(`${at}: missing name`);
  if (!p.type) err(`${at}: missing type`);
  else typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
  if (p.eligibility && typeof p.eligibility !== "object") err(`${at}: eligibility must be an object`);

  const reqs: string[] = p.required_item_ids ?? [];
  if (reqs.length === 0) warn(`${at} (${p.type}): has 0 required_item_ids`);
  const seen = new Set<string>();
  for (const id of reqs) {
    totalReqs++;
    if (seen.has(id)) warn(`${at}: duplicate required_item_id '${id}'`);
    seen.add(id);
    if (!itemIds.has(id)) { err(`${at}: required_item_id '${id}' not found in catalog`); danglingRefs++; }
    else referenced.add(id);
  }
}

// ---------- cross-checks ----------
const unreferenced = [...itemIds].filter((id) => !referenced.has(id));
const unknownTypes = Object.keys(typeCounts).filter((t) => !DEBT_TYPES.has(t) && !["vc","pe","ma","ipo","accelerator","angel"].includes(t));
const debtProviders = providers.filter((p) => DEBT_TYPES.has(p.type)).length;

// ---------- report ----------
console.log("=== Diligence data validation ===");
console.log(`catalog items: ${items.length} (unique ids: ${itemIds.size})`);
console.log(`providers: ${providers.length} (unique ids: ${provIds.size})`);
console.log(`requirement mappings: ${totalReqs} · dangling: ${danglingRefs}`);
console.log(`catalog items referenced by >=1 provider: ${referenced.size}/${itemIds.size} (unreferenced: ${unreferenced.length})`);
console.log(`debt-wedge providers (matchable): ${debtProviders}/${providers.length}`);
console.log("provider types:", Object.entries(typeCounts).map(([t, n]) => `${t}=${n}`).join(", "));
if (unreferenced.length) warn(`${unreferenced.length} catalog items are not required by any provider (e.g. ${unreferenced.slice(0, 5).join(", ")})`);
if (unknownTypes.length) warn(`provider types not handled by the debt matcher: ${unknownTypes.join(", ")}`);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings.slice(0, 40)) console.log("  ⚠ " + w);
  if (warnings.length > 40) console.log(`  …and ${warnings.length - 40} more`);
}
if (errors.length) {
  console.error(`\n✗ ${errors.length} ERROR(S):`);
  for (const e of errors.slice(0, 50)) console.error("  ✗ " + e);
  process.exit(1);
}
console.log("\n✓ DATA VALID (no hard errors)");
