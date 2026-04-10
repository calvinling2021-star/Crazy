"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeUp, scaleIn, staggerContainer } from "@/lib/animations";
import Container from "@/components/layout/Container";
import SectionLabel from "@/components/ui/SectionLabel";
import ContactCTA from "@/components/sections/ContactCTA";
import InvestmentThesis from "@/components/sections/InvestmentThesis";
import { portfolioCompanies } from "@/data/portfolio";
import clsx from "clsx";

const filters = ["All", "Therapeutics", "MedTech", "Digital Health"] as const;

export default function InvestmentsPage() {
  const [active, setActive] = useState<string>("All");

  const filtered =
    active === "All"
      ? portfolioCompanies
      : portfolioCompanies.filter((c) => c.sector === active);

  return (
    <>
      {/* Page Header */}
      <section className="pt-40 pb-20 md:pt-48 md:pb-28">
        <Container>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto"
          >
            <SectionLabel text="Investments" />
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-molecule-white mb-6"
            >
              Our Portfolio
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg text-molecule-silver"
            >
              Backing transformative companies across the healthcare ecosystem.
            </motion.p>
          </motion.div>
        </Container>
      </section>

      {/* Filter + Grid */}
      <section className="pb-24 md:pb-32">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActive(filter)}
                className={clsx(
                  "px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 border",
                  active === filter
                    ? "bg-molecule-gold text-molecule-black border-molecule-gold"
                    : "bg-transparent text-molecule-silver border-molecule-gray/30 hover:border-molecule-gold/40 hover:text-molecule-gold"
                )}
              >
                {filter}
              </button>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((company) => (
              <motion.div
                key={company.name}
                variants={scaleIn}
                layout
                className="bg-molecule-dark border border-molecule-gray/20 p-8 hover:border-molecule-gold/40 transition-all duration-500 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-molecule-white group-hover:text-molecule-gold transition-colors duration-300">
                    {company.name}
                  </h3>
                </div>
                <p className="text-sm text-molecule-silver leading-relaxed mb-6">
                  {company.description}
                </p>
                <div className="flex gap-3">
                  <span className="text-xs px-3 py-1 bg-molecule-charcoal text-molecule-gold border border-molecule-gray/20">
                    {company.sector}
                  </span>
                  <span className="text-xs px-3 py-1 bg-molecule-charcoal text-molecule-muted border border-molecule-gray/20">
                    {company.stage}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      <InvestmentThesis />
      <ContactCTA />
    </>
  );
}
