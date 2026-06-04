// Attestly brand marks (docs/ipo-os/21 "The Seam"). Two rails merging into one verified node.
import type { CSSProperties } from "react";

export function AttestlyMark({ size = 28, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Attestly" style={style}>
      <rect width="64" height="64" rx="16" fill="#0B0F14" />
      <path d="M14 44 C26 44 30 32 42 32 L50 32" stroke="#3DD68C" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M14 20 C26 20 30 32 42 32" stroke="#5B8CFF" strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="32" r="4.5" fill="#E8EDF2" />
    </svg>
  );
}

export function AttestlyWordmark({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <AttestlyMark size={size + 6} />
      <span
        className="font-mono font-semibold tracking-tight text-[#E8EDF2]"
        style={{ fontSize: size }}
      >
        attestly
      </span>
      <span className="ml-0.5 inline-block h-2 w-2 rounded-full bg-[#3DD68C]" aria-hidden />
    </span>
  );
}
