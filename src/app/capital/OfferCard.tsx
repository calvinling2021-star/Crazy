"use client";

import { useState } from "react";

interface Offer {
  lender: string;
  product: string;
  amount: number;
  feePct: number;
  termMonths: number;
  estMonthlyRepayment: number;
}

const money = (n: number) => "$" + n.toLocaleString();

export function OfferCard({ offer }: { offer: Offer }) {
  const [state, setState] = useState<"idle" | "requested">("idle");
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{offer.lender}</span>
        <span className="font-mono text-lg font-bold text-[#3DD68C]">{money(offer.amount)}</span>
      </div>
      <p className="text-xs text-neutral-400">{offer.product}</p>
      <p className="mt-1 font-mono text-xs text-neutral-500">
        {(offer.feePct * 100).toFixed(1)}% fee · {offer.termMonths}mo · ~{money(offer.estMonthlyRepayment)}/mo
      </p>
      {state === "idle" ? (
        <button
          onClick={() => setState("requested")}
          className="mt-3 w-full rounded-lg bg-[#3DD68C] px-3 py-1.5 text-xs font-semibold text-[#0B0F14]"
        >
          Draw {money(offer.amount)} — funds in 24h
        </button>
      ) : (
        <div className="mt-3 rounded-lg border border-[#3DD68C]/40 bg-[#3DD68C]/10 px-3 py-1.5 text-center text-xs text-[#3DD68C]">
          ✓ Draw requested — {offer.lender} finalizes terms (indicative)
        </div>
      )}
    </div>
  );
}
