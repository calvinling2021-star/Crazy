// Map unreferenced catalog items to the canonical "request-list" providers for their category.
// Deep diligence items belong on the comprehensive checklists (Cooley VC list, Big-4 QoE,
// M&A/IP/Tax/HR/etc.) — NOT on the curated, paperwork-free RBF/bank lists. Dry-run by default;
// pass --apply to rewrite providers.json (preserving the one-line-per-provider format).
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DIR = resolve(process.cwd(), "src/data/diligence");
const catalog = JSON.parse(readFileSync(resolve(DIR, "catalog.json"), "utf8"));
const doc = JSON.parse(readFileSync(resolve(DIR, "providers.json"), "utf8"));
const providers: any[] = doc.providers;

// Each catalog category routes to the canonical checklist provider that owns that domain.
const CATEGORY_TO_PROVIDER: Record<string, string> = {
  "Corporate/Legal": "vdr_index",
  "Financial": "big4_qoe",
  "Quality of Earnings": "big4_qoe",
  "Working Capital/Net Debt": "big4_qoe",
  "Revenue/Metrics": "saas_dd",
  "Banking/Cash": "big4_qoe",
  "Cap Table/Equity": "cooley_template",
  "Contracts/Commercial": "commercial_dd",
  "Customers": "commercial_dd",
  "IP": "ip_dd",
  "Product/Tech": "technical_dd",
  "Team/HR": "hr_dd",
  "Tax": "tax_dd",
  "Debt/Obligations": "big4_qoe",
  "Collateral/UCC": "dealroom_98",
  "KYC/AML": "vdr_index",
  "Insurance": "insurance_rwi_dd",
  "Compliance/Data Privacy": "cyber_esg_dd",
  "Market": "commercial_dd",
  "Fundraising History": "cooley_template",
  "Operations": "vdr_index",
  "Other": "vdr_index",
};

const byId = new Map(providers.map((p) => [p.id, p]));
const referenced = new Set<string>();
for (const p of providers) for (const id of p.required_item_ids ?? []) referenced.add(id);

const unreferenced = catalog.items.filter((it: any) => !referenced.has(it.id));
const plan: Record<string, string[]> = {};
const unmapped: string[] = [];

for (const it of unreferenced) {
  const target = CATEGORY_TO_PROVIDER[it.category];
  if (!target || !byId.has(target)) { unmapped.push(`${it.id} (${it.category})`); continue; }
  (plan[target] ||= []).push(it.id);
}

console.log(`Unreferenced items: ${unreferenced.length}`);
console.log("Planned additions (provider <- items):");
for (const [pid, ids] of Object.entries(plan)) {
  console.log(`  ${pid} (${byId.get(pid).name}): +${ids.length}  [${ids.join(", ")}]`);
}
if (unmapped.length) console.log(`Unmapped (no canonical provider): ${unmapped.join(", ")}`);

if (!process.argv.includes("--apply")) {
  console.log("\n(dry run — pass --apply to write providers.json)");
  process.exit(0);
}

// Apply: append (dedup) to each target provider's required_item_ids.
for (const [pid, ids] of Object.entries(plan)) {
  const p = byId.get(pid);
  const set = new Set(p.required_item_ids ?? []);
  for (const id of ids) set.add(id);
  p.required_item_ids = [...set];
}
doc.version = "1.1.0";

// Re-serialize preserving the compact one-line-per-provider style (minimal diff).
const out =
  `{\n  "version": ${JSON.stringify(doc.version)},\n  "generated": ${JSON.stringify(doc.generated)},\n  "note": ${JSON.stringify(doc.note)},\n  "providers": [\n    ` +
  providers.map((p) => JSON.stringify(p)).join(",\n    ") +
  `\n  ]\n}\n`;
writeFileSync(resolve(DIR, "providers.json"), out);
console.log(`\n✓ Applied. providers.json rewritten (version ${doc.version}).`);
