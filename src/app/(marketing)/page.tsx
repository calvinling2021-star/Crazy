import MusicHero from "@/components/sections/music/MusicHero";
import HowItWorks from "@/components/sections/music/HowItWorks";
import NicheCategories from "@/components/sections/music/NicheCategories";
import SocialProof from "@/components/sections/music/SocialProof";
import Pricing from "@/components/sections/music/Pricing";
import MusicCTA from "@/components/sections/music/MusicCTA";

export default function HomePage() {
  return (
    <>
      <MusicHero />
      <HowItWorks />
      <NicheCategories />
      <SocialProof />
      <Pricing />
      <MusicCTA />
    </>
  );
}
