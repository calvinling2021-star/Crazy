import Link from "next/link";
import type { Metadata } from "next";
import { AttestlyWordmark, AttestlyMark } from "@/components/attestly/Logo";

export const metadata: Metadata = {
  title: { absolute: "Attestly — Verified, not vibes." },
  description:
    "Connect your revenue read-only. Attestly keeps your financials verified and auditable, builds your credit from day one, and puts instant, paperwork-free growth capital one prompt away — inside Claude, Cursor, and Codex.",
};

const pillars = [
  { t: "Verified, not vibes.", d: "Your financials are read directly from the source, reconciled, and auditable. Real numbers — to you, to lenders, to anyone you choose." },
  { t: "Credit from day one.", d: "We start scoring your business the moment you connect, so credibility compounds while you build. Meet Attestly Standing." },
  { t: "Capital without paperwork.", d: "Underwriting off audited data means no forms, no decks, no two-week wait. The data already proved it — the money just shows up. Meet Attestly Line." },
  { t: "Read-only by design.", d: "We connect to observe and verify — never to move, hold, or touch your money. Revoke in one click. Trust is the product." },
];

export default function AttestlyLanding() {
  return (
    <main className="min-h-screen bg-[#0B0F14] text-[#E8EDF2]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <AttestlyWordmark />
        <Link href="/capital" className="rounded-lg bg-[#3DD68C] px-4 py-2 text-sm font-semibold text-[#0B0F14]">
          Open dashboard
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#5E6B7A]">for vibe coders & indie AI builders</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
          Real numbers in.<br />Instant capital out.<br />
          <span className="text-[#3DD68C]">No paperwork.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[#9AA7B5]">
          Connect Stripe read-only. Attestly keeps your books verified, builds your credit from day
          one, and puts growth capital one prompt away — right inside Claude, Cursor, and Codex.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/capital/connect" className="rounded-lg bg-[#3DD68C] px-5 py-2.5 text-sm font-semibold text-[#0B0F14]">
            Connect read-only
          </Link>
          <a href="#how" className="rounded-lg border border-[#232C38] px-5 py-2.5 text-sm text-[#9AA7B5]">
            How it works
          </a>
        </div>
        <p className="mt-4 font-mono text-xs text-[#5E6B7A]">the key is seamless, not the fund.</p>
      </section>

      <section id="how" className="mx-auto grid max-w-4xl gap-4 px-6 py-12 sm:grid-cols-2">
        {pillars.map((p) => (
          <div key={p.t} className="rounded-2xl border border-[#232C38] bg-[#11161D] p-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3DD68C]" />
              <h3 className="font-semibold">{p.t}</h3>
            </div>
            <p className="text-sm text-[#9AA7B5]">{p.d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border border-[#232C38] bg-[#11161D] p-6">
          <p className="font-mono text-xs uppercase tracking-wide text-[#5E6B7A]">connect → standing → line</p>
          <ol className="mt-3 space-y-2 text-sm text-[#9AA7B5]">
            <li><span className="text-[#E8EDF2]">1. Attestly Connect</span> — link Stripe read-only (we never touch your money).</li>
            <li><span className="text-[#E8EDF2]">2. Attestly Standing</span> — a credit score from day one, built only from your real data.</li>
            <li><span className="text-[#E8EDF2]">3. Attestly Line</span> — instant, pre-qualified growth capital. Say the word.</li>
          </ol>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-12 text-center">
        <div className="flex items-center justify-center gap-2 text-[#5E6B7A]">
          <AttestlyMark size={20} />
          <span className="font-mono text-xs">attestly · verified, not vibes</span>
        </div>
      </footer>
    </main>
  );
}
