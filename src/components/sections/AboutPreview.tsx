"use client";

import { motion } from "framer-motion";
import { slideLeft, slideRight, staggerContainer } from "@/lib/animations";
import Container from "@/components/layout/Container";
import SectionLabel from "@/components/ui/SectionLabel";
import Link from "next/link";

const previewStats = [
  { value: "$250M+", label: "Capital Deployed" },
  { value: "40+", label: "Portfolio Companies" },
  { value: "20+", label: "Years of Experience" },
];

export default function AboutPreview() {
  return (
    <section className="py-24 md:py-32 lg:py-40">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <SectionLabel text="Who We Are" />
            <motion.h2
              variants={slideLeft}
              className="text-3xl md:text-5xl font-light tracking-tight text-molecule-white mb-8"
            >
              Capital with Conviction
            </motion.h2>
            <motion.p
              variants={slideLeft}
              className="text-molecule-silver leading-relaxed mb-6"
            >
              Molecule Capital is a family office focused exclusively on
              healthcare and biotech. We partner with visionary founders and
              management teams building transformative companies that improve
              patient outcomes and advance the science of medicine.
            </motion.p>
            <motion.p
              variants={slideLeft}
              className="text-molecule-silver leading-relaxed mb-8"
            >
              With a long-term investment horizon and deep sector expertise, we
              deploy patient capital across the full spectrum — from early-stage
              ventures to public market opportunities.
            </motion.p>
            <motion.div variants={slideLeft}>
              <Link
                href="/about"
                className="text-molecule-gold text-sm font-semibold uppercase tracking-[0.15em] hover:text-molecule-gold-light transition-colors duration-300 inline-flex items-center gap-2"
              >
                Learn More About Us
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex flex-col gap-8"
          >
            {previewStats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={slideRight}
                className="bg-molecule-dark border border-molecule-gray/30 p-8 md:p-10"
              >
                <div className="text-4xl md:text-5xl font-light text-molecule-gold mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-molecule-muted uppercase tracking-[0.1em]">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
