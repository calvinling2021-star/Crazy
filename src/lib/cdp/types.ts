// Capital Trust Center — core domain types (the focused debt-wedge MVP, see docs/ipo-os/19).
// Numbers are plain USD dollars for the demo; a production build uses integer minor units.

export interface MonthRevenue {
  month: string; // YYYY-MM
  grossRevenue: number;
  refunds: number;
  newMrr: number;
  expansionMrr: number;
  churnedMrr: number;
  bankDepositMatched: boolean; // reconciled rail payout -> bank
}

export interface RestrictedStockPurchase {
  holder: string;
  purchaseDate: string; // YYYY-MM-DD
  filed83b: boolean;
}

export interface Company {
  id: string;
  name: string;
  incorporationDate: string; // YYYY-MM-DD
  entityType: string;
  jurisdiction: string;
  vcBacked: boolean;
  connectedRails: string[]; // e.g. ["stripe","bank"]
  expectedRails: string[]; // rails we have evidence should be connected
  boiFiled: boolean; // beneficial-ownership (FinCEN) filing
  cashBalance: number;
  monthlyOpex: number;
  restrictedStock: RestrictedStockPurchase[];
  undocumentedGrants: number; // option/advisor grants lacking board consent
  months: MonthRevenue[]; // chronological, oldest -> newest
}

export interface VerifiedMetrics {
  mrr: number;
  arr: number;
  momGrowth: number; // last month-over-month, fraction
  netRevenueLast: number;
  refundRate: number; // fraction
  nrr: number; // net revenue retention, fraction (1.0 = 100%)
  grr: number; // gross revenue retention, fraction
  monthsOfHistory: number;
  pctTraceable: number; // share of revenue on traceable rails
  reconciliationRate: number; // share of months reconciled to bank
  burn: number; // monthly net burn
  runwayMonths: number;
  asOf: string;
}

export interface CreditFactor {
  key: string;
  label: string;
  weight: number; // 0..1
  score: number; // 0..100
  detail: string;
}

export interface CreditScore {
  score: number; // 0..100
  band: "Emerging" | "Building" | "Strong" | "Prime";
  factors: CreditFactor[];
  maxIndicativeAdvance: number; // USD, indicative
  version: string;
  note: string;
}

export type Severity = "critical" | "warning" | "info" | "ok";

export interface ReadinessItem {
  id: string;
  title: string;
  severity: Severity;
  status: string;
  detail: string;
  dueInDays?: number;
  autoHandled: boolean;
}

export interface Offer {
  lender: string;
  product: string;
  amount: number;
  feePct: number; // flat fee, fraction
  termMonths: number;
  estMonthlyRepayment: number;
  indicative: true;
}

export interface ProviderMatch {
  id: string;
  name: string;
  type: string;
  qualifies: boolean;
  reasons: string[];
  readinessPct: number; // % of required items already prepared
  readyItems: number;
  totalItems: number;
}

export interface CapitalMatch {
  offers: Offer[];
  qualifyingProviders: ProviderMatch[];
  nonQualifying: ProviderMatch[];
}

export interface ChecklistLine {
  id: string;
  item: string;
  category: string;
  status: "ready" | "auto_preparing" | "needs_you";
  autoPreparable: string;
  humanSignoff: boolean;
}

export interface ProviderChecklist {
  providerId: string;
  providerName: string;
  providerType: string;
  readinessPct: number;
  lines: ChecklistLine[];
  providerExtras: string[];
  sourceUrl?: string;
}

export interface FounderState {
  company: { id: string; name: string; entityType: string; jurisdiction: string };
  metrics: VerifiedMetrics;
  creditScore: CreditScore;
  readiness: ReadinessItem[];
  capital: CapitalMatch;
}
