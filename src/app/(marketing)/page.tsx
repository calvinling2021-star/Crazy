import Hero from "@/components/sections/Hero";
import AboutPreview from "@/components/sections/AboutPreview";
import InvestmentThesis from "@/components/sections/InvestmentThesis";
import FocusAreas from "@/components/sections/FocusAreas";
import Stats from "@/components/sections/Stats";
import PortfolioGrid from "@/components/sections/PortfolioGrid";
import ContactCTA from "@/components/sections/ContactCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <AboutPreview />
      <InvestmentThesis />
      <FocusAreas />
      <Stats />
      <PortfolioGrid />
      <ContactCTA />
    </>
  );
}
