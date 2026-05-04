"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/animations";
import { getTotalStats } from "@/data/tracks";

function StatCard({
  label,
  value,
  change,
  positive,
  sub,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  sub?: string;
}) {
  return (
    <div className="bg-molecule-dark border border-molecule-gray/20 p-6 hover:border-molecule-gray/40 transition-colors duration-300">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-molecule-muted mb-3">{label}</p>
      <p className="text-3xl font-light text-molecule-white mb-2">{value}</p>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}>
          {positive ? "▲" : "▼"} {change}
        </span>
        <span className="text-xs text-molecule-muted">{sub || "vs last month"}</span>
      </div>
    </div>
  );
}

export default function RevenueOverview() {
  const stats = getTotalStats();

  const cards = [
    {
      label: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      change: "3.7%",
      positive: true,
      sub: "vs last month",
    },
    {
      label: "Monthly Streams",
      value: `${(stats.monthlyStreams / 1000000).toFixed(1)}M`,
      change: "3.7%",
      positive: true,
      sub: "vs last month",
    },
    {
      label: "All-Time Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: "$16,800",
      positive: true,
      sub: "added this month",
    },
    {
      label: "Active Tracks",
      value: "47",
      change: "2 new",
      positive: true,
      sub: "tracks live",
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((card) => (
        <motion.div key={card.label} variants={fadeUp}>
          <StatCard {...card} />
        </motion.div>
      ))}
    </motion.div>
  );
}
