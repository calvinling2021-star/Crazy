// Vibe Coder Operation Platform — core single entry point used by the Next API, the dashboard page,
// and the MCP server. All outputs are deterministic from verified data (docs/ipo-os/19).
import { getCompany } from "./demo";
import { computeVerifiedMetrics } from "./spine";
import { computeCreditScore } from "./creditScore";
import { computeReadiness } from "./readiness";
import { matchCapital, assembleChecklist, listProviders } from "./capital";
import type { FounderState } from "./types";

export function getFounderState(companyId?: string): FounderState {
  const company = getCompany(companyId);
  const metrics = computeVerifiedMetrics(company);
  const creditScore = computeCreditScore(metrics);
  const readiness = computeReadiness(company);
  const capital = matchCapital(company, metrics, creditScore);
  return {
    company: { id: company.id, name: company.name, entityType: company.entityType, jurisdiction: company.jurisdiction },
    metrics,
    creditScore,
    readiness,
    capital,
  };
}

export function getCreditScore(companyId?: string) {
  const company = getCompany(companyId);
  return computeCreditScore(computeVerifiedMetrics(company));
}

export function getReadiness(companyId?: string) {
  return computeReadiness(getCompany(companyId));
}

export function getVerifiedMetrics(companyId?: string) {
  return computeVerifiedMetrics(getCompany(companyId));
}

export function getCapitalMatch(companyId?: string) {
  const company = getCompany(companyId);
  const m = computeVerifiedMetrics(company);
  return matchCapital(company, m, computeCreditScore(m));
}

export { assembleChecklist, listProviders };
export * from "./types";
