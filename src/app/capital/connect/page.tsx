import Link from "next/link";
import type { Metadata } from "next";
import { AttestlyWordmark } from "@/components/attestly/Logo";
import { liveDataConfigured } from "@/lib/cdp";

export const metadata: Metadata = { title: { absolute: "Attestly — Connect read-only" } };
export const dynamic = "force-dynamic";

const canSee = [
  "Revenue & charges (to verify and reconcile)",
  "Refunds & chargebacks",
  "Payouts to your bank (for rail→bank reconciliation)",
  "Available balance",
];
const cannot = [
  "Move, hold, or withdraw your money",
  "Create charges or issue refunds",
  "Change any setting in your account",
  "Share your data with anyone without your say-so",
];

export default function ConnectPage() {
  const live = liveDataConfigured();
  return (
    <main className="min-h-screen bg-[#0B0F14] text-[#E8EDF2] px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <AttestlyWordmark size={20} />
          <Link href="/capital" className="text-sm text-[#9AA7B5]">Skip to dashboard →</Link>
        </header>

        <h1 className="text-3xl font-semibold">Connect read-only</h1>
        <p className="mt-3 text-[#9AA7B5]">
          Attestly verifies your numbers by reading them from the source. We connect to{" "}
          <span className="text-[#E8EDF2]">observe and verify</span> — never to touch your money.
          You can disconnect and delete your data in one click, anytime.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#232C38] bg-[#11161D] p-5">
            <p className="font-mono text-xs uppercase tracking-wide text-[#3DD68C]">What Attestly can see</p>
            <ul className="mt-3 space-y-2 text-sm text-[#9AA7B5]">
              {canSee.map((x) => (
                <li key={x} className="flex gap-2"><span className="text-[#3DD68C]">●</span>{x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[#232C38] bg-[#11161D] p-5">
            <p className="font-mono text-xs uppercase tracking-wide text-[#F2585B]">What Attestly can never do</p>
            <ul className="mt-3 space-y-2 text-sm text-[#9AA7B5]">
              {cannot.map((x) => (
                <li key={x} className="flex gap-2"><span className="text-[#F2585B]">×</span>{x}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#232C38] bg-[#11161D] p-6">
          {live ? (
            <>
              <p className="text-sm text-[#3DD68C]">● Live Stripe connection detected (read-only key configured).</p>
              <Link href="/capital" className="mt-4 inline-block rounded-lg bg-[#3DD68C] px-5 py-2.5 text-sm font-semibold text-[#0B0F14]">
                View your verified Standing →
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-[#E8EDF2]">Connect your revenue</p>
              <p className="mt-1 text-sm text-[#9AA7B5]">
                In production this is a one-click Stripe OAuth grant with read-only scopes. For local
                testing, set a restricted, read-only <code className="font-mono text-[#E8EDF2]">STRIPE_SECRET_KEY</code>{" "}
                in <code className="font-mono text-[#E8EDF2]">.env</code> and reload — or explore the demo now.
              </p>
              <div className="mt-4 flex gap-3">
                <button disabled className="cursor-not-allowed rounded-lg bg-[#5B8CFF]/40 px-5 py-2.5 text-sm font-semibold text-[#0B0F14]">
                  Connect Stripe (read-only) — OAuth in prod
                </button>
                <Link href="/capital" className="rounded-lg border border-[#232C38] px-5 py-2.5 text-sm text-[#9AA7B5]">
                  Explore the demo →
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 font-mono text-xs text-[#5E6B7A]">
          read-only by design · the key is seamless, not the fund.
        </p>
      </div>
    </main>
  );
}
