"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Container from "@/components/layout/Container";
import SectionLabel from "@/components/ui/SectionLabel";
import ContactCTA from "@/components/sections/ContactCTA";
import { teamMembers } from "@/data/team";

export default function TeamPage() {
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
            <SectionLabel text="Team" />
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-molecule-white mb-6"
            >
              The People Behind Molecule
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg text-molecule-silver"
            >
              Operators, scientists, and investors united by a passion for
              healthcare.
            </motion.p>
          </motion.div>
        </Container>
      </section>

      {/* Team Grid */}
      <section className="pb-24 md:pb-32">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {teamMembers.map((member) => (
              <motion.div
                key={member.name}
                variants={fadeUp}
                className="group"
              >
                {/* Photo placeholder */}
                <div className="aspect-[3/4] bg-molecule-dark border border-molecule-gray/20 flex items-center justify-center mb-6 group-hover:border-molecule-gold/40 transition-all duration-500 overflow-hidden">
                  <span className="text-5xl font-light text-molecule-gold/40 group-hover:text-molecule-gold/70 transition-colors duration-500">
                    {member.initials}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-molecule-white mb-1">
                  {member.name}
                </h3>
                <p className="text-sm text-molecule-gold mb-3">
                  {member.title}
                </p>
                <p className="text-sm text-molecule-silver leading-relaxed">
                  {member.bio}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* Advisory note */}
      <section className="py-16 bg-molecule-dark">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center"
          >
            <p className="text-molecule-muted text-sm">
              Molecule Capital also benefits from a network of operating advisors
              and scientific consultants across therapeutics, diagnostics, and
              digital health.
            </p>
          </motion.div>
        </Container>
      </section>

      <ContactCTA />
    </>
  );
}
