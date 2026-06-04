// Vibe Coder Operation Platform — core single entry point used by the Next API, the dashboard page,
// and the MCP server. All outputs are deterministic from verified data (docs/ipo-os/19).
import { getCompany } from "./demo";
import { loadCompany, liveDataConfigured } from "./connectors";
import { computeVerifiedMetrics } from "./spine";
import { computeCreditScore } from "./creditScore";
import { computeReadiness } from "./readiness";
import { matchCapital, assembleChecklist, listProviders, dataRoomReadiness } from "./capital";
import type { Company, FounderState } from "./types";

function stateFromCompany(company: Company): FounderState {
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

/** Sync, demo-only (used by the smoke test and as a safe fallback). */
export function getFounderState(companyId?: string): FounderState {
  return stateFromCompany(getCompany(companyId));
}

/** Async: uses live read-only connectors (Stripe) when configured, else the demo. */
export async function getFounderStateAsync(companyId?: string): Promise<FounderState & { live: boolean }> {
  const company = await loadCompany(companyId);
  return { ...stateFromCompany(company), live: liveDataConfigured() };
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

/** Async variants for the MCP server / API so agents see live data when configured. */
export async function getCreditScoreAsync(companyId?: string) {
  return computeCreditScore(computeVerifiedMetrics(await loadCompany(companyId)));
}
export async function getReadinessAsync(companyId?: string) {
  return computeReadiness(await loadCompany(companyId));
}
export async function getVerifiedMetricsAsync(companyId?: string) {
  return computeVerifiedMetrics(await loadCompany(companyId));
}
export async function getCapitalMatchAsync(companyId?: string) {
  const company = await loadCompany(companyId);
  const m = computeVerifiedMetrics(company);
  return matchCapital(company, m, computeCreditScore(m));
}

export { assembleChecklist, listProviders, dataRoomReadiness, liveDataConfigured };
export * from "./types";
