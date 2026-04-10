"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Container from "@/components/layout/Container";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-molecule-charcoal via-molecule-black to-molecule-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.08)_0%,transparent_60%)]" />

      {/* Decorative molecule pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
          <circle cx="200" cy="300" r="100" stroke="#C9A84C" strokeWidth="0.5" />
          <circle cx="350" cy="200" r="60" stroke="#C9A84C" strokeWidth="0.5" />
          <circle cx="800" cy="400" r="120" stroke="#C9A84C" strokeWidth="0.5" />
          <circle cx="950" cy="250" r="80" stroke="#C9A84C" strokeWidth="0.5" />
          <circle cx="600" cy="600" r="90" stroke="#C9A84C" strokeWidth="0.5" />
          <line x1="280" y1="250" x2="310" y2="230" stroke="#C9A84C" strokeWidth="0.5" />
          <line x1="870" y1="340" x2="910" y2="290" stroke="#C9A84C" strokeWidth="0.5" />
        </svg>
      </div>

      <Container className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-molecule-gold">
            Molecule Capital
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[0.95] text-molecule-white"
        >
          Investing in the Future
          <br />
          <span className="text-molecule-gold">of Human Health</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 text-lg md:text-xl text-molecule-silver max-w-2xl mx-auto leading-relaxed"
        >
          A family office dedicated to healthcare &amp; biotech innovation
          across private and public markets.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button href="/investments">Our Investments</Button>
          <Button href="/contact" variant="secondary">
            Get in Touch
          </Button>
        </motion.div>
      </Container>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
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
