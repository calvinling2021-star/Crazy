import { MonthlyData, PlatformStat } from "@/lib/types";

export const monthlyData: MonthlyData[] = [
  { month: "Jan '24", revenue: 1200, streams: 310000, tracks: 3 },
  { month: "Feb '24", revenue: 2100, streams: 520000, tracks: 7 },
  { month: "Mar '24", revenue: 3400, streams: 845000, tracks: 12 },
  { month: "Apr '24", revenue: 5200, streams: 1290000, tracks: 18 },
  { month: "May '24", revenue: 6800, streams: 1695000, tracks: 23 },
  { month: "Jun '24", revenue: 8400, streams: 2090000, tracks: 29 },
  { month: "Jul '24", revenue: 9600, streams: 2390000, tracks: 32 },
  { month: "Aug '24", revenue: 10800, streams: 2690000, tracks: 35 },
  { month: "Sep '24", revenue: 12200, streams: 3040000, tracks: 38 },
  { month: "Oct '24", revenue: 13600, streams: 3390000, tracks: 41 },
  { month: "Nov '24", revenue: 14800, streams: 3685000, tracks: 44 },
  { month: "Dec '24", revenue: 15600, streams: 3885000, tracks: 44 },
  { month: "Jan '25", revenue: 16200, streams: 4040000, tracks: 45 },
  { month: "Feb '25", revenue: 16800, streams: 4190000, tracks: 47 },
];

export const platformStats: PlatformStat[] = [
  {
    platform: "spotify",
    label: "Spotify",
    streams: 1885500,
    revenue: 7542,
    percentage: 45,
    color: "#1DB954",
  },
  {
    platform: "apple_music",
    label: "Apple Music",
    streams: 921700,
    revenue: 3687,
    percentage: 22,
    color: "#FC3C44",
  },
  {
    platform: "youtube_music",
    label: "YouTube Music",
    streams: 628800,
    revenue: 2515,
    percentage: 15,
    color: "#FF0000",
  },
  {
    platform: "amazon_music",
    label: "Amazon Music",
    streams: 419000,
    revenue: 1676,
    percentage: 10,
    color: "#FF9900",
  },
  {
    platform: "tidal",
    label: "Tidal",
    streams: 209500,
    revenue: 1258,
    percentage: 5,
    color: "#000000",
  },
  {
    platform: "deezer",
    label: "Deezer",
    streams: 125500,
    revenue: 502,
    percentage: 3,
    color: "#A238FF",
  },
];

export const nichePerformance = [
  { niche: "sleep", label: "Sleep", monthlyRevenue: 5376, monthlyStreams: 1344000, percentage: 32 },
  { niche: "focus", label: "Focus", monthlyRevenue: 1828, monthlyStreams: 457000, percentage: 11 },
  { niche: "lofi", label: "Lo-fi", monthlyRevenue: 1654, monthlyStreams: 413500, percentage: 10 },
  { niche: "meditation", label: "Meditation", monthlyRevenue: 2248, monthlyStreams: 562000, percentage: 13 },
  { niche: "nature", label: "Nature", monthlyRevenue: 852, monthlyStreams: 213000, percentage: 5 },
  { niche: "ambient", label: "Ambient", monthlyRevenue: 646, monthlyStreams: 161500, percentage: 4 },
];

export const recentActivity = [
  { type: "stream_milestone", track: "Deep Sleep Ocean Waves", detail: "Crossed 1.2M streams", time: "2 hours ago" },
  { type: "royalty_paid", track: "Spotify", detail: "$7,542 deposited to account", time: "1 day ago" },
  { type: "playlist_add", track: "Delta Wave Sleep Music", detail: "Added to 'Sleep Music' editorial playlist", time: "2 days ago" },
  { type: "track_live", track: "Lake Evening Crickets", detail: "Now live on all 6 platforms", time: "3 days ago" },
  { type: "stream_milestone", track: "Tibetan Bowl Morning", detail: "Crossed 600K streams", time: "4 days ago" },
  { type: "playlist_add", track: "Deep Work Alpha Waves", detail: "Added to 'Study Focus' curated playlist", time: "5 days ago" },
  { type: "royalty_paid", track: "Apple Music", detail: "$3,687 deposited to account", time: "6 days ago" },
  { type: "track_live", track: "Abstract Textures", detail: "Distribution complete on Spotify + Apple", time: "1 week ago" },
];
