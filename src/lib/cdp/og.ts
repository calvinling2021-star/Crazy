// Social share card (1200x630) for build-in-public / Product Hunt — the growth loop (docs/ipo-os/22).
// Deterministic SVG from verified data. "I'm a Verified Builder."
import { compactMoney } from "./badge";

export function renderShareCardSvg(opts: {
  company: string;
  mrr: number;
  arr: number;
  score: number;
  band: string;
}): string {
  const { company, mrr, arr, score, band } = opts;
  const W = 1200;
  const H = 630;
  const mono = `font-family="JetBrains Mono, ui-monospace, SFMono-Regular, monospace"`;
  const sans = `font-family="Inter, system-ui, sans-serif"`;
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function stat(x: number, label: string, value: string) {
    return `
    <text x="${x}" y="430" ${mono} font-size="64" font-weight="700" fill="#E8EDF2">${esc(value)}</text>
    <text x="${x}" y="470" ${mono} font-size="22" fill="#5E6B7A">${esc(label)}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(company)} — Verified Builder">
  <rect width="${W}" height="${H}" fill="#0B0F14"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="none" stroke="#232C38"/>

  <!-- wordmark -->
  <g transform="translate(72,72)">
    <g transform="scale(0.7)">
      <path d="M14 44 C26 44 30 32 42 32 L50 32" stroke="#3DD68C" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M14 20 C26 20 30 32 42 32" stroke="#5B8CFF" stroke-width="7" stroke-linecap="round" fill="none"/>
      <circle cx="50" cy="32" r="5" fill="#E8EDF2"/>
    </g>
    <text x="58" y="36" ${mono} font-size="30" font-weight="600" fill="#E8EDF2">attestly</text>
  </g>

  <text x="72" y="250" ${sans} font-size="40" fill="#9AA7B5">${esc(company)} is a</text>
  <text x="72" y="320" ${sans} font-size="84" font-weight="800" fill="#E8EDF2">Verified <tspan fill="#3DD68C">Builder</tspan></text>

  ${stat(72, "Verified MRR", compactMoney(mrr))}
  ${stat(372, "Verified ARR", compactMoney(arr))}
  ${stat(672, `Standing (${band})`, String(score))}

  <text x="72" y="560" ${mono} font-size="24" fill="#5E6B7A">Verified, not vibes. · the key is seamless, not the fund.</text>
</svg>`;
}
