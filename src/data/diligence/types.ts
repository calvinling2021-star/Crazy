// Vibe Coder Operation Platform — Due-Diligence Catalog types.
//
// The catalog is the machine-readable source of truth for every document/data item that
// a capital provider (lender, VC, PE, acquirer, exchange) may request from a startup.
// It drives automation: for a given raise, the platform assembles the relevant checklist,
// then auto-prepares each item from the connected data feeds and its own modules.

/** Who requests the item. A single item is usually requested by several providers. */
export type CapitalSource =
  | "lender" // banks, venture debt, RBF / borrowing
  | "vc" // venture capital (seed → growth)
  | "pe" // private equity / growth equity
  | "ma" // M&A acquirer
  | "ipo"; // listing / public-market readiness

/** Top-level grouping used to render the data room / checklist sections. */
export type DiligenceCategory =
  | "Corporate/Legal"
  | "Financial"
  | "Quality of Earnings"
  | "Working Capital/Net Debt"
  | "Revenue/Metrics"
  | "Banking/Cash"
  | "Cap Table/Equity"
  | "Contracts/Commercial"
  | "Customers"
  | "IP"
  | "Product/Tech"
  | "Team/HR"
  | "Tax"
  | "Debt/Obligations"
  | "Collateral/UCC"
  | "KYC/AML"
  | "Insurance"
  | "Compliance/Data Privacy"
  | "Market"
  | "Fundraising History"
  | "Operations"
  | "Other";

/** Where the underlying data naturally lives (drives the connector/auto-prep path). */
export type DataSource =
  | "revenue_rails" // Stripe, Apple, Google, Meta, etc. (read-only)
  | "bank_feed"
  | "accounting_gl"
  | "cap_table" // the platform's own auditable cap-table module (07)
  | "expense" // the platform's own auditable expense module (07)
  | "board_consents"
  | "legal_docs"
  | "contracts"
  | "hr_system"
  | "product_analytics"
  | "tax_filings"
  | "insurance"
  | "founder_input" // must be supplied/confirmed by a human
  | "external_partner"; // independent auditor / attorney / 409A / KYC provider

/** Which Vibe-Coder-Operation-Platform module/agent produces the item (links the catalog to the architecture). */
export type ProducedBy =
  | "revenue_truth" // A1
  | "audit_automation" // A2
  | "cap_table" // 07
  | "expense" // 07
  | "legal_stack" // A5
  | "data_room"
  | "scoring" // A6
  | "manual";

/** How much of the item can be auto-generated from connected read-only data + modules. */
export type AutoPreparable = "full" | "partial" | "manual";

export interface DiligenceItem {
  /** Stable id, e.g. "fin-001". Prefix = category shorthand. */
  id: string;
  /** The specific document/data/analysis requested. */
  item: string;
  category: DiligenceCategory;
  /** One sentence: what it is / why the provider wants it. */
  description: string;
  /** Capital providers that request this item. */
  capital_sources: CapitalSource[];
  /** Financing stages/types that need it, free-form tags (e.g. "venture_debt", "series_a"). */
  stages: string[];
  /** Where the underlying data lives. */
  data_source: DataSource[];
  /** Which module/agent produces it. */
  produced_by: ProducedBy[];
  /** Degree of automation possible. */
  auto_preparable: AutoPreparable;
  /** Whether a licensed human (auditor/attorney) must review & sign before release. */
  human_signoff: boolean;
  /** Optional notes / caveats. */
  notes?: string;
  /** Source URLs the item was derived from (provenance for the catalog itself). */
  sources?: string[];
}

export interface DiligenceCatalog {
  version: string;
  generated: string; // ISO date
  items: DiligenceItem[];
}
