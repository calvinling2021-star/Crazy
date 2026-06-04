// Rail connectors (read-only). Swap the demo company for live data when credentials exist.
// Design law (docs/ipo-os/19): READ-ONLY only — never write, never move money. Deterministic
// metrics are computed by the spine from whatever a connector returns.
import type { Company, MonthRevenue } from "./types";
import { demoCompany, getCompany } from "./demo";

export interface RailConnector {
  rail: string;
  /** Are read-only credentials configured? */
  available(): boolean;
  /** Read-only pull of monthly revenue (oldest -> newest). */
  fetchMonths(): Promise<MonthRevenue[]>;
  /** Optional: cash balance proxy (e.g., Stripe available balance), in dollars. */
  fetchCashBalance?(): Promise<number | null>;
}

function monthKey(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 7);
}

/**
 * Stripe read-only connector. Use a RESTRICTED, read-only key (STRIPE_SECRET_KEY).
 * Pulls ~6 months of balance transactions (charges/refunds) + payouts (for reconciliation)
 * via the REST API with fetch (no SDK dependency).
 */
export class StripeConnector implements RailConnector {
  rail = "stripe";
  private key = process.env.STRIPE_SECRET_KEY || "";

  available(): boolean {
    return this.key.startsWith("sk_") || this.key.startsWith("rk_");
  }

  private async get(path: string, params: Record<string, string | number>): Promise<any> {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    const res = await fetch(`https://api.stripe.com/v1/${path}?${qs}`, {
      headers: { Authorization: `Bearer ${this.key}` },
      // read-only GETs; never POST to Stripe from here
    });
    if (!res.ok) throw new Error(`stripe ${path} ${res.status}`);
    return res.json();
  }

  async fetchMonths(): Promise<MonthRevenue[]> {
    const sinceDays = 190;
    const gte = Math.floor((Date.now() - sinceDays * 86400_000) / 1000);

    // Aggregate gross (charges/payments) and refunds per month from balance transactions.
    const gross: Record<string, number> = {};
    const refunds: Record<string, number> = {};
    const payoutMonths = new Set<string>();
    let startingAfter: string | undefined;
    for (let page = 0; page < 20; page++) {
      const params: Record<string, string | number> = { limit: 100, "created[gte]": gte };
      if (startingAfter) params.starting_after = startingAfter;
      const data = await this.get("balance_transactions", params);
      for (const t of data.data as Array<{ id: string; type: string; amount: number; created: number }>) {
        const m = monthKey(t.created);
        const dollars = t.amount / 100;
        if (t.type === "charge" || t.type === "payment") gross[m] = (gross[m] || 0) + dollars;
        else if (t.type === "refund" || t.type === "payment_refund") refunds[m] = (refunds[m] || 0) + Math.abs(dollars);
        else if (t.type === "payout") payoutMonths.add(m);
      }
      if (!data.has_more || data.data.length === 0) break;
      startingAfter = data.data[data.data.length - 1].id;
    }

    const months = Object.keys(gross).sort();
    let prevGross = 0;
    return months.map((m) => {
      const g = Math.round(gross[m] || 0);
      const r = Math.round(refunds[m] || 0);
      // Approximate MRR movement as net change in monthly revenue (TODO: use subscriptions
      // for true new/expansion/churn). Cumulative sum in the spine then ≈ latest revenue.
      const newMrr = Math.max(0, g - prevGross);
      const churnedMrr = Math.max(0, prevGross - g);
      prevGross = g;
      const row: MonthRevenue = {
        month: m,
        grossRevenue: g,
        refunds: r,
        newMrr,
        expansionMrr: 0,
        churnedMrr,
        bankDepositMatched: payoutMonths.has(m), // payout in-month => reconciled (approx)
      };
      return row;
    });
  }

  async fetchCashBalance(): Promise<number | null> {
    try {
      const bal = await this.get("balance", {});
      const available = (bal.available || []).reduce((s: number, a: { amount: number }) => s + a.amount, 0);
      return Math.round(available / 100);
    } catch {
      return null;
    }
  }
}

/**
 * Build a Company from live connectors when available, else fall back to the demo company.
 * Live Stripe-only data is intentionally a thinner, honest slice (no cap-table/83(b) facts
 * until those sources are connected).
 */
export async function loadCompany(companyId?: string): Promise<Company> {
  const stripe = new StripeConnector();
  if (!stripe.available()) return getCompany(companyId);

  try {
    const months = await stripe.fetchMonths();
    if (months.length === 0) return getCompany(companyId);
    const cash = (await stripe.fetchCashBalance?.()) ?? 0;
    return {
      id: companyId || "live",
      name: process.env.CDP_COMPANY_NAME || "Connected company",
      incorporationDate: process.env.CDP_INCORP_DATE || months[0].month + "-01",
      entityType: "Unknown (connect formation docs)",
      jurisdiction: "Unknown",
      vcBacked: false,
      connectedRails: ["stripe"],
      expectedRails: ["stripe"],
      boiFiled: false,
      cashBalance: cash,
      monthlyOpex: 0, // TODO: connect bank/accounting to compute burn & runway
      restrictedStock: [], // TODO: from cap-table connection
      undocumentedGrants: 0,
      months,
    };
  } catch {
    // Any live-fetch failure degrades gracefully to the demo so the app always renders.
    return getCompany(companyId);
  }
}

export function liveDataConfigured(): boolean {
  return new StripeConnector().available();
}

export { demoCompany };
