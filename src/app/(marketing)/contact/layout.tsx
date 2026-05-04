import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the SoundMint team. Questions about AI music monetization, platform features, or enterprise plans.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
