import { getTopTracks } from "@/data/tracks";
import { NICHE_LABELS } from "@/lib/constants";
import { MusicNiche } from "@/lib/types";

const NICHE_COLORS: Record<MusicNiche, string> = {
  sleep: "#3B82F6",
  meditation: "#8B5CF6",
  focus: "#F59E0B",
  lofi: "#14B8A6",
  ambient: "#10B981",
  nature: "#22C55E",
};

export default function TopTracks({ limit = 7 }: { limit?: number }) {
  const top = getTopTracks(limit);

  return (
    <div className="bg-molecule-dark border border-molecule-gray/20 p-6">
      <h3 className="text-sm font-semibold text-molecule-white mb-5">Top Tracks by Monthly Streams</h3>
      <div className="flex flex-col">
        {top.map((track, i) => {
          const maxStreams = top[0].monthlyStreams;
          const barWidth = (track.monthlyStreams / maxStreams) * 100;
          return (
            <div
              key={track.id}
              className="flex items-center gap-4 py-3 border-b border-molecule-gray/15 last:border-b-0"
            >
              <span className="text-xs text-molecule-muted w-4 flex-shrink-0 text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-molecule-white truncate">{track.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm"
                    style={{
                      color: NICHE_COLORS[track.niche],
                      backgroundColor: NICHE_COLORS[track.niche] + "15",
                    }}
                  >
                    {NICHE_LABELS[track.niche]}
                  </span>
                  {/* Mini bar */}
                  <div className="flex-1 h-[3px] bg-molecule-gray/30 rounded-full overflow-hidden max-w-[80px]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: NICHE_COLORS[track.niche],
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-semibold text-molecule-white">
                  {(track.monthlyStreams / 1000).toFixed(0)}K
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">
                  +${track.monthlyRevenue.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
