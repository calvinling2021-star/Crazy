import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Molecule Capital — our mission, values, and approach to healthcare investing.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
