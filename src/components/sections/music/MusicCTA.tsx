"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { fadeUp } from "@/lib/animations";
import Container from "@/components/layout/Container";

export default function MusicCTA() {
  return (
    <section className="py-24 md:py-32 bg-molecule-charcoal border-t border-molecule-gray/30">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-molecule-gold">
            Get Started Today
          </span>
          <h2 className="mt-4 text-4xl md:text-6xl font-light tracking-tight text-molecule-white">
            Your First Track Could Go Live{" "}
            <span className="text-molecule-gold">in 24 Hours</span>
          </h2>
          <p className="mt-6 text-molecule-silver leading-relaxed">
            Every track you delay is royalties you&apos;re leaving on the table. The sleep music
            niche alone is adding thousands of new listeners every day — your catalog should be
            there to capture them.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/studio"
              className="bg-molecule-gold text-molecule-black px-10 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-molecule-gold-light transition-all duration-200"
            >
              Open the Studio
            </Link>
            <Link
              href="/catalog"
              className="text-molecule-gold text-sm font-semibold uppercase tracking-[0.15em] hover:text-molecule-gold-light transition-colors duration-200"
            >
              Browse Track Catalog →
            </Link>
          </div>

          <p className="mt-8 text-xs text-molecule-muted">
            Free to start · No credit card required · Cancel anytime
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
