"use client";

import { useState, useMemo } from "react";
import { tracks } from "@/data/tracks";
import { niches } from "@/data/niches";
import { MusicNiche, TrackStatus } from "@/lib/types";
import { NICHE_LABELS } from "@/lib/constants";
import Link from "next/link";
import clsx from "clsx";

const NICHE_COLORS: Record<MusicNiche, string> = {
  sleep: "#3B82F6",
  meditation: "#8B5CF6",
  focus: "#F59E0B",
  lofi: "#14B8A6",
  ambient: "#10B981",
  nature: "#22C55E",
};

const STATUS_STYLES: Record<TrackStatus, string> = {
  live: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  distributing: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  generating: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  failed: "text-red-400 bg-red-400/10 border-red-400/20",
};

const STATUS_LABELS: Record<TrackStatus, string> = {
  live: "Live",
  distributing: "Distributing",
  generating: "Generating",
  failed: "Failed",
};

type SortKey = "monthlyStreams" | "monthlyRevenue" | "streams" | "revenue" | "createdAt";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "monthlyStreams", label: "Monthly Streams" },
  { value: "monthlyRevenue", label: "Monthly Revenue" },
  { value: "streams", label: "All-Time Streams" },
  { value: "revenue", label: "All-Time Revenue" },
  { value: "createdAt", label: "Date Added" },
];

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function WaveIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
    </svg>
  );
}

export default function CatalogPage() {
  const [selectedNiche, setSelectedNiche] = useState<MusicNiche | "all">("all");
  const [sortBy, setSortBy] = useState<SortKey>("monthlyStreams");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let result = [...tracks];
    if (selectedNiche !== "all") result = result.filter((t) => t.niche === selectedNiche);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    result.sort((a, b) => {
      if (sortBy === "createdAt") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return (b[sortBy] as number) - (a[sortBy] as number);
    });
    return result;
  }, [selectedNiche, sortBy, searchQuery]);

  const totalMonthlyRevenue = filtered.reduce((s, t) => s + t.monthlyRevenue, 0);
  const totalMonthlyStreams = filtered.reduce((s, t) => s + t.monthlyStreams, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-molecule-white">Track Catalog</h1>
          <p className="text-molecule-muted text-sm mt-1">
            {tracks.length} tracks generating ${tracks.reduce((s, t) => s + t.monthlyRevenue, 0).toLocaleString()} / month
          </p>
        </div>
        <Link
          href="/studio"
          className="bg-molecule-gold text-molecule-black px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] hover:bg-molecule-gold-light transition-colors duration-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Track
        </Link>
      </div>

      {/* Summary bar */}
      {selectedNiche !== "all" && (
        <div
          className="flex items-center gap-6 p-4 border mb-6"
          style={{
            borderColor: NICHE_COLORS[selectedNiche] + "30",
            backgroundColor: NICHE_COLORS[selectedNiche] + "05",
          }}
        >
          <span className="text-2xl">{niches.find((n) => n.id === selectedNiche)?.icon}</span>
          <div className="flex items-center gap-8 flex-1">
            <div>
              <div className="text-xs text-molecule-muted mb-0.5">Tracks</div>
              <div className="text-sm font-semibold text-molecule-white">{filtered.length}</div>
            </div>
            <div>
              <div className="text-xs text-molecule-muted mb-0.5">Monthly Streams</div>
              <div className="text-sm font-semibold" style={{ color: NICHE_COLORS[selectedNiche] }}>
                {(totalMonthlyStreams / 1000).toFixed(0)}K
              </div>
            </div>
            <div>
              <div className="text-xs text-molecule-muted mb-0.5">Monthly Revenue</div>
              <div className="text-sm font-semibold text-emerald-400">
                ${totalMonthlyRevenue.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <svg
            className="w-4 h-4 text-molecule-muted absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search tracks or tags…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-molecule-dark border border-molecule-gray/30 pl-9 pr-4 py-2.5 text-sm text-molecule-white placeholder:text-molecule-muted/50 focus:border-molecule-gold focus:outline-none transition-colors duration-200"
          />
        </div>

        {/* Niche filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedNiche("all")}
            className={clsx(
              "px-4 py-2 text-xs font-semibold border transition-all duration-200",
              selectedNiche === "all"
                ? "bg-molecule-gold text-molecule-black border-molecule-gold"
                : "border-molecule-gray/30 text-molecule-muted hover:border-molecule-gray/60"
            )}
          >
            All ({tracks.length})
          </button>
          {niches.map((niche) => {
            const count = tracks.filter((t) => t.niche === niche.id).length;
            return (
              <button
                key={niche.id}
                onClick={() => setSelectedNiche(niche.id)}
                className={clsx(
                  "px-4 py-2 text-xs font-semibold border transition-all duration-200"
                )}
                style={
                  selectedNiche === niche.id
                    ? {
                        backgroundColor: niche.color + "15",
                        borderColor: niche.color + "50",
                        color: niche.color,
                      }
                    : {}
                }
              >
                {selectedNiche !== niche.id && (
                  <span className="text-molecule-muted border-molecule-gray/30">
                    {niche.icon} {niche.label} ({count})
                  </span>
                )}
                {selectedNiche === niche.id && (
                  <span>
                    {niche.icon} {niche.label} ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="bg-molecule-dark border border-molecule-gray/30 px-4 py-2.5 text-xs text-molecule-silver focus:border-molecule-gold focus:outline-none transition-colors duration-200 cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Track table */}
      <div className="bg-molecule-dark border border-molecule-gray/20 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_100px_100px_100px_80px_80px] gap-4 px-5 py-3 border-b border-molecule-gray/20">
          <div className="w-6" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-molecule-muted">Track</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-molecule-muted text-right">Mo. Streams</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-molecule-muted text-right">Mo. Revenue</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-molecule-muted text-right hidden lg:block">All-Time</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-molecule-muted text-center">Status</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-molecule-muted text-right">Duration</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-molecule-muted text-sm">
            No tracks found
          </div>
        ) : (
          <div className="divide-y divide-molecule-gray/10">
            {filtered.map((track, i) => (
              <div
                key={track.id}
                className="grid grid-cols-[auto_1fr_100px_100px_100px_80px_80px] gap-4 px-5 py-4 hover:bg-molecule-gray/10 transition-colors duration-150 group items-center"
              >
                {/* Rank / play */}
                <div className="w-6 flex items-center justify-center">
                  <span className="text-xs text-molecule-muted group-hover:hidden">{i + 1}</span>
                  <div className="hidden group-hover:flex text-molecule-gold">
                    <WaveIcon />
                  </div>
                </div>

                {/* Title + niche + tags */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-molecule-white truncate">{track.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm"
                      style={{
                        color: NICHE_COLORS[track.niche],
                        backgroundColor: NICHE_COLORS[track.niche] + "15",
                      }}
                    >
                      {NICHE_LABELS[track.niche]}
                    </span>
                    {track.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] text-molecule-muted/70 hidden md:inline">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Monthly streams */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-molecule-white">
                    {(track.monthlyStreams / 1000).toFixed(0)}K
                  </p>
                </div>

                {/* Monthly revenue */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-400">
                    ${track.monthlyRevenue.toLocaleString()}
                  </p>
                </div>

                {/* All-time revenue */}
                <div className="text-right hidden lg:block">
                  <p className="text-xs text-molecule-muted">${track.revenue.toLocaleString()}</p>
                  <p className="text-[10px] text-molecule-muted/50">
                    {(track.streams / 1000000).toFixed(1)}M streams
                  </p>
                </div>

                {/* Status */}
                <div className="flex justify-center">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${STATUS_STYLES[track.status]}`}>
                    {STATUS_LABELS[track.status]}
                  </span>
                </div>

                {/* Duration */}
                <div className="text-right">
                  <p className="text-xs text-molecule-muted">{formatDuration(track.duration)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer summary */}
        <div className="grid grid-cols-[auto_1fr_100px_100px_100px_80px_80px] gap-4 px-5 py-3 border-t border-molecule-gray/20 bg-molecule-charcoal/50">
          <div className="w-6" />
          <span className="text-xs text-molecule-muted">{filtered.length} tracks</span>
          <div className="text-right">
            <span className="text-xs font-semibold text-molecule-white">
              {(totalMonthlyStreams / 1000).toFixed(0)}K
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-emerald-400">
              ${totalMonthlyRevenue.toLocaleString()}
            </span>
          </div>
          <div className="hidden lg:block" />
          <div />
          <div />
        </div>
      </div>
    </div>
  );
}
