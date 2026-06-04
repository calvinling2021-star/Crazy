// Quick smoke test of the Capital Trust Center core (no external deps).
// Run: npx -y tsx scripts/cdp_smoke.ts
import { getFounderState, assembleChecklist, listProviders } from "../src/lib/cdp/index";

const s = getFounderState();
console.log("Company:", s.company.name, s.company.entityType);
console.log("Metrics:", { mrr: s.metrics.mrr, arr: s.metrics.arr, nrr: s.metrics.nrr, runway: s.metrics.runwayMonths, recon: s.metrics.reconciliationRate });
console.log("Credit:", s.creditScore.score, s.creditScore.band, "maxAdvance", s.creditScore.maxIndicativeAdvance);
console.log("Readiness alerts:", s.readiness.map((r) => `${r.severity}:${r.title}`));
console.log("Offers:", s.capital.offers.map((o) => `${o.lender} $${o.amount} @${(o.feePct * 100).toFixed(1)}%`));
console.log("Qualifying providers:", s.capital.qualifyingProviders.length, "/ non:", s.capital.nonQualifying.length);
console.log("Top qualifying:", s.capital.qualifyingProviders.slice(0, 5).map((p) => `${p.name}(${p.readinessPct}%)`));

const yc = assembleChecklist("yc");
console.log("\nAlpha moment — YC checklist:", yc?.readinessPct + "% ready,", yc?.lines.length, "items");
console.log("  ready:", yc?.lines.filter((l) => l.status === "ready").length, "auto:", yc?.lines.filter((l) => l.status === "auto_preparing").length, "needs-you:", yc?.lines.filter((l) => l.status === "needs_you").length);

const cap = assembleChecklist("capchase");
console.log("Capchase checklist:", cap?.readinessPct + "% ready,", cap?.lines.length, "items");
console.log("\nProvider count:", listProviders().length);
console.log("SMOKE OK");
