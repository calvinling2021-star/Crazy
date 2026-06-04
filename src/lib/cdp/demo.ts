// A believable "vibe coder" demo company so the whole MVP runs with zero setup.
// Dates are relative to today so deadline alerts (83(b), BOI) feel live.
import type { Company, MonthRevenue } from "./types";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function monthLabel(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toISOString().slice(0, 7);
}

// 6 months of Stripe-verified revenue, growing to $12k MRR, healthy expansion.
const seed: Array<Omit<MonthRevenue, "month">> = [
  { grossRevenue: 5200, refunds: 120, newMrr: 5000, expansionMrr: 200, churnedMrr: 0, bankDepositMatched: true },
  { grossRevenue: 6800, refunds: 140, newMrr: 1500, expansionMrr: 300, churnedMrr: 300, bankDepositMatched: true },
  { grossRevenue: 8300, refunds: 150, newMrr: 1800, expansionMrr: 400, churnedMrr: 200, bankDepositMatched: true },
  { grossRevenue: 9700, refunds: 180, newMrr: 1500, expansionMrr: 500, churnedMrr: 400, bankDepositMatched: true },
  { grossRevenue: 11200, refunds: 210, newMrr: 1700, expansionMrr: 600, churnedMrr: 300, bankDepositMatched: true },
  { grossRevenue: 12300, refunds: 240, newMrr: 1400, expansionMrr: 700, churnedMrr: 200, bankDepositMatched: true },
];

export const demoCompany: Company = {
  id: "pixelforge",
  name: "Pixelforge AI",
  incorporationDate: isoDaysAgo(190),
  entityType: "Delaware C-Corp",
  jurisdiction: "US / Delaware",
  vcBacked: false,
  connectedRails: ["stripe", "bank"],
  expectedRails: ["stripe", "bank"],
  boiFiled: false, // beneficial-ownership not filed -> alert
  cashBalance: 88000,
  monthlyOpex: 21000, // net burn after revenue computed in spine
  restrictedStock: [
    // Founder bought restricted stock 41 days ago and never filed 83(b) -> window missed.
    { holder: "Founder (CEO)", purchaseDate: isoDaysAgo(41), filed83b: false },
    // Co-founder bought 18 days ago -> 83(b) still open, urgent.
    { holder: "Co-founder (CTO)", purchaseDate: isoDaysAgo(18), filed83b: false },
  ],
  undocumentedGrants: 1, // one advisor grant lacking a board consent
  months: seed.map((m, i) => ({ month: monthLabel(seed.length - 1 - i), ...m })),
};

export function getCompany(id?: string): Company {
  // Single demo tenant for now; real impl resolves a connected tenant.
  if (id && id !== demoCompany.id) {
    return { ...demoCompany, id, name: id };
  }
  return demoCompany;
}
