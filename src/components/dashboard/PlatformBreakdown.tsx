import { platformStats } from "@/data/analytics";

export default function PlatformBreakdown() {
  return (
    <div className="bg-molecule-dark border border-molecule-gray/20 p-6">
      <h3 className="text-sm font-semibold text-molecule-white mb-5">Platform Breakdown</h3>

      {/* Stacked bar */}
      <div className="h-3 flex rounded-full overflow-hidden mb-5">
        {platformStats.map((p) => (
          <div
            key={p.platform}
            className="h-full transition-all duration-500"
            style={{ width: `${p.percentage}%`, backgroundColor: p.color }}
            title={`${p.label}: ${p.percentage}%`}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {platformStats.map((p) => (
          <div key={p.platform} className="flex items-center gap-3">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-xs text-molecule-silver flex-1">{p.label}</span>
            <span className="text-xs text-molecule-muted w-8 text-right">{p.percentage}%</span>
            <span className="text-xs font-semibold text-molecule-white w-16 text-right">
              ${p.revenue.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-molecule-gray/20 flex items-center justify-between">
        <span className="text-xs text-molecule-muted">Total monthly</span>
        <span className="text-xs font-semibold text-molecule-gold">
          ${platformStats.reduce((s, p) => s + p.revenue, 0).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
