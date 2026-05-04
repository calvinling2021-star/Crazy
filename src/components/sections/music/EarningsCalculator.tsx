"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/animations";
import Container from "@/components/layout/Container";
import Link from "next/link";

interface NicheConfig {
  id: string;
  label: string;
  icon: string;
  avgStreamsPerTrack: number; // monthly
  ratePerStream: number;      // USD
  color: string;
  description: string;
}

const NICHES: NicheConfig[] = [
  { id: "sleep", label: "Sleep Music", icon: "🌙", avgStreamsPerTrack: 185000, ratePerStream: 0.004, color: "#3B82F6", description: "8-hr overnight listener sessions" },
  { id: "meditation", label: "Meditation", icon: "🧘", avgStreamsPerTrack: 98000, ratePerStream: 0.004, color: "#8B5CF6", description: "Daily repeat listeners" },
  { id: "focus", label: "Focus / Study", icon: "🎯", avgStreamsPerTrack: 80000, ratePerStream: 0.004, color: "#F59E0B", description: "2-4 hr work/study sessions" },
  { id: "lofi", label: "Lo-fi Beats", icon: "🎵", avgStreamsPerTrack: 62000, ratePerStream: 0.004, color: "#14B8A6", description: "Playlist culture, high add rate" },
  { id: "nature", label: "Nature Sounds", icon: "🌿", avgStreamsPerTrack: 52000, ratePerStream: 0.004, color: "#22C55E", description: "Zero music theory required" },
  { id: "ambient", label: "Ambient", icon: "🌌", avgStreamsPerTrack: 42000, ratePerStream: 0.004, color: "#10B981", description: "Creative work playlists" },
];

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function TrackCounter({
  value,
  onChange,
  color,
}: {
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-7 h-7 border border-molecule-gray/40 text-molecule-muted hover:border-molecule-gold/40 hover:text-molecule-gold transition-colors text-sm flex items-center justify-center rounded"
      >
        −
      </button>
      <div
        className="w-10 text-center text-sm font-semibold"
        style={{ color: value > 0 ? color : "#6B7280" }}
      >
        {value}
      </div>
      <button
        onClick={() => onChange(Math.min(100, value + 1))}
        className="w-7 h-7 border border-molecule-gray/40 text-molecule-muted hover:border-molecule-gold/40 hover:text-molecule-gold transition-colors text-sm flex items-center justify-center rounded"
      >
        +
      </button>
    </div>
  );
}

export default function EarningsCalculator() {
  const [counts, setCounts] = useState<Record<string, number>>({
    sleep: 5,
    meditation: 3,
    focus: 4,
    lofi: 6,
    nature: 2,
    ambient: 2,
  });

  const totals = useMemo(() => {
    let streams = 0;
    let revenue = 0;
    let tracks = 0;
    NICHES.forEach((n) => {
      const c = counts[n.id] ?? 0;
      streams += c * n.avgStreamsPerTrack;
      revenue += c * n.avgStreamsPerTrack * n.ratePerStream;
      tracks += c;
    });
    return { streams, revenue, tracks, annualRevenue: revenue * 12 };
  }, [counts]);

  const setCount = (id: string, v: number) => setCounts((p) => ({ ...p, [id]: v }));

  const annualROI = totals.annualRevenue / 33; // $33 startup cost

  return (
    <section id="calculator" className="py-24 md:py-32 lg:py-40 bg-molecule-charcoal">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <motion.span variants={fadeUp} className="text-xs font-semibold tracking-[0.3em] uppercase text-molecule-gold">
            Earnings Calculator
          </motion.span>
          <motion.h2 variants={fadeUp} className="mt-4 text-3xl md:text-5xl font-light tracking-tight text-molecule-white">
            What Would <span className="text-molecule-gold">Your Catalog</span> Earn?
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-6 text-molecule-silver leading-relaxed">
            Adjust the number of tracks per niche to see your projected monthly royalties.
            Calculations use real per-stream averages from our live catalog.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6"
        >
          {/* Left: sliders */}
          <div className="lg:col-span-3 bg-molecule-dark border border-molecule-gray/20 p-6 md:p-8">
            <h3 className="text-sm font-semibold text-molecule-white mb-6">
              Number of Tracks per Niche
            </h3>
            <div className="flex flex-col divide-y divide-molecule-gray/15">
              {NICHES.map((niche) => {
                const nicheRevenue = (counts[niche.id] ?? 0) * niche.avgStreamsPerTrack * niche.ratePerStream;
                return (
                  <div key={niche.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div
                        className="w-9 h-9 rounded flex items-center justify-center text-base flex-shrink-0"
                        style={{ backgroundColor: niche.color + "15" }}
                      >
                        {niche.icon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-molecule-white">{niche.label}</p>
                            <p className="text-[10px] text-molecule-muted mt-0.5">{niche.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {nicheRevenue > 0 ? (
                              <p className="text-xs font-semibold text-emerald-400">
                                +${fmt(nicheRevenue)} / mo
                              </p>
                            ) : (
                              <p className="text-xs text-molecule-muted/50">—</p>
                            )}
                            <p className="text-[10px] text-molecule-muted/60 mt-0.5">
                              {fmt(niche.avgStreamsPerTrack / 1000)}K streams / track
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-2 h-1 bg-molecule-gray/20 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${((counts[niche.id] ?? 0) / 20) * 100}%`,
                              backgroundColor: niche.color,
                            }}
                          />
                        </div>
                      </div>

                      {/* Counter */}
                      <TrackCounter
                        value={counts[niche.id] ?? 0}
                        onChange={(v) => setCount(niche.id, v)}
                        color={niche.color}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: results panel */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Main result */}
            <div className="bg-molecule-dark border border-molecule-gold/20 p-8 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-molecule-muted mb-4">
                Projected Monthly Royalties
              </p>
              <motion.div
                key={Math.round(totals.revenue)}
                initial={{ scale: 0.97, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-5xl md:text-6xl font-light text-molecule-gold mb-1">
                  ${fmt(totals.revenue)}
                </p>
              </motion.div>
              <p className="text-molecule-muted text-sm mt-2">per month, passive</p>

              <div className="mt-8 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm border-b border-molecule-gray/20 pb-3">
                  <span className="text-molecule-muted">Total tracks</span>
                  <span className="font-semibold text-molecule-white">{totals.tracks}</span>
                </div>
                <div className="flex items-center justify-between text-sm border-b border-molecule-gray/20 pb-3">
                  <span className="text-molecule-muted">Monthly streams</span>
                  <span className="font-semibold text-molecule-white">
                    {totals.streams > 0 ? `${fmt(totals.streams / 1000)}K` : "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm border-b border-molecule-gray/20 pb-3">
                  <span className="text-molecule-muted">Annual royalties</span>
                  <span className="font-semibold text-emerald-400">
                    ${fmt(totals.annualRevenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-molecule-muted">Annual ROI on $33 cost</span>
                  <span className="font-semibold text-molecule-gold">
                    {totals.revenue > 0 ? `${fmt(annualROI)}x` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/studio"
              className="bg-molecule-gold text-molecule-black py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-molecule-gold-light transition-all duration-200 text-center"
            >
              Start Building This Catalog
            </Link>

            <p className="text-[10px] text-molecule-muted text-center leading-relaxed px-2">
              Estimates based on avg per-track streams from our 47-track live catalog.
              Actual results vary by niche, quality, and playlist placement.
            </p>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
