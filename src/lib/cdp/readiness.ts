// Day-one hook (docs/ipo-os/10/16): deterministic readiness + deadline alerts auto-detected
// from connected data — the "invisible until expensive, deadline-driven" pains.
import type { Company, ReadinessItem } from "./types";

function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

export function computeReadiness(company: Company): ReadinessItem[] {
  const items: ReadinessItem[] = [];

  // 83(b) elections — 30-day hard IRS deadline from restricted-stock purchase.
  for (const rs of company.restrictedStock) {
    if (rs.filed83b) continue;
    const age = daysSince(rs.purchaseDate);
    const daysLeft = 30 - age;
    if (daysLeft < 0) {
      items.push({
        id: `83b-${rs.holder}`,
        title: `83(b) election MISSED — ${rs.holder}`,
        severity: "critical",
        status: "overdue",
        detail: `Restricted stock purchased ${age} days ago; the 30-day IRS window has passed. This can create a large future tax bill — talk to counsel about options.`,
        autoHandled: false,
      });
    } else {
      items.push({
        id: `83b-${rs.holder}`,
        title: `File 83(b) election — ${rs.holder}`,
        severity: daysLeft <= 7 ? "critical" : "warning",
        status: "due_soon",
        detail: `Restricted stock purchased ${age} days ago. ${daysLeft} day(s) left to file with the IRS. We'll prepare the form for signature.`,
        dueInDays: daysLeft,
        autoHandled: true,
      });
    }
  }

  // Beneficial ownership (FinCEN BOI).
  items.push(
    company.boiFiled
      ? { id: "boi", title: "Beneficial ownership (BOI) filed", severity: "ok", status: "done", detail: "On file.", autoHandled: true }
      : { id: "boi", title: "File beneficial-ownership (BOI) report", severity: "warning", status: "open", detail: "Required for most US entities. We can pre-fill it from your company + cap-table data.", autoHandled: true }
  );

  // Cap-table hygiene.
  if (company.undocumentedGrants > 0) {
    items.push({
      id: "captable",
      title: `${company.undocumentedGrants} equity grant(s) lacking a board consent`,
      severity: "warning",
      status: "open",
      detail: "Undocumented grants surface in diligence and can delay a raise/loan. We'll generate the consent for signature.",
      autoHandled: true,
    });
  }

  // Rail completeness — can't assert verified-complete revenue if a rail is missing.
  const missing = company.expectedRails.filter((r) => !company.connectedRails.includes(r));
  items.push(
    missing.length === 0
      ? { id: "rails", title: "All known revenue rails connected", severity: "ok", status: "done", detail: `Connected: ${company.connectedRails.join(", ")}.`, autoHandled: true }
      : { id: "rails", title: `Connect ${missing.length} more revenue rail(s)`, severity: "info", status: "open", detail: `Missing: ${missing.join(", ")}. Connect to make your verified revenue complete and your credit stronger.`, autoHandled: false }
  );

  // Sort: critical -> warning -> info -> ok.
  const order: Record<string, number> = { critical: 0, warning: 1, info: 2, ok: 3 };
  return items.sort((a, b) => order[a.severity] - order[b.severity]);
}

export function readinessScore(items: ReadinessItem[]): number {
  // % of actionable items that are resolved (ok) — a simple readiness gauge.
  const actionable = items.filter((i) => i.severity !== "info");
  if (actionable.length === 0) return 100;
  const ok = actionable.filter((i) => i.severity === "ok").length;
  return Math.round((ok / actionable.length) * 100);
}
