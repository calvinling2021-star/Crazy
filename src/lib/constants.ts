export const NAV_LINKS = [
  { label: "Features", href: "/#how-it-works" },
  { label: "Niches", href: "/#niches" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Dashboard", href: "/dashboard" },
] as const;

export const APP_NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: "chart" },
  { label: "Studio", href: "/studio", icon: "sparkles" },
  { label: "Catalog", href: "/catalog", icon: "music" },
  { label: "Analytics", href: "/analytics", icon: "trending" },
] as const;

export const SITE_CONFIG = {
  name: "SoundMint",
  tagline: "Turn AI Music Into Passive Income",
  email: "hello@soundmint.io",
  location: "San Francisco, CA",
  url: "https://soundmint.io",
} as const;

export const PLATFORM_LABELS: Record<string, string> = {
  spotify: "Spotify",
  apple_music: "Apple Music",
  youtube_music: "YouTube Music",
  amazon_music: "Amazon Music",
  tidal: "Tidal",
  deezer: "Deezer",
};

export const NICHE_LABELS: Record<string, string> = {
  sleep: "Sleep Music",
  meditation: "Meditation",
  focus: "Focus",
  lofi: "Lo-fi",
  ambient: "Ambient",
  nature: "Nature Sounds",
};
