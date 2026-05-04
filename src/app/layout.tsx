import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://soundmint.io"),
  title: {
    default: "SoundMint | AI Music Monetization Platform",
    template: "%s | SoundMint",
  },
  description:
    "Turn AI-generated music into passive income. Create sleep, meditation, and focus tracks with Suno AI, distribute to 150+ platforms, and earn royalties while you sleep.",
  keywords: [
    "ai music monetization",
    "suno ai",
    "passive income music",
    "spotify royalties",
    "sleep music",
    "meditation music",
    "lofi beats",
    "music distribution",
    "distrokid",
  ],
  authors: [{ name: "SoundMint" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://soundmint.io",
    siteName: "SoundMint",
    title: "SoundMint | AI Music Monetization Platform",
    description:
      "Generate AI music, distribute to 150+ platforms, earn royalties on autopilot.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-molecule-black text-molecule-white">
        {children}
      </body>
    </html>
  );
}
