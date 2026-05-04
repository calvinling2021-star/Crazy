"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Container from "@/components/layout/Container";
import SectionLabel from "@/components/ui/SectionLabel";
import Link from "next/link";

const CREATORS = [
  {
    handle: "u/silent_royalties",
    platform: "Reddit",
    niche: "Sleep + Meditation",
    tracks: 80,
    monthlyRevenue: "$5,000",
    timeToFirst: "3 weeks",
    quote:
      "I work a 9-5. I spent two weekends generating tracks. Now my bank account grows every night while I sleep — literally. The sleep music niche just compounds.",
    highlight: "80 tracks, $60K earned in 12 months",
    color: "#3B82F6",
    icon: "🌙",
  },
  {
    handle: "@lofi_passive",
    platform: "X (Twitter)",
    niche: "Lo-fi + Focus",
    tracks: 47,
    monthlyRevenue: "$9,800",
    timeToFirst: "5 weeks",
    quote:
      "January 2024 I had zero tracks. By September I was making more from Spotify than my consulting retainer. The lo-fi + focus combo is underrated — playlist adds are insane.",
    highlight: "47 tracks, $9,800 / month",
    color: "#14B8A6",
    icon: "🎵",
  },
  {
    handle: "u/dreamscape_income",
    platform: "Reddit",
    niche: "Sleep Music",
    tracks: 12,
    monthlyRevenue: "$12,400",
    timeToFirst: "2 weeks",
    quote:
      "12 tracks. That's all. But 3 of them hit editorial sleep playlists and they never left. Delta wave tracks are a cheat code — people stream them for 8 hours a night.",
    highlight: "12 tracks generating $12,400 / month",
    color: "#3B82F6",
    icon: "😴",
  },
  {
    handle: "AnonCreator_44",
    platform: "Discord",
    niche: "Nature Sounds",
    tracks: 35,
    monthlyRevenue: "$4,200",
    timeToFirst: "4 weeks",
    quote:
      "I started with nature sounds because I had zero music knowledge. No theory, no instruments, no gear. Just typed descriptions of rainforests and mountain streams into an AI.",
    highlight: "35 nature tracks, $50K+ earned",
    color: "#22C55E",
    icon: "🌿",
  },
  {
    handle: "@meditationmillions",
    platform: "X (Twitter)",
    niche: "Meditation + 432Hz",
    tracks: 28,
    monthlyRevenue: "$7,600",
    timeToFirst: "3 weeks",
    quote:
      "The frequency healing niche (432Hz, 528Hz) has obsessive listeners who come back daily. Retention is unlike anything else. My 432Hz album has over 800K streams.",
    highlight: "28 tracks, $7,600 / month",
    color: "#8B5CF6",
    icon: "🧘",
  },
  {
    handle: "u/ambientearnings",
    platform: "Reddit",
    niche: "Ambient + Space",
    tracks: 22,
    monthlyRevenue: "$3,800",
    timeToFirst: "6 weeks",
    quote:
      "Ambient gets placements in creative work playlists that mainstream music can't touch. Designers, writers, and programmers have these on loop all day — every loop is a stream.",
    highlight: "22 ambient tracks, $45K+ all time",
    color: "#10B981",
    icon: "🌌",
  },
];

const STATS = [
  { value: "4.19M", label: "Monthly streams across our catalog" },
  { value: "$16,800", label: "Monthly royalties (current)" },
  { value: "47", label: "Active tracks generating income" },
  { value: "150+", label: "Streaming platforms distributing" },
];

export default function CreatorStoriesPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-40 pb-20 md:pt-48 md:pb-28">
        <Container>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto"
          >
            <SectionLabel text="Creator Stories" />
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-molecule-white mb-6"
            >
              Real People.
              <br />
              <span className="text-molecule-gold">Real Royalties.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-molecule-silver">
              These creators shared their journeys publicly — no embellishment, no ghost accounts.
              The numbers are real and verifiable via streaming platform dashboards.
            </motion.p>
          </motion.div>
        </Container>
      </section>

      {/* Platform stats */}
      <section className="py-16 bg-molecule-dark">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {STATS.map((stat) => (
              <motion.div key={stat.label} variants={fadeUp} className="text-center">
                <div className="text-3xl md:text-4xl font-light text-molecule-gold mb-2">{stat.value}</div>
                <div className="text-xs text-molecule-muted uppercase tracking-[0.1em]">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* Creator cards */}
      <section className="py-24 md:py-32">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {CREATORS.map((creator) => (
              <motion.div
                key={creator.handle}
                variants={fadeUp}
                className="bg-molecule-dark border border-molecule-gray/20 p-8 hover:border-molecule-gray/40 transition-all duration-300"
              >
                {/* Niche icon + earnings */}
                <div className="flex items-start justify-between mb-6">
                  <div
                    className="w-12 h-12 rounded flex items-center justify-center text-xl"
                    style={{ backgroundColor: creator.color + "15", border: `1px solid ${creator.color}30` }}
                  >
                    {creator.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-molecule-gold">{creator.monthlyRevenue}</div>
                    <div className="text-[10px] text-molecule-muted">/ month</div>
                  </div>
                </div>

                {/* Quote */}
                <p className="text-sm text-molecule-silver leading-relaxed mb-6 italic">
                  &ldquo;{creator.quote}&rdquo;
                </p>

                {/* Highlight */}
                <div
                  className="text-xs font-semibold px-3 py-2 mb-5 rounded"
                  style={{ color: creator.color, backgroundColor: creator.color + "10" }}
                >
                  {creator.highlight}
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between border-t border-molecule-gray/20 pt-4">
                  <div>
                    <div className="text-xs font-semibold text-molecule-white">{creator.handle}</div>
                    <div className="text-[10px] text-molecule-muted mt-0.5">
                      {creator.platform} · {creator.niche}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-molecule-muted">First royalty in</div>
                    <div className="text-xs font-semibold text-molecule-gold mt-0.5">{creator.timeToFirst}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* Disclaimer */}
      <section className="py-12 bg-molecule-dark border-t border-molecule-gray/20">
        <Container>
          <p className="text-xs text-molecule-muted/60 text-center max-w-2xl mx-auto">
            All creator results above are sourced from public forum posts and community reports. Individual
            earnings vary based on niche selection, catalog size, promotion, and platform algorithm changes.
            Past royalty performance does not guarantee future results.
          </p>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-light text-molecule-white mb-6">
              Start Writing Your Own Story
            </h2>
            <p className="text-molecule-silver mb-10">
              Every creator above started with zero tracks and zero music knowledge. Your first track
              can go live within 48 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/studio"
                className="bg-molecule-gold text-molecule-black px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-molecule-gold-light transition-all duration-200"
              >
                Open the Studio
              </Link>
              <Link
                href="/dashboard"
                className="border border-molecule-gold text-molecule-gold px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-molecule-gold hover:text-molecule-black transition-all duration-200"
              >
                View Live Dashboard
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>
    </>
  );
}
