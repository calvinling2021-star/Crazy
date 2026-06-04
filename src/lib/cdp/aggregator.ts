// Lending-aggregator boundary (docs/ipo-os/19 decision #4: partner via aggregator).
// Production swaps MockAggregator for a Lendflow / Parafin / Lendio adapter behind this
// same interface. Offers are clearly indicative until a real lender underwrites.
import type { Offer } from "./types";
import { advanceMultiple } from "./creditScore";

export interface LenderProfile {
  mrr: number;
  arr: number;
  creditScore: number;
  lenders: { name: string; product: string }[];
}

export interface LendingAggregator {
  name: string;
  getOffers(p: LenderProfile): Offer[];
}

export class MockAggregator implements LendingAggregator {
  name = "mock-aggregator";

  getOffers(p: LenderProfile): Offer[] {
    const multiple = advanceMultiple(p.creditScore);
    const base = Math.min(250000, Math.round((p.mrr * multiple) / 1000) * 1000);
    if (base <= 0 || p.lenders.length === 0) return [];

    // A small spread of competing offers from the qualifying lenders.
    return p.lenders.slice(0, 4).map((l, i) => {
      const amount = Math.max(5000, Math.round((base * (1 - i * 0.12)) / 1000) * 1000);
      const feePct = Math.round((0.06 + i * 0.01 + (80 - p.creditScore) * 0.0008) * 1000) / 1000;
      const termMonths = 12;
      const total = amount * (1 + feePct);
      return {
        lender: l.name,
        product: l.product,
        amount,
        feePct,
        termMonths,
        estMonthlyRepayment: Math.round(total / termMonths),
        indicative: true as const,
      };
    });
  }
}

export const aggregator: LendingAggregator = new MockAggregator();
