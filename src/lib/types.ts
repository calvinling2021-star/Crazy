export interface TeamMember {
  name: string;
  title: string;
  bio: string;
  initials: string;
}

export interface PortfolioCompany {
  name: string;
  description: string;
  sector: "Therapeutics" | "MedTech" | "Digital Health";
  stage: string;
}

export interface Stat {
  value: string;
  label: string;
  numericValue?: number;
  prefix?: string;
  suffix?: string;
}

// ── Music monetization types ────────────────────────────────────────────────

export type MusicNiche =
  | "sleep"
  | "meditation"
  | "focus"
  | "lofi"
  | "ambient"
  | "nature";

export type TrackStatus = "generating" | "distributing" | "live" | "failed";

export type StreamingPlatform =
  | "spotify"
  | "apple_music"
  | "youtube_music"
  | "amazon_music"
  | "tidal"
  | "deezer";

export interface Track {
  id: string;
  title: string;
  prompt: string;
  niche: MusicNiche;
  duration: number; // seconds
  streams: number;
  revenue: number; // USD all-time
  monthlyStreams: number;
  monthlyRevenue: number;
  platforms: StreamingPlatform[];
  status: TrackStatus;
  tags: string[];
  createdAt: string;
  distributedAt?: string;
}

export interface NicheCategory {
  id: MusicNiche;
  label: string;
  icon: string;
  description: string;
  avgMonthlyStreams: string;
  avgMonthlyRevenue: string;
  color: string;
  promptTemplates: PromptTemplate[];
}

export interface PromptTemplate {
  id: string;
  label: string;
  prompt: string;
  tags: string[];
}

export interface PlatformStat {
  platform: StreamingPlatform;
  label: string;
  streams: number;
  revenue: number;
  percentage: number;
  color: string;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  streams: number;
  tracks: number;
}

export interface GenerationJob {
  id: string;
  prompt: string;
  niche: MusicNiche;
  title: string;
  status: "queued" | "generating" | "distributing" | "completed" | "failed";
  progress: number;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalStreams: number;
  totalRevenue: number;
  activeTracks: number;
  monthlyStreams: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
  streamGrowth: number;
  topNiche: MusicNiche;
}
