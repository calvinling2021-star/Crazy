import { recentActivity } from "@/data/analytics";

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  stream_milestone: { icon: "🎯", color: "#C9A84C" },
  royalty_paid: { icon: "💰", color: "#10B981" },
  playlist_add: { icon: "📋", color: "#8B5CF6" },
  track_live: { icon: "🚀", color: "#3B82F6" },
};

export default function RecentActivity() {
  return (
    <div className="bg-molecule-dark border border-molecule-gray/20 p-6">
      <h3 className="text-sm font-semibold text-molecule-white mb-5">Recent Activity</h3>
      <div className="flex flex-col gap-1">
        {recentActivity.map((item, i) => {
          const config = TYPE_ICONS[item.type] ?? { icon: "•", color: "#6B7280" };
          return (
            <div
              key={i}
              className="flex items-start gap-3 py-3 border-b border-molecule-gray/15 last:border-b-0"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm mt-0.5"
                style={{ backgroundColor: config.color + "15" }}
              >
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-molecule-white">{item.track}</p>
                <p className="text-xs text-molecule-silver mt-0.5">{item.detail}</p>
              </div>
              <span className="text-[10px] text-molecule-muted flex-shrink-0 mt-1">{item.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
