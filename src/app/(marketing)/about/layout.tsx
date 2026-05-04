import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "SoundMint's mission: democratize music royalties through AI generation and automated distribution. No label needed.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
