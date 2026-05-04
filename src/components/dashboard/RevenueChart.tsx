"use client";

import { motion } from "framer-motion";
import { monthlyData } from "@/data/analytics";

export default function RevenueChart() {
  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue));
  const last6 = monthlyData.slice(-8);

  return (
    <div className="bg-molecule-dark border border-molecule-gray/20 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-molecule-white">Revenue Growth</h3>
          <p className="text-xs text-molecule-muted mt-1">Monthly royalty earnings</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-light text-molecule-gold">
            ${monthlyData[monthlyData.length - 1].revenue.toLocaleString()}
          </div>
          <div className="text-xs text-molecule-muted">This month</div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-36">
        {last6.map((d, i) => {
          const height = Math.max(4, (d.revenue / maxRevenue) * 100);
          const isLast = i === last6.length - 1;
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                className={`w-full rounded-sm ${isLast ? "bg-molecule-gold" : "bg-molecule-gray/60"}`}
                style={{ minHeight: "4px" }}
                title={`${d.month}: $${d.revenue.toLocaleString()}`}
              />
            </div>
          );
        })}
      </div>

      {/* X labels */}
      <div className="flex gap-2 mt-2">
        {last6.map((d) => (
          <div key={d.month} className="flex-1 text-center">
            <span className="text-[9px] text-molecule-muted">{d.month.split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
