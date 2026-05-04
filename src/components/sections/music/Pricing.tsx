"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { staggerContainer, fadeUp } from "@/lib/animations";
import Container from "@/components/layout/Container";

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Try the platform and generate your first 3 tracks.",
    features: [
      "3 track generations / month",
      "All 6 niches available",
      "Prompt template library",
      "Basic analytics dashboard",
      "Distribution guide",
    ],
    cta: "Get Started Free",
    href: "/studio",
    featured: false,
  },
  {
    name: "Creator",
    price: "$29",
    period: "per month",
    description:
      "For serious creators scaling to $5K–$30K/month passive income.",
    features: [
      "Unlimited track generations",
      "All 6 niches + custom niches",
      "Advanced prompt builder",
      "Full revenue analytics",
      "Platform performance breakdown",
      "Auto-distribution queue",
      "Priority support",
    ],
    cta: "Start Creating",
    href: "/studio",
    featured: true,
  },
  {
    name: "Agency",
    price: "$99",
    period: "per month",
    description: "Manage multiple catalog portfolios and team members.",
    features: [
      "Everything in Creator",
      "5 creator accounts",
      "Bulk generation tools",
      "Catalog management",
      "Revenue attribution",
      "White-label reporting",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    href: "mailto:hello@soundmint.io",
    featured: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-32 lg:py-40">
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
            Pricing
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="mt-4 text-3xl md:text-5xl font-light tracking-tight text-molecule-white"
          >
            Start Free.{" "}
            <span className="text-molecule-gold">Scale When It Works.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-6 text-molecule-silver">
            All plans work alongside your $10 Suno + $23/yr DistroKid subscriptions.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              className={`p-8 border transition-all duration-300 relative ${
                plan.featured
                  ? "bg-molecule-charcoal border-molecule-gold/40 shadow-[0_0_40px_rgba(201,168,76,0.08)]"
                  : "bg-molecule-dark border-molecule-gray/20 hover:border-molecule-gray/40"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-molecule-gold text-molecule-black text-xs font-semibold px-4 py-1 uppercase tracking-[0.1em]">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-lg font-semibold text-molecule-white mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-light text-molecule-gold">{plan.price}</span>
                <span className="text-molecule-muted text-sm">/ {plan.period}</span>
              </div>
              <p className="text-molecule-silver text-sm mb-8">{plan.description}</p>

              <ul className="flex flex-col gap-3 mb-10">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <svg className="w-4 h-4 text-molecule-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-molecule-silver">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block text-center px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] transition-all duration-200 ${
                  plan.featured
                    ? "bg-molecule-gold text-molecule-black hover:bg-molecule-gold-light"
                    : "border border-molecule-gold text-molecule-gold hover:bg-molecule-gold hover:text-molecule-black"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
