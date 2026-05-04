"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/animations";
import Container from "@/components/layout/Container";

const STEPS = [
  {
    step: "01",
    title: "Pick Your Niche",
    description:
      "Choose from sleep, meditation, focus, lo-fi, ambient, or nature sounds. These niches have zero competition from major labels and millions of daily listeners.",
    cost: "Free",
    detail: "6 proven niches",
  },
  {
    step: "02",
    title: "Generate with Suno AI",
    description:
      "Paste a prompt into Suno.com and generate a full, professional-quality track in under 30 seconds. No music theory, no equipment, no skills required.",
    cost: "$10/mo",
    detail: "Suno Pro subscription",
  },
  {
    step: "03",
    title: "Distribute Everywhere",
    description:
      "Upload to DistroKid and your track goes live on Spotify, Apple Music, YouTube Music, Amazon Music, and 150+ other platforms within 24–48 hours.",
    cost: "$23/yr",
    detail: "DistroKid annual fee",
  },
  {
    step: "04",
    title: "Collect Royalties",
    description:
      "Royalties accumulate with every stream — while you sleep, work, or create more tracks. Scale to 50+ tracks and hit $5K–$30K per month in passive income.",
    cost: "Unlimited",
    detail: "Keep ~90% of royalties",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 lg:py-40 bg-molecule-dark">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.span
            variants={fadeUp}
            className="text-xs font-semibold tracking-[0.3em] uppercase text-molecule-gold"
          >
            The System
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="mt-4 text-3xl md:text-5xl font-light tracking-tight text-molecule-white"
          >
            Four Steps to{" "}
            <span className="text-molecule-gold">Passive Income</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-6 text-molecule-silver leading-relaxed">
            The total cost to start: $33/year. The return: potentially thousands per month.
            Here&apos;s the exact workflow used by hundreds of creators right now.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {STEPS.map((step) => (
            <motion.div
              key={step.step}
              variants={fadeUp}
              className="bg-molecule-charcoal border border-molecule-gray/20 p-8 hover:border-molecule-gold/30 transition-all duration-500 relative group"
            >
              <span className="text-4xl font-light text-molecule-gold/30 group-hover:text-molecule-gold/50 transition-colors duration-500 block mb-6">
                {step.step}
              </span>
              <h3 className="text-lg font-semibold text-molecule-white mb-3">{step.title}</h3>
              <p className="text-sm text-molecule-silver leading-relaxed mb-6">{step.description}</p>
              <div className="border-t border-molecule-gray/30 pt-4">
                <div className="text-molecule-gold font-semibold text-sm">{step.cost}</div>
                <div className="text-molecule-muted text-xs mt-0.5">{step.detail}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Total cost callout */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-6 bg-molecule-charcoal border border-molecule-gold/20 px-8 py-5">
            <div>
              <div className="text-2xl font-light text-molecule-gold">$33 / year</div>
              <div className="text-xs text-molecule-muted uppercase tracking-[0.1em] mt-0.5">Total startup cost</div>
            </div>
            <div className="w-[1px] h-10 bg-molecule-gray" />
            <div>
              <div className="text-2xl font-light text-molecule-gold">$16,800+ / mo</div>
              <div className="text-xs text-molecule-muted uppercase tracking-[0.1em] mt-0.5">Current earnings (47 tracks)</div>
            </div>
            <div className="w-[1px] h-10 bg-molecule-gray" />
            <div>
              <div className="text-2xl font-light text-molecule-gold">510x</div>
              <div className="text-xs text-molecule-muted uppercase tracking-[0.1em] mt-0.5">Annual ROI</div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
