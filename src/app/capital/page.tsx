import { getFounderState, listProviders } from "@/lib/cdp";
import { FirmSelector } from "./FirmSelector";

export const dynamic = "force-dynamic";

const sev: Record<string, string> = {
  critical: "border-red-500/40 bg-red-500/5 text-red-300",
  warning: "border-amber-500/40 bg-amber-500/5 text-amber-300",
  info: "border-sky-500/40 bg-sky-500/5 text-sky-300",
  ok: "border-emerald-500/40 bg-emerald-500/5 text-emerald-300",
};

function money(n: number) {
  return "$" + n.toLocaleString();
}

export default function CapitalPage() {
  const s = getFounderState();
  const providers = listProviders();

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-end justify-between border-b border-neutral-800 pb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">Vibe Coder Operation Platform</p>
            <h1 className="text-2xl font-semibold">{s.company.name}</h1>
            <p className="text-sm text-neutral-400">
              {s.company.entityType} · {s.company.jurisdiction} · verified as of {s.metrics.asOf}
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            ✓ Revenue verified · rail→bank reconciled
          </span>
        </header>

        {/* Credit score + instant capital */}
        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 md:col-span-1">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Credit score (day-one)</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-5xl font-bold">{s.creditScore.score}</span>
              <span className="mb-1 rounded-md bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                {s.creditScore.band}
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-400">
              Indicative capacity{" "}
              <span className="font-semibold text-neutral-100">{money(s.creditScore.maxIndicativeAdvance)}</span>
            </p>
            <div className="mt-4 space-y-2">
              {s.creditScore.factors.map((f) => (
                <div key={f.key}>
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>{f.label}</span>
                    <span>{f.score}</span>
                  </div>
                  <div className="h-1.5 rounded bg-neutral-800">
                    <div className="h-1.5 rounded bg-emerald-500" style={{ width: `${f.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-snug text-neutral-500">{s.creditScore.note}</p>
          </div>

          {/* Instant offers */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric label="MRR" value={money(s.metrics.mrr)} />
              <Metric label="ARR" value={money(s.metrics.arr)} />
              <Metric label="MoM growth" value={`${(s.metrics.momGrowth * 100).toFixed(1)}%`} />
              <Metric label="NRR" value={`${(s.metrics.nrr * 100).toFixed(0)}%`} />
              <Metric label="Runway" value={`${s.metrics.runwayMonths} mo`} />
              <Metric label="Reconciled" value={`${Math.round(s.metrics.reconciliationRate * 100)}%`} />
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] p-5">
              <p className="text-sm font-medium text-emerald-300">
                Instant growth capital — no paperwork, your audited data is the application
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {s.capital.offers.length === 0 && (
                  <p className="text-sm text-neutral-400">No pre-qualified offers yet — connect more revenue history.</p>
                )}
                {s.capital.offers.map((o, i) => (
                  <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{o.lender}</span>
                      <span className="text-lg font-bold text-emerald-300">{money(o.amount)}</span>
                    </div>
                    <p className="text-xs text-neutral-400">{o.product}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {(o.feePct * 100).toFixed(1)}% fee · {o.termMonths}mo · ~{money(o.estMonthlyRepayment)}/mo
                    </p>
                    <button className="mt-3 w-full rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-neutral-950">
                      Accept — funds in 24h
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-neutral-500">Indicative offers (mock aggregator). Final terms set by the partner lender.</p>
            </div>
          </div>
        </section>

        {/* Readiness / deadline alerts */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Readiness & deadline alerts</h2>
          <div className="space-y-2">
            {s.readiness.map((r) => (
              <div key={r.id} className={`flex items-start justify-between rounded-xl border px-4 py-3 ${sev[r.severity]}`}>
                <div>
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs opacity-80">{r.detail}</p>
                </div>
                <div className="ml-4 shrink-0 text-right">
                  {typeof r.dueInDays === "number" && <p className="text-xs font-semibold">{r.dueInDays}d left</p>}
                  {r.autoHandled && r.severity !== "ok" && <p className="text-[11px] opacity-70">we&apos;ll prepare it</p>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Alpha moment */}
        <section>
          <h2 className="mb-1 text-sm font-semibold text-neutral-300">Name a firm — see your exact checklist</h2>
          <p className="mb-3 text-xs text-neutral-500">
            Tell us who you&apos;re raising/borrowing from; we already have most of what they ask for.
          </p>
          <FirmSelector providers={providers} />
        </section>

        {/* Qualifying providers */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">
            Debt providers you qualify for ({s.capital.qualifyingProviders.length})
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {s.capital.qualifyingProviders.map((p) => (
              <div key={p.id} className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-emerald-300">{p.readinessPct}% ready</span>
                </div>
                <p className="text-[11px] uppercase tracking-wide text-neutral-500">{p.type}</p>
                <p className="mt-1 text-xs text-neutral-400">{p.reasons.slice(0, 2).join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
