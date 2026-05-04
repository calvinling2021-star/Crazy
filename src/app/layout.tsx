import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  display: "swap",
  variable: "--font-inter",
});

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
    <html lang="en" className={`h-full antialiased ${inter.variable}`}>
      <body className="min-h-full bg-molecule-black text-molecule-white font-sans">
        {children}
      </body>
    </html>
  );
}
