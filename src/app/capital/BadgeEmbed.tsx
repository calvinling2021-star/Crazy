"use client";

import { useEffect, useState } from "react";

export function BadgeEmbed() {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  const badgeUrl = `${origin}/api/badge`;
  const linkUrl = `${origin}/attestly`;
  const markdown = `[![Verified by Attestly](${badgeUrl})](${linkUrl})`;
  const html = `<a href="${linkUrl}"><img src="${badgeUrl}" alt="Verified by Attestly" /></a>`;

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-sm font-medium text-neutral-200">Your Verified Builder badge</p>
      <p className="mb-3 text-xs text-neutral-500">
        Show your verified revenue on your site, X bio, or Product Hunt. Updates automatically.
      </p>
      {origin && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={badgeUrl} alt="Verified by Attestly" className="mb-4 h-[38px]" />
      )}
      <div className="space-y-2">
        {([
          ["Markdown", markdown],
          ["HTML", html],
        ] as const).map(([label, snippet]) => (
          <div key={label} className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 font-mono text-[11px] text-neutral-400" title={snippet}>
              {snippet}
            </code>
            <button
              onClick={() => copy(snippet, label)}
              className="shrink-0 rounded-lg bg-[#3DD68C] px-3 py-1.5 text-[11px] font-semibold text-[#0B0F14]"
            >
              {copied === label ? "Copied" : `Copy ${label}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
