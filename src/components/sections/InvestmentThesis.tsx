"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Container from "@/components/layout/Container";
import SectionLabel from "@/components/ui/SectionLabel";
import {
  BeakerIcon,
  ArrowTrendingUpIcon,
  GlobeAltIcon,
  HandRaisedIcon,
} from "@heroicons/react/24/outline";

const criteria = [
  {
    icon: BeakerIcon,
    title: "Sectors",
    description:
      "Therapeutics, Diagnostics, MedTech, Digital Health, Life Science Tools",
  },
  {
    icon: ArrowTrendingUpIcon,
    title: "Stage",
    description: "Seed through Growth Equity, Select Public Markets",
  },
  {
    icon: GlobeAltIcon,
    title: "Geography",
    description: "North America, with Selective Global Opportunities",
  },
  {
    icon: HandRaisedIcon,
    title: "Approach",
    description:
      "Active Partnership, Board-Level Engagement, Long-Term Horizon",
  },
];

export default function InvestmentThesis() {
  return (
    <section className="py-24 md:py-32 lg:py-40 bg-molecule-dark">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="flex flex-col items-center">
            <SectionLabel text="Investment Thesis" />
          </div>
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-5xl font-light tracking-tight text-molecule-white mb-6"
          >
            Where Science Meets Capital
          </motion.h2>
          <motion.p variants={fadeUp} className="text-molecule-silver leading-relaxed">
            We seek companies at the intersection of scientific innovation and
            commercial viability, backing teams that are redefining the
            boundaries of healthcare.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
        >
          {criteria.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              className="bg-molecule-charcoal border border-molecule-gray/20 p-8 md:p-10 hover:border-molecule-gold/40 transition-all duration-500"
            >
              <item.icon className="w-8 h-8 text-molecule-gold mb-6" />
              <h3 className="text-xl font-semibold text-molecule-white mb-3">
                {item.title}
              </h3>
              <p className="text-molecule-silver leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
