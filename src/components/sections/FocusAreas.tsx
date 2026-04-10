"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Container from "@/components/layout/Container";
import SectionLabel from "@/components/ui/SectionLabel";

const areas = [
  {
    number: "01",
    title: "Therapeutics & Biopharma",
    description:
      "Novel modalities, precision medicine, and next-generation drug development platforms transforming how we treat disease.",
  },
  {
    number: "02",
    title: "Medical Devices & Diagnostics",
    description:
      "Innovative tools transforming detection, monitoring, and treatment delivery across the continuum of care.",
  },
  {
    number: "03",
    title: "Digital Health & Health IT",
    description:
      "Technology-enabled solutions improving care access, efficiency, and patient outcomes at scale.",
  },
];

export default function FocusAreas() {
  return (
    <section className="py-24 md:py-32 lg:py-40">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="flex flex-col items-center">
            <SectionLabel text="Focus Areas" />
          </div>
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-5xl font-light tracking-tight text-molecule-white"
          >
            Deep Expertise, Defined Focus
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          {areas.map((area) => (
            <motion.div
              key={area.number}
              variants={fadeUp}
              className="bg-molecule-dark border border-molecule-gray/20 p-8 md:p-10 border-t-2 border-t-molecule-gold/60 hover:border-molecule-gold/40 transition-all duration-500"
            >
              <span className="text-4xl font-light text-molecule-gold/40 mb-6 block">
                {area.number}
              </span>
              <h3 className="text-xl font-semibold text-molecule-white mb-4">
                {area.title}
              </h3>
              <p className="text-molecule-silver leading-relaxed text-sm">
                {area.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
