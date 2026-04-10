import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Team",
  description:
    "Meet the Molecule Capital team — operators, scientists, and investors united by a passion for healthcare.",
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
