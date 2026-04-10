"use client";

import { motion } from "framer-motion";
import { fadeUp, scaleIn, staggerContainer } from "@/lib/animations";
import Container from "@/components/layout/Container";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import { portfolioCompanies } from "@/data/portfolio";

export default function PortfolioGrid() {
  const featured = portfolioCompanies.slice(0, 6);

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
            <SectionLabel text="Portfolio" />
          </div>
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-5xl font-light tracking-tight text-molecule-white mb-4"
          >
            Select Investments
          </motion.h2>
          <motion.p variants={fadeUp} className="text-molecule-silver">
            A sample of companies we are proud to support.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {featured.map((company) => (
            <motion.div
              key={company.name}
              variants={scaleIn}
              className="bg-molecule-dark border border-molecule-gray/20 p-8 hover:border-molecule-gold/40 transition-all duration-500 group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-molecule-white group-hover:text-molecule-gold transition-colors duration-300">
                  {company.name}
                </h3>
              </div>
              <p className="text-sm text-molecule-silver leading-relaxed mb-4">
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

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center"
        >
          <Button href="/investments" variant="secondary">
            View All Investments
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}
