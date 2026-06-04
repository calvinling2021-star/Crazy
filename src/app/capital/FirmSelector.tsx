"use client";

import { useState } from "react";

interface ProviderOpt {
  id: string;
  name: string;
  type: string;
}
interface Line {
  id: string;
  item: string;
  category: string;
  status: "ready" | "auto_preparing" | "needs_you";
  humanSignoff: boolean;
}
interface Checklist {
  providerName: string;
  providerType: string;
  readinessPct: number;
  lines: Line[];
  providerExtras: string[];
  sourceUrl?: string;
}

const statusStyle: Record<string, string> = {
  ready: "text-emerald-300",
  auto_preparing: "text-sky-300",
  needs_you: "text-amber-300",
};
const statusLabel: Record<string, string> = {
  ready: "✓ ready",
  auto_preparing: "◐ auto-preparing",
  needs_you: "✎ needs you",
};

export function FirmSelector({ providers }: { providers: ProviderOpt[] }) {
  const [id, setId] = useState("");
  const [data, setData] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(pid: string) {
    setId(pid);
    setData(null);
    if (!pid) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cdp/checklist/${pid}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <select
        value={id}
        onChange={(e) => load(e.target.value)}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
      >
        <option value="">Select a firm / lender…</option>
        {providers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.type})
          </option>
        ))}
      </select>

      {loading && <p className="mt-4 text-sm text-neutral-400">Assembling checklist…</p>}

      {data && (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{data.providerName}</p>
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-sm font-bold text-emerald-300">
              {data.readinessPct}% ready
            </span>
          </div>
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {data.lines.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-neutral-800 px-3 py-1.5">
                <span className="truncate text-xs text-neutral-300" title={l.item}>
                  {l.item}
                </span>
                <span className={`ml-2 shrink-0 text-[11px] ${statusStyle[l.status]}`}>{statusLabel[l.status]}</span>
              </div>
            ))}
          </div>
          {data.providerExtras.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">Firm-specific extras</p>
              <ul className="mt-1 list-disc pl-5 text-xs text-neutral-400">
                {data.providerExtras.slice(0, 6).map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
