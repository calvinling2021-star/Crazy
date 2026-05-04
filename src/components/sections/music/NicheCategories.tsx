"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { staggerContainer, fadeUp } from "@/lib/animations";
import Container from "@/components/layout/Container";
import { niches } from "@/data/niches";

export default function NicheCategories() {
  return (
    <section id="niches" className="py-24 md:py-32 lg:py-40">
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
            Where the Money Is
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="mt-4 text-3xl md:text-5xl font-light tracking-tight text-molecule-white"
          >
            The 6 Most Profitable{" "}
            <span className="text-molecule-gold">AI Music Niches</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-6 text-molecule-silver leading-relaxed">
            These niches are specifically chosen because major labels ignore them, listeners stream
            for hours at a time, and there&apos;s no need for vocals, lyrics, or musical talent.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {niches.map((niche) => (
            <motion.div
              key={niche.id}
              variants={fadeUp}
              className="bg-molecule-dark border border-molecule-gray/20 p-8 hover:border-molecule-gray/50 transition-all duration-500 group"
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  className="w-12 h-12 rounded flex items-center justify-center text-xl"
                  style={{ backgroundColor: niche.color + "20", border: `1px solid ${niche.color}30` }}
                >
                  {niche.icon}
                </div>
                <div
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                  style={{
                    color: niche.color,
                    borderColor: niche.color + "40",
                    backgroundColor: niche.color + "10",
                  }}
                >
                  {niche.avgMonthlyRevenue} / mo
                </div>
              </div>

              <h3 className="text-xl font-semibold text-molecule-white mb-3">{niche.label}</h3>
              <p className="text-sm text-molecule-silver leading-relaxed mb-6">{niche.description}</p>

              <div className="border-t border-molecule-gray/30 pt-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-molecule-muted uppercase tracking-[0.1em] mb-1">Avg Monthly Streams</div>
                  <div className="text-sm font-semibold text-molecule-white">{niche.avgMonthlyStreams}</div>
                </div>
                <Link
                  href={`/studio?niche=${niche.id}`}
                  className="text-xs font-semibold uppercase tracking-[0.1em] transition-colors duration-200"
                  style={{ color: niche.color }}
                >
                  Start Creating →
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
