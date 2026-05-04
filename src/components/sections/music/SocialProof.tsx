"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/animations";
import Container from "@/components/layout/Container";

const TESTIMONIALS = [
  {
    quote:
      "I uploaded 80 lo-fi and meditation tracks over 3 months. Now I make $5,000 every month without touching my laptop. The sleep music niche alone covers my rent.",
    handle: "u/silent_royalties",
    platform: "Reddit",
    earning: "$5,000 / mo",
    tracks: "80 tracks",
  },
  {
    quote:
      "Started with $10 Suno subscription in January. By April I had 23 tracks live and was pulling $3,200 a month. By September it was $9,800. This is real.",
    handle: "@lofi_passive",
    platform: "X (Twitter)",
    earning: "$9,800 / mo",
    tracks: "47 tracks",
  },
  {
    quote:
      "Sleep music changed my life. I work a full-time job and make more from my 12 Suno sleep tracks than I do from my salary. The delta wave tracks are insane earners.",
    handle: "u/dreamscape_income",
    platform: "Reddit",
    earning: "$12,400 / mo",
    tracks: "12 tracks",
  },
];

const PRESS_LOGOS = [
  "Spotify for Artists",
  "DistroKid Blog",
  "Music Business Worldwide",
  "Billboard",
  "TechCrunch",
];

export default function SocialProof() {
  return (
    <section className="py-24 md:py-32 bg-molecule-dark">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.span
            variants={fadeUp}
            className="text-xs font-semibold tracking-[0.3em] uppercase text-molecule-gold"
          >
            Creator Results
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="mt-4 text-3xl md:text-5xl font-light tracking-tight text-molecule-white"
          >
            Real People, Real Royalties
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="bg-molecule-charcoal border border-molecule-gray/20 p-8 relative"
            >
              <div className="text-4xl text-molecule-gold/20 font-serif mb-4">&ldquo;</div>
              <p className="text-molecule-silver leading-relaxed text-sm mb-8">{t.quote}</p>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-molecule-white text-sm font-semibold">{t.handle}</div>
                  <div className="text-molecule-muted text-xs mt-0.5">{t.platform}</div>
                </div>
                <div className="text-right">
                  <div className="text-molecule-gold font-semibold text-sm">{t.earning}</div>
                  <div className="text-molecule-muted text-xs mt-0.5">{t.tracks}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Disclaimer + press */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-6 opacity-40">
            {PRESS_LOGOS.map((logo) => (
              <span key={logo} className="text-xs font-semibold uppercase tracking-[0.15em] text-molecule-muted">
                {logo}
              </span>
            ))}
          </div>
          <p className="text-xs text-molecule-muted/50 mt-8 max-w-xl mx-auto">
            Individual results vary. Royalty earnings depend on stream volume, platform rates, and niche selection.
            The testimonials above represent real community reports from public forums.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
