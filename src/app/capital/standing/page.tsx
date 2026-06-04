import Link from "next/link";
import type { Metadata } from "next";
import { getFounderStateAsync } from "@/lib/cdp";
import { FACTOR_GUIDANCE, BANDS, rankFactorsByOpportunity } from "@/lib/cdp/creditScore";
import { AttestlyWordmark } from "@/components/attestly/Logo";

export const metadata: Metadata = { title: { absolute: "Attestly Standing — credit from day one" } };
export const dynamic = "force-dynamic";

const money = (n: number) => "$" + n.toLocaleString();

export default async function StandingPage() {
  const s = await getFounderStateAsync();
  const c = s.creditScore;
  const ranked = rankFactorsByOpportunity(c.factors);
  const topOpps = ranked.filter((f) => f.score < 100).slice(0, 3);

  return (
    <main className="min-h-screen bg-[#0B0F14] text-[#E8EDF2] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <AttestlyWordmark size={20} />
          <Link href="/capital" className="text-sm text-[#9AA7B5]">← Dashboard</Link>
        </header>

        <p className="font-mono text-xs uppercase tracking-wide text-[#5E6B7A]">Attestly Standing</p>
        <div className="mt-2 flex items-end gap-3">
          <span className="font-mono text-6xl font-bold">{c.score}</span>
          <span className="mb-2 rounded-md bg-[#11161D] px-2 py-0.5 text-sm text-[#9AA7B5]">{c.band}</span>
        </div>
        <p className="mt-2 text-sm text-[#9AA7B5]">
          Indicative capacity <span className="font-semibold text-[#E8EDF2]">{money(c.maxIndicativeAdvance)}</span> ·
          credit from day one, built only from your verified data.
        </p>

        {/* Band ladder */}
        <div className="mt-6 flex gap-1">
          {BANDS.map((b) => {
            const active = c.score >= b.min && c.score <= b.max;
            return (
              <div key={b.band} className="flex-1">
                <div className={`h-1.5 rounded ${active ? "bg-[#3DD68C]" : "bg-[#232C38]"}`} />
                <p className={`mt-1 text-[10px] ${active ? "text-[#3DD68C]" : "text-[#5E6B7A]"}`}>{b.band}</p>
                <p className="text-[10px] text-[#5E6B7A]">{b.min}–{b.max}</p>
              </div>
            );
          })}
        </div>

        {/* Biggest opportunities */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-[#E8EDF2]">Biggest opportunities to raise your Standing</h2>
          <div className="space-y-2">
            {topOpps.map((f) => (
              <div key={f.key} className="rounded-xl border border-[#3DD68C]/30 bg-[#3DD68C]/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{f.label}</span>
                  <span className="font-mono text-xs text-[#9AA7B5]">{f.score}/100</span>
                </div>
                <p className="mt-1 text-xs text-[#9AA7B5]">{FACTOR_GUIDANCE[f.key] || f.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* All factors */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-[#E8EDF2]">All factors</h2>
          <div className="space-y-3">
            {c.factors.map((f) => (
              <div key={f.key}>
                <div className="flex justify-between text-xs text-[#9AA7B5]">
                  <span>{f.label} <span className="text-[#5E6B7A]">· weight {Math.round(f.weight * 100)}%</span></span>
                  <span className="font-mono">{f.score}</span>
                </div>
                <div className="mt-1 h-1.5 rounded bg-[#232C38]">
                  <div className="h-1.5 rounded bg-[#3DD68C]" style={{ width: `${f.score}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-[#5E6B7A]">{f.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-8 font-mono text-[11px] text-[#5E6B7A]">
          {c.version} · {c.note}
        </p>
      </div>
    </main>
  );
}
