import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio & Investments",
  description:
    "Explore Molecule Capital's portfolio of healthcare and biotech investments across therapeutics, medtech, and digital health.",
};

export default function InvestmentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
