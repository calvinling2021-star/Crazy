"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Container from "@/components/layout/Container";
import Link from "next/link";

export default function ContactCTA() {
  return (
    <section className="py-24 md:py-32 lg:py-40 bg-molecule-dark">
      <div className="h-[1px] bg-gradient-to-r from-transparent via-molecule-gold/40 to-transparent mb-24" />
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center max-w-3xl mx-auto"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-5xl font-light tracking-tight text-molecule-white mb-6"
          >
            Ready to Turn Prompts Into
            <br />
            <span className="text-molecule-gold">Passive Income?</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-molecule-silver leading-relaxed mb-10">
            Join thousands of creators earning royalties every month without a label, a studio, or a music degree.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/studio"
              className="bg-molecule-gold text-molecule-black px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-molecule-gold-light transition-all duration-200"
            >
              Start Generating
            </Link>
            <Link
              href="/contact"
              className="border border-molecule-gold text-molecule-gold px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-molecule-gold hover:text-molecule-black transition-all duration-200"
            >
              Contact Us
            </Link>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
