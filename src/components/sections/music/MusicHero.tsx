"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const TICKERS = [
  { label: "Monthly Streams", value: "4.2M" },
  { label: "Monthly Revenue", value: "$16,800" },
  { label: "Active Tracks", value: "47" },
  { label: "Platforms", value: "150+" },
];

export default function MusicHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-molecule-charcoal via-molecule-black to-molecule-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(201,168,76,0.06)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.05)_0%,transparent_50%)]" />

      {/* Waveform decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-[0.06]">
        <svg viewBox="0 0 1440 120" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,60 C60,20 120,100 180,60 C240,20 300,100 360,60 C420,20 480,100 540,60 C600,20 660,100 720,60 C780,20 840,100 900,60 C960,20 1020,100 1080,60 C1140,20 1200,100 1260,60 C1320,20 1380,80 1440,60 L1440,120 L0,120 Z"
            fill="#C9A84C"
          />
        </svg>
      </div>

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-molecule-gold/10 border border-molecule-gold/20 px-4 py-2 rounded-full mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-molecule-gold animate-pulse" />
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-molecule-gold">
            Earning $16,800 this month — autopilot
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[0.95] text-molecule-white"
        >
          Turn AI Music Into
          <br />
          <span className="text-molecule-gold">Passive Income</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 text-lg md:text-xl text-molecule-silver max-w-2xl mx-auto leading-relaxed"
        >
          No music degree. No studio. No label. Generate sleep, meditation, and focus tracks
          with Suno AI — distribute to 150+ platforms — collect royalties while you sleep.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/studio"
            className="bg-molecule-gold text-molecule-black px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-molecule-gold-light transition-all duration-200"
          >
            Start Generating Tracks
          </Link>
          <Link
            href="/dashboard"
            className="border border-molecule-gold text-molecule-gold px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-molecule-gold hover:text-molecule-black transition-all duration-200"
          >
            View Live Dashboard
          </Link>
        </motion.div>

        {/* Stats ticker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-molecule-gray/30 pt-12"
        >
          {TICKERS.map((ticker) => (
            <div key={ticker.label} className="text-center">
              <div className="text-2xl md:text-3xl font-light text-molecule-gold mb-1">
                {ticker.value}
              </div>
              <div className="text-xs text-molecule-muted uppercase tracking-[0.1em]">
                {ticker.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-[1px] h-12 bg-gradient-to-b from-molecule-gold to-transparent"
        />
      </motion.div>
    </section>
  );
}
