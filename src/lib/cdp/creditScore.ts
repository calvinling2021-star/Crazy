// The core moat (docs/ipo-os/19): a deterministic, explainable "credit-from-day-one" score
// computed only from verified/audited data — never AI-guessed. Each factor is transparent.
import type { CreditScore, CreditFactor, VerifiedMetrics } from "./types";

const VERSION = "cds-0.1.0";

function clamp(x: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, x));
}

// Smoothly map a value through (min->0, mid->60, max->100) style ramps.
function ramp(value: number, atZero: number, atFull: number): number {
  if (atFull === atZero) return 0;
  return clamp(((value - atZero) / (atFull - atZero)) * 100);
}

export function computeCreditScore(m: VerifiedMetrics): CreditScore {
  const factors: CreditFactor[] = [
    {
      key: "scale",
      label: "Revenue scale (MRR)",
      weight: 0.22,
      score: Math.round(ramp(Math.log10(Math.max(1, m.mrr)), Math.log10(1000), Math.log10(100000))),
      detail: `Verified MRR $${m.mrr.toLocaleString()} (ARR $${m.arr.toLocaleString()}).`,
    },
    {
      key: "growth",
      label: "Growth (MoM)",
      weight: 0.18,
      score: Math.round(ramp(m.momGrowth, -0.05, 0.2)),
      detail: `${(m.momGrowth * 100).toFixed(1)}% month-over-month MRR growth.`,
    },
    {
      key: "retention",
      label: "Net revenue retention",
      weight: 0.18,
      score: Math.round(ramp(m.nrr, 0.85, 1.2)),
      detail: `NRR ${(m.nrr * 100).toFixed(0)}% / GRR ${(m.grr * 100).toFixed(0)}%.`,
    },
    {
      key: "runway",
      label: "Runway",
      weight: 0.14,
      score: Math.round(ramp(m.runwayMonths, 3, 18)),
      detail: `${m.runwayMonths} months of runway at $${m.burn.toLocaleString()}/mo net burn.`,
    },
    {
      key: "quality",
      label: "Revenue quality",
      weight: 0.12,
      score: Math.round(clamp(m.pctTraceable * 100 - m.refundRate * 200)),
      detail: `${Math.round(m.pctTraceable * 100)}% on traceable rails; ${(m.refundRate * 100).toFixed(1)}% refunds.`,
    },
    {
      key: "reconciliation",
      label: "Audit cleanliness",
      weight: 0.1,
      score: Math.round(m.reconciliationRate * 100),
      detail: `${Math.round(m.reconciliationRate * 100)}% of months reconciled rail→bank.`,
    },
    {
      key: "history",
      label: "Verified history",
      weight: 0.06,
      score: Math.round(ramp(m.monthsOfHistory, 1, 18)),
      detail: `${m.monthsOfHistory} months of verified financial history on platform.`,
    },
  ];

  const score = Math.round(
    factors.reduce((acc, f) => acc + f.weight * f.score, 0)
  );

  const band: CreditScore["band"] =
    score >= 80 ? "Prime" : score >= 60 ? "Strong" : score >= 40 ? "Building" : "Emerging";

  // Indicative advance: a multiple of MRR scaled by the score band, capped.
  const multiple = score >= 80 ? 10 : score >= 60 ? 7 : score >= 40 ? 4 : 3;
  const maxIndicativeAdvance = Math.min(250000, Math.round((m.mrr * multiple) / 1000) * 1000);

  return {
    score,
    band,
    factors,
    maxIndicativeAdvance,
    version: VERSION,
    note: "Deterministic, computed only from verified data. Indicative for the founder; partner lenders make the credit decision. Not a consumer report.",
  };
}

export function advanceMultiple(score: number): number {
  return score >= 80 ? 10 : score >= 60 ? 7 : score >= 40 ? 4 : 3;
}
