// Capital matching + the alpha moment (docs/ipo-os/14): given verified metrics + credit score,
// which providers qualify, how ready are we for each, and what instant offers exist.
import catalogJson from "../../data/diligence/catalog.json";
import providersJson from "../../data/diligence/providers.json";
import type {
  Company,
  VerifiedMetrics,
  CreditScore,
  CapitalMatch,
  ProviderMatch,
  ProviderChecklist,
  ChecklistLine,
} from "./types";
import { aggregator } from "./aggregator";

interface CatalogItem {
  id: string;
  item: string;
  category: string;
  auto_preparable: "full" | "partial" | "manual";
  human_signoff: boolean;
  produced_by: string[];
}
interface ProviderRec {
  id: string;
  name: string;
  type: string;
  eligibility?: Record<string, unknown>;
  required_item_ids?: string[];
  provider_extras?: string[];
  source_url?: string;
}

const CATALOG = (catalogJson as unknown as { items: CatalogItem[] }).items;
const PROVIDERS = (providersJson as unknown as { providers: ProviderRec[] }).providers;
const CATALOG_BY_ID = new Map(CATALOG.map((c) => [c.id, c]));

const DEBT_TYPES = new Set(["rbf", "venture_debt", "startup_bank", "smb_lender", "bank", "sba", "grant"]);
const OFFER_TYPES = new Set(["rbf", "startup_bank", "smb_lender"]);

function parseMoney(v: unknown): number | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/[$,\s]/g, "");
  const m = s.match(/([\d.]+)\s*([KkMm])?/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const u = (m[2] || "").toLowerCase();
  if (u === "k") n *= 1e3;
  if (u === "m") n *= 1e6;
  return Math.round(n);
}

function isAnnual(v: string): boolean {
  return /yr|year|annual|ann/i.test(v);
}

function companyAgeMonths(c: Company): number {
  const inc = new Date(c.incorporationDate).getTime();
  return Math.max(0, Math.round((Date.now() - inc) / (1000 * 60 * 60 * 24 * 30.4)));
}

function statusForItem(it?: CatalogItem): ChecklistLine["status"] {
  if (!it) return "needs_you";
  if (it.auto_preparable === "full" && !it.human_signoff) return "ready";
  if (it.auto_preparable === "manual") return "needs_you";
  return "auto_preparing";
}

function readinessPct(itemIds: string[]): { pct: number; ready: number; total: number } {  const total = itemIds.length;
  if (total === 0) return { pct: 100, ready: 0, total: 0 };
  let score = 0;
  let ready = 0;
  for (const id of itemIds) {
    const st = statusForItem(CATALOG_BY_ID.get(id));
    if (st === "ready") {
      score += 1;
      ready += 1;
    } else if (st === "auto_preparing") {
      score += 0.6;
    }
  }
  return { pct: Math.round((score / total) * 100), ready, total };
}

function checkEligibility(p: ProviderRec, c: Company, m: VerifiedMetrics): { qualifies: boolean; reasons: string[] } {
  const e = p.eligibility || {};
  const reasons: string[] = [];
  let qualifies = true;

  if (e.vc_backed === true && !c.vcBacked) {
    qualifies = false;
    reasons.push("Requires VC backing");
  }
  const mrrMin = parseMoney(e.mrr_min);
  if (mrrMin != null) {
    if (m.mrr >= mrrMin) reasons.push(`MRR $${m.mrr.toLocaleString()} ≥ $${mrrMin.toLocaleString()}`);
    else {
      qualifies = false;
      reasons.push(`MRR $${m.mrr.toLocaleString()} below $${mrrMin.toLocaleString()} min`);
    }
  }
  const arrMin = parseMoney(e.arr_min);
  if (arrMin != null) {
    if (m.arr >= arrMin) reasons.push(`ARR meets minimum`);
    else {
      qualifies = false;
      reasons.push(`ARR $${m.arr.toLocaleString()} below $${arrMin.toLocaleString()} min`);
    }
  }
  if (typeof e.revenue_min === "string") {
    const amt = parseMoney(e.revenue_min);
    if (amt != null) {
      const val = isAnnual(e.revenue_min) ? m.arr : m.mrr;
      if (val >= amt) reasons.push(`Revenue meets minimum`);
      else {
        qualifies = false;
        reasons.push(`Revenue below ${e.revenue_min} min`);
      }
    }
  }
  if (typeof e.time_in_business_months === "number") {
    const age = companyAgeMonths(c);
    if (age >= e.time_in_business_months) reasons.push(`${age}mo in business ≥ ${e.time_in_business_months}mo`);
    else {
      qualifies = false;
      reasons.push(`${age}mo in business < ${e.time_in_business_months}mo required`);
    }
  }
  const bal = parseMoney(e.bank_balance_min);
  if (bal != null) {
    if (c.cashBalance >= bal) reasons.push(`Cash balance ≥ $${bal.toLocaleString()}`);
    else {
      qualifies = false;
      reasons.push(`Cash $${c.cashBalance.toLocaleString()} < $${bal.toLocaleString()} required`);
    }
  }
  if (typeof e.fico_min === "number") {
    reasons.push(`Personal FICO ${e.fico_min}+ check at offer`);
  }
  return { qualifies, reasons };
}

export function matchCapital(company: Company, m: VerifiedMetrics, credit: CreditScore): CapitalMatch {
  const qualifying: ProviderMatch[] = [];
  const nonQualifying: ProviderMatch[] = [];

  for (const p of PROVIDERS) {
    if (!DEBT_TYPES.has(p.type)) continue;
    const { qualifies, reasons } = checkEligibility(p, company, m);
    const r = readinessPct(p.required_item_ids || []);
    const match: ProviderMatch = {
      id: p.id,
      name: p.name,
      type: p.type,
      qualifies,
      reasons,
      readinessPct: r.pct,
      readyItems: r.ready,
      totalItems: r.total,
    };
    (qualifies ? qualifying : nonQualifying).push(match);
  }

  qualifying.sort((a, b) => b.readinessPct - a.readinessPct);
  nonQualifying.sort((a, b) => b.readinessPct - a.readinessPct);

  const lenders = qualifying
    .filter((q) => OFFER_TYPES.has(q.type))
    .map((q) => ({ name: q.name, product: q.type === "rbf" ? "Revenue-based advance" : q.type === "startup_bank" ? "Capital advance" : "Line of credit" }));

  const offers = aggregator.getOffers({ mrr: m.mrr, arr: m.arr, creditScore: credit.score, lenders });

  return { offers, qualifyingProviders: qualifying, nonQualifying };
}

// The alpha moment: name ANY provider -> exact checklist + % already prepared.
export function assembleChecklist(providerId: string): ProviderChecklist | null {
  const p = PROVIDERS.find((x) => x.id === providerId);
  if (!p) return null;
  const ids = p.required_item_ids || [];
  const lines: ChecklistLine[] = ids.map((id) => {
    const it = CATALOG_BY_ID.get(id);
    return {
      id,
      item: it?.item || id,
      category: it?.category || "Other",
      status: statusForItem(it),
      autoPreparable: it?.auto_preparable || "manual",
      humanSignoff: it?.human_signoff || false,
    };
  });
  const r = readinessPct(ids);
  return {
    providerId: p.id,
    providerName: p.name,
    providerType: p.type,
    readinessPct: r.pct,
    lines,
    providerExtras: p.provider_extras || [],
    sourceUrl: p.source_url,
  };
}

export function listProviders(): { id: string; name: string; type: string }[] {
  return PROVIDERS.map((p) => ({ id: p.id, name: p.name, type: p.type }));
}

export interface DataRoomReadiness {
  overallPct: number;
  ready: number;
  autoPreparing: number;
  needsYou: number;
  total: number;
  byCategory: { category: string; pct: number; ready: number; total: number }[];
}

// Overall data-room readiness across the full diligence catalog (all 200 items): how much is
// auto-prepared from connected data vs needs the founder. Powers the "your data room is X% ready".
export function dataRoomReadiness(): DataRoomReadiness {
  let ready = 0;
  let autoPreparing = 0;
  let needsYou = 0;
  const cat = new Map<string, { score: number; ready: number; total: number }>();

  for (const it of CATALOG) {
    const st = statusForItem(it);
    if (st === "ready") ready++;
    else if (st === "auto_preparing") autoPreparing++;
    else needsYou++;
    const c = cat.get(it.category) || { score: 0, ready: 0, total: 0 };
    c.total++;
    if (st === "ready") { c.score += 1; c.ready++; }
    else if (st === "auto_preparing") c.score += 0.6;
    cat.set(it.category, c);
  }

  const total = CATALOG.length;
  const overallScore = ready + 0.6 * autoPreparing;
  const byCategory = [...cat.entries()]
    .map(([category, c]) => ({ category, pct: Math.round((c.score / c.total) * 100), ready: c.ready, total: c.total }))
    .sort((a, b) => b.pct - a.pct);

  return {
    overallPct: Math.round((overallScore / total) * 100),
    ready,
    autoPreparing,
    needsYou,
    total,
    byCategory,
  };
}

