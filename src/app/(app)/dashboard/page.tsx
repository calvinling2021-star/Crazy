import type { Metadata } from "next";
import RevenueOverview from "@/components/dashboard/RevenueOverview";
import RevenueChart from "@/components/dashboard/RevenueChart";
import TopTracks from "@/components/dashboard/TopTracks";
import PlatformBreakdown from "@/components/dashboard/PlatformBreakdown";
import RecentActivity from "@/components/dashboard/RecentActivity";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-molecule-white">Dashboard</h1>
          <p className="text-molecule-muted text-sm mt-1">
            Your AI music monetization overview — May 2025
          </p>
        </div>
        <Link
          href="/studio"
          className="bg-molecule-gold text-molecule-black px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] hover:bg-molecule-gold-light transition-colors duration-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Track
        </Link>
      </div>

      {/* KPI cards */}
      <RevenueOverview />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <PlatformBreakdown />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2">
          <TopTracks limit={7} />
        </div>
        <RecentActivity />
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/studio"
          className="bg-molecule-dark border border-molecule-gray/20 hover:border-molecule-gold/30 p-5 transition-all duration-300 group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-molecule-gold/10 border border-molecule-gold/20 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-molecule-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-molecule-white">Generate Tracks</h3>
          </div>
          <p className="text-xs text-molecule-muted leading-relaxed">
            Open the AI studio and create sleep, meditation, or focus music in 30 seconds.
          </p>
        </Link>

        <Link
          href="/catalog"
          className="bg-molecule-dark border border-molecule-gray/20 hover:border-molecule-gold/30 p-5 transition-all duration-300 group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-molecule-gold/10 border border-molecule-gold/20 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-molecule-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-molecule-white">Manage Catalog</h3>
          </div>
          <p className="text-xs text-molecule-muted leading-relaxed">
            View all 47 tracks, monitor individual performance, and manage distribution status.
          </p>
        </Link>

        <Link
          href="/analytics"
          className="bg-molecule-dark border border-molecule-gray/20 hover:border-molecule-gold/30 p-5 transition-all duration-300 group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-molecule-gold/10 border border-molecule-gold/20 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-molecule-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-molecule-white">View Analytics</h3>
          </div>
          <p className="text-xs text-molecule-muted leading-relaxed">
            Deep-dive into platform performance, niche breakdown, and revenue trends over time.
          </p>
        </Link>
      </div>
    </div>
  );
}
