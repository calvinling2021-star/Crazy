import { NextResponse } from "next/server";
import { getTotalStats } from "@/data/tracks";
import { monthlyData, platformStats, nichePerformance } from "@/data/analytics";

export async function GET() {
  const totals = getTotalStats();

  const prevMonthRevenue = monthlyData[monthlyData.length - 2]?.revenue ?? 0;
  const currMonthRevenue = monthlyData[monthlyData.length - 1]?.revenue ?? 0;
  const revenueGrowth = prevMonthRevenue
    ? Math.round(((currMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
    : 0;

  const prevMonthStreams = monthlyData[monthlyData.length - 2]?.streams ?? 0;
  const currMonthStreams = monthlyData[monthlyData.length - 1]?.streams ?? 0;
  const streamGrowth = prevMonthStreams
    ? Math.round(((currMonthStreams - prevMonthStreams) / prevMonthStreams) * 100)
    : 0;

  return NextResponse.json({
    summary: {
      totalStreams: totals.totalStreams,
      totalRevenue: totals.totalRevenue,
      activeTracks: 47,
      monthlyStreams: totals.monthlyStreams,
      monthlyRevenue: totals.monthlyRevenue,
      revenueGrowth,
      streamGrowth,
      topNiche: "sleep",
    },
    monthly: monthlyData,
    platforms: platformStats,
    niches: nichePerformance,
  });
}
