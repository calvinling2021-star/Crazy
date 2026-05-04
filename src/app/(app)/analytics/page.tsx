"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/animations";
import { monthlyData, platformStats, nichePerformance, recentActivity } from "@/data/analytics";
import { getTotalStats } from "@/data/tracks";

const NICHE_COLORS: Record<string, string> = {
  sleep: "#3B82F6",
  meditation: "#8B5CF6",
  focus: "#F59E0B",
  lofi: "#14B8A6",
  ambient: "#10B981",
  nature: "#22C55E",
};

function MetricCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: string }) {
  return (
    <div className="bg-molecule-dark border border-molecule-gray/20 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-molecule-muted mb-3">{label}</p>
      <p className="text-3xl font-light text-molecule-white mb-1">{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-2">
          {trend && (
            <span className="text-xs font-semibold text-emerald-400">▲ {trend}</span>
          )}
          {sub && <span className="text-xs text-molecule-muted">{sub}</span>}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const stats = getTotalStats();
  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue));
  const maxStreams = Math.max(...monthlyData.map((d) => d.streams));
  const maxNicheRevenue = Math.max(...nichePerformance.map((n) => n.monthlyRevenue));

  const prevMonth = monthlyData[monthlyData.length - 2];
  const currMonth = monthlyData[monthlyData.length - 1];
  const revenueGrowth = prevMonth
    ? Math.round(((currMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100)
    : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-molecule-white">Analytics</h1>
        <p className="text-molecule-muted text-sm mt-1">
          Full performance data across all tracks and platforms
        </p>
      </div>

      {/* KPI row */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <motion.div variants={fadeUp}>
          <MetricCard
            label="This Month Revenue"
            value={`$${currMonth.revenue.toLocaleString()}`}
            trend={`${revenueGrowth}%`}
            sub="vs last month"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <MetricCard
            label="This Month Streams"
            value={`${(currMonth.streams / 1000000).toFixed(1)}M`}
            trend="3.7%"
            sub="vs last month"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <MetricCard
            label="All-Time Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            sub="since Jan 2024"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <MetricCard
            label="All-Time Streams"
            value={`${(stats.totalStreams / 1000000).toFixed(1)}M`}
            sub="across 47 tracks"
          />
        </motion.div>
      </motion.div>

      {/* Revenue growth chart */}
      <div className="bg-molecule-dark border border-molecule-gray/20 p-6 mb-4">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-sm font-semibold text-molecule-white">Monthly Revenue (14 months)</h2>
            <p className="text-xs text-molecule-muted mt-1">
              Jan 2024 → Feb 2025 · {monthlyData.length} data points
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-emerald-400 font-semibold">+{revenueGrowth}% MoM</div>
            <div className="text-xs text-molecule-muted mt-0.5">14x growth since Jan</div>
          </div>
        </div>

        {/* Revenue bars */}
        <div className="flex items-end gap-1.5 h-44 mb-2">
          {monthlyData.map((d, i) => {
            const h = Math.max(2, (d.revenue / maxRevenue) * 100);
            const isLast = i === monthlyData.length - 1;
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-0.5">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.5, delay: i * 0.04, ease: "easeOut" }}
                  className={`w-full rounded-sm cursor-pointer group relative ${
                    isLast ? "bg-molecule-gold" : "bg-molecule-gray/50 hover:bg-molecule-gray"
                  }`}
                  title={`${d.month}: $${d.revenue.toLocaleString()}`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          {monthlyData.map((d) => (
            <div key={d.month} className="flex-1 text-center">
              <span className="text-[8px] text-molecule-muted">{d.month.split(" ")[0]}&apos;{d.month.split("'")[1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Platform + Niche row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Platform breakdown detailed */}
        <div className="bg-molecule-dark border border-molecule-gray/20 p-6">
          <h2 className="text-sm font-semibold text-molecule-white mb-5">Platform Revenue Breakdown</h2>

          {/* Stacked bar */}
          <div className="h-3 flex rounded-full overflow-hidden mb-5">
            {platformStats.map((p) => (
              <motion.div
                key={p.platform}
                initial={{ width: 0 }}
                animate={{ width: `${p.percentage}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full"
                style={{ backgroundColor: p.color }}
                title={`${p.label}: ${p.percentage}%`}
              />
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {platformStats.map((p) => (
              <div key={p.platform} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-molecule-white">{p.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-molecule-muted">{p.percentage}%</span>
                      <span className="text-xs font-semibold text-molecule-white w-16 text-right">
                        ${p.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-molecule-gray/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.percentage}%` }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                  </div>
                  <p className="text-[10px] text-molecule-muted mt-1">
                    {(p.streams / 1000000).toFixed(2)}M streams
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Niche performance */}
        <div className="bg-molecule-dark border border-molecule-gray/20 p-6">
          <h2 className="text-sm font-semibold text-molecule-white mb-5">Niche Revenue Performance</h2>
          <div className="flex flex-col gap-4">
            {[...nichePerformance].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).map((n) => {
              const barW = (n.monthlyRevenue / maxNicheRevenue) * 100;
              return (
                <div key={n.niche}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{["🌙", "🧘", "🎯", "🎵", "🌌", "🌿"][["sleep","meditation","focus","lofi","ambient","nature"].indexOf(n.niche)] || "♪"}</span>
                      <span className="text-xs font-medium text-molecule-white">{n.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-molecule-muted">{(n.monthlyStreams / 1000).toFixed(0)}K streams</span>
                      <span className="text-xs font-semibold text-emerald-400">${n.monthlyRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-molecule-gray/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barW}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: NICHE_COLORS[n.niche] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-molecule-gray/20 flex items-center justify-between">
            <span className="text-xs text-molecule-muted">Total monthly royalties</span>
            <span className="text-sm font-semibold text-molecule-gold">
              ${nichePerformance.reduce((s, n) => s + n.monthlyRevenue, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Stream volume chart */}
      <div className="bg-molecule-dark border border-molecule-gray/20 p-6 mb-4">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-sm font-semibold text-molecule-white">Monthly Stream Volume</h2>
            <p className="text-xs text-molecule-muted mt-1">Total plays across all platforms</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-light text-molecule-gold">
              {(currMonth.streams / 1000000).toFixed(2)}M
            </div>
            <div className="text-xs text-molecule-muted">This month</div>
          </div>
        </div>

        <div className="flex items-end gap-1.5 h-28 mb-2">
          {monthlyData.map((d, i) => {
            const h = Math.max(2, (d.streams / maxStreams) * 100);
            const isLast = i === monthlyData.length - 1;
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.5, delay: i * 0.04 + 0.2 }}
                  className={`w-full rounded-sm ${isLast ? "bg-niche-focus" : "bg-molecule-gray/40"}`}
                  style={{ backgroundColor: isLast ? "#F59E0B" : undefined }}
                  title={`${d.month}: ${(d.streams / 1000000).toFixed(2)}M streams`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          {monthlyData.map((d) => (
            <div key={d.month} className="flex-1 text-center">
              <span className="text-[8px] text-molecule-muted">{d.month.split(" ")[0]}&apos;{d.month.split("'")[1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Catalog growth + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Catalog size over time */}
        <div className="bg-molecule-dark border border-molecule-gray/20 p-6">
          <h2 className="text-sm font-semibold text-molecule-white mb-5">Catalog Growth</h2>
          <div className="flex items-end gap-1.5 h-28 mb-2">
            {monthlyData.map((d, i) => {
              const maxTracks = Math.max(...monthlyData.map((m) => m.tracks));
              const h = Math.max(2, (d.tracks / maxTracks) * 100);
              const isLast = i === monthlyData.length - 1;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.5, delay: i * 0.04 + 0.3 }}
                    className="w-full rounded-sm"
                    style={{ backgroundColor: isLast ? "#8B5CF6" : "#2A2A2A" }}
                    title={`${d.month}: ${d.tracks} tracks`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1.5 mb-4">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex-1 text-center">
                <span className="text-[8px] text-molecule-muted">{d.month.split(" ")[0]}&apos;{d.month.split("'")[1]}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-molecule-muted border-t border-molecule-gray/20 pt-4">
            <span>Started: Jan 2024 (3 tracks)</span>
            <span className="text-molecule-white font-semibold">Now: 47 tracks</span>
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-molecule-dark border border-molecule-gray/20 p-6">
          <h2 className="text-sm font-semibold text-molecule-white mb-5">Recent Activity</h2>
          <div className="flex flex-col gap-1">
            {recentActivity.slice(0, 6).map((item, i) => {
              const icons: Record<string, string> = {
                stream_milestone: "🎯",
                royalty_paid: "💰",
                playlist_add: "📋",
                track_live: "🚀",
              };
              return (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-molecule-gray/15 last:border-b-0">
                  <span className="text-sm flex-shrink-0">{icons[item.type] ?? "•"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-molecule-white">{item.track}</p>
                    <p className="text-xs text-molecule-muted">{item.detail}</p>
                  </div>
                  <span className="text-[10px] text-molecule-muted flex-shrink-0">{item.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
