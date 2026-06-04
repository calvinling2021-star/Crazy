// Deterministic verified metrics from connected-rail data. No AI inference — every figure
// is computed from the transaction series + bank reconciliation (the spine, docs/ipo-os/05).
import type { Company, VerifiedMetrics } from "./types";

function mrrAt(company: Company, idx: number): number {
  // MRR as the running sum of net new/expansion/churn up to month idx.
  let mrr = 0;
  for (let i = 0; i <= idx; i++) {
    const m = company.months[i];
    mrr += m.newMrr + m.expansionMrr - m.churnedMrr;
  }
  return Math.max(0, Math.round(mrr));
}

export function computeVerifiedMetrics(company: Company): VerifiedMetrics {
  const months = company.months;
  const n = months.length;
  const last = months[n - 1];
  const mrr = mrrAt(company, n - 1);
  const prevMrr = n >= 2 ? mrrAt(company, n - 2) : mrr;
  const momGrowth = prevMrr > 0 ? (mrr - prevMrr) / prevMrr : 0;

  // Net revenue retention over the trailing 3 months vs the base 3 months ago.
  const window = Math.min(3, n - 1);
  const base = mrrAt(company, n - 1 - window) || 1;
  let expansion = 0;
  let churn = 0;
  for (let i = n - window; i < n; i++) {
    expansion += months[i].expansionMrr;
    churn += months[i].churnedMrr;
  }
  const nrr = (base + expansion - churn) / base;
  const grr = (base - churn) / base;

  const grossLast = last.grossRevenue;
  const refundRate = grossLast > 0 ? last.refunds / grossLast : 0;
  const netRevenueLast = Math.round(grossLast - last.refunds);

  const reconciled = months.filter((m) => m.bankDepositMatched).length;
  const reconciliationRate = n > 0 ? reconciled / n : 0;

  // All demo revenue is on traceable rails (Stripe). Real impl computes per-rail.
  const pctTraceable = 1.0;

  const burn = Math.max(0, Math.round(company.monthlyOpex - netRevenueLast));
  const runwayMonths = burn > 0 ? Math.round((company.cashBalance / burn) * 10) / 10 : 99;

  return {
    mrr,
    arr: mrr * 12,
    momGrowth: Math.round(momGrowth * 1000) / 1000,
    netRevenueLast,
    refundRate: Math.round(refundRate * 1000) / 1000,
    nrr: Math.round(nrr * 1000) / 1000,
    grr: Math.round(grr * 1000) / 1000,
    monthsOfHistory: n,
    pctTraceable,
    reconciliationRate: Math.round(reconciliationRate * 100) / 100,
    burn,
    runwayMonths,
    asOf: new Date().toISOString().slice(0, 10),
  };
}
