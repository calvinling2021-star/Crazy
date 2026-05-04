"use client";

import { motion } from "framer-motion";
import { fadeUp, slideLeft, slideRight, staggerContainer } from "@/lib/animations";
import Container from "@/components/layout/Container";
import SectionLabel from "@/components/ui/SectionLabel";
import ContactCTA from "@/components/sections/ContactCTA";

const values = [
  {
    title: "Scientific Rigor",
    description:
      "Every decision grounded in evidence and deep domain expertise. We understand the science behind the investments we make.",
  },
  {
    title: "Patient Capital",
    description:
      "Long-term horizons aligned with the pace of healthcare innovation. We measure success in decades, not quarters.",
  },
  {
    title: "True Partnership",
    description:
      "Active engagement that goes beyond the check. We roll up our sleeves and work alongside the teams we back.",
  },
];

const steps = [
  { step: "01", title: "Identify", description: "Source opportunities through deep network and scientific community" },
  { step: "02", title: "Diligence", description: "Rigorous evaluation combining scientific and commercial analysis" },
  { step: "03", title: "Invest", description: "Structure partnerships aligned with long-term value creation" },
  { step: "04", title: "Support", description: "Provide strategic guidance, connections, and operational expertise" },
  { step: "05", title: "Grow", description: "Help portfolio companies scale and achieve transformative impact" },
];

export default function AboutPage() {
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
            <SectionLabel text="About" />
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-molecule-white"
            >
              Rooted in Science.
              <br />
              <span className="text-molecule-gold">Driven by Purpose.</span>
            </motion.h1>
          </motion.div>
        </Container>
      </section>

      {/* Our Story */}
      <section className="py-24 md:py-32">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <SectionLabel text="Our Story" />
              <motion.h2
                variants={slideLeft}
                className="text-3xl md:text-4xl font-light tracking-tight text-molecule-white mb-8"
              >
                A Legacy of Purpose-Driven Investing
              </motion.h2>
              <motion.p
                variants={slideLeft}
                className="text-molecule-silver leading-relaxed mb-6"
              >
                Molecule Capital was founded with a singular vision: to deploy
                patient, strategic capital into the companies and technologies
                that will define the future of human health. As a family office,
                we bring the long-term perspective and alignment of interests
                that transformative healthcare innovation demands.
              </motion.p>
              <motion.p
                variants={slideLeft}
                className="text-molecule-silver leading-relaxed mb-6"
              >
                Our team combines decades of experience across biopharma
                operations, clinical research, healthcare investment banking,
                and venture capital. This multidisciplinary expertise allows us
                to evaluate opportunities with both scientific depth and
                commercial rigor.
              </motion.p>
              <motion.p
                variants={slideLeft}
                className="text-molecule-silver leading-relaxed"
              >
                We believe that the greatest investment opportunities in
                healthcare emerge at the intersection of breakthrough science
                and unmet medical need. Our portfolio reflects this conviction
                — spanning therapeutics, diagnostics, medical devices, and
                digital health.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideRight}
              className="bg-molecule-dark border border-molecule-gray/20 p-10 md:p-14 flex flex-col justify-center"
            >
              <blockquote className="text-2xl md:text-3xl font-light text-molecule-white leading-relaxed mb-8">
                &ldquo;We invest where scientific innovation meets the potential to
                meaningfully improve patient lives.&rdquo;
              </blockquote>
              <div className="w-16 h-[2px] bg-molecule-gold mb-4" />
              <p className="text-molecule-gold text-sm font-semibold uppercase tracking-[0.15em]">
                Founding Principle
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="py-24 md:py-32 bg-molecule-dark">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <div className="flex flex-col items-center">
              <SectionLabel text="Our Values" />
            </div>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-5xl font-light tracking-tight text-molecule-white"
            >
              What Guides Us
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          >
            {values.map((value) => (
              <motion.div
                key={value.title}
                variants={fadeUp}
                className="bg-molecule-charcoal border border-molecule-gray/20 p-8 md:p-10 hover:border-molecule-gold/40 transition-all duration-500"
              >
                <h3 className="text-xl font-semibold text-molecule-gold mb-4">
                  {value.title}
                </h3>
                <p className="text-molecule-silver leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* Our Approach */}
      <section className="py-24 md:py-32">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <div className="flex flex-col items-center">
              <SectionLabel text="Our Approach" />
            </div>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-5xl font-light tracking-tight text-molecule-white"
            >
              From Discovery to Impact
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-5 gap-6"
          >
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="relative text-center md:text-left"
              >
                <span className="text-3xl font-light text-molecule-gold/30 mb-4 block">
                  {item.step}
                </span>
                <h3 className="text-lg font-semibold text-molecule-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-molecule-silver leading-relaxed">
                  {item.description}
                </p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-4 -right-3 text-molecule-gold/20">
                    &rarr;
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      <ContactCTA />
    </>
  );
}
