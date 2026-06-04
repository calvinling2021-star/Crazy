// Verified-by-Attestly badge (docs/ipo-os/22 — the growth loop). A self-contained, embeddable
// SVG generated from verified data. Timestamped + revocable in spirit: only render when verified.
export function compactMoney(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return "$" + n;
}

export function renderBadgeSvg(opts: { mrr: number; score: number; band: string }): string {
  const left = "Verified by Attestly";
  const right = `${compactMoney(opts.mrr)} MRR · Standing ${opts.score}`;
  const charW = 7.3; // ~13px mono
  const padX = 12;
  const markW = 22;
  const gap = 10;
  const leftW = left.length * charW;
  const rightW = right.length * charW;
  const dividerX = padX + markW + 8 + leftW + gap;
  const width = Math.ceil(dividerX + 1 + gap + rightW + padX);
  const h = 38;
  const cy = h / 2;
  const font = `font-family="JetBrains Mono, ui-monospace, SFMono-Regular, monospace" font-size="13"`;
  const markX = padX;
  const markScale = 0.3;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" role="img" aria-label="${left} — ${right}">
  <rect x="0.5" y="0.5" width="${width - 1}" height="${h - 1}" rx="9" fill="#0B0F14" stroke="#232C38"/>
  <g transform="translate(${markX},${cy - 9}) scale(${markScale})">
    <path d="M14 44 C26 44 30 32 42 32 L50 32" stroke="#3DD68C" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M14 20 C26 20 30 32 42 32" stroke="#5B8CFF" stroke-width="7" stroke-linecap="round" fill="none"/>
    <circle cx="50" cy="32" r="5" fill="#E8EDF2"/>
  </g>
  <text x="${padX + markW + 8}" y="${cy + 4}" ${font} fill="#E8EDF2"><tspan fill="#3DD68C">✓ </tspan>${left}</text>
  <line x1="${dividerX}" y1="9" x2="${dividerX}" y2="${h - 9}" stroke="#232C38"/>
  <text x="${dividerX + gap}" y="${cy + 4}" ${font} fill="#9AA7B5">${right}</text>
</svg>`;
}
