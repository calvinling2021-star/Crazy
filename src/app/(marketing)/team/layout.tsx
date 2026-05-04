import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Stories",
  description:
    "Real creators, real royalties. How everyday people are building $5K–$30K/month passive income with SoundMint.",
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
