"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeUp, slideLeft, slideRight, staggerContainer } from "@/lib/animations";
import Container from "@/components/layout/Container";
import SectionLabel from "@/components/ui/SectionLabel";
import { SITE_CONFIG } from "@/lib/constants";
import { EnvelopeIcon, MapPinIcon } from "@heroicons/react/24/outline";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = data.get("name") as string;
    const email = data.get("email") as string;
    const company = data.get("company") as string;
    const message = data.get("message") as string;

    const subject = encodeURIComponent(`Inquiry from ${name} - ${company}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nCompany: ${company}\n\n${message}`
    );
    window.location.href = `mailto:${SITE_CONFIG.email}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

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
            <SectionLabel text="Contact" />
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-molecule-white"
            >
              Start a Conversation
            </motion.h1>
          </motion.div>
        </Container>
      </section>

      {/* Contact Content */}
      <section className="pb-24 md:pb-32 lg:pb-40">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Left — Info */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.p
                variants={slideLeft}
                className="text-lg text-molecule-silver leading-relaxed mb-10"
              >
                We&apos;re always interested in meeting exceptional founders and
                exploring strategic partnerships in healthcare and biotech.
              </motion.p>

              <motion.div variants={slideLeft} className="flex flex-col gap-8">
                <div className="flex items-start gap-4">
                  <EnvelopeIcon className="w-6 h-6 text-molecule-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-sm font-semibold text-molecule-white uppercase tracking-[0.1em] mb-1">
                      Email
                    </h3>
                    <a
                      href={`mailto:${SITE_CONFIG.email}`}
                      className="text-molecule-silver hover:text-molecule-gold transition-colors duration-300"
                    >
                      {SITE_CONFIG.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPinIcon className="w-6 h-6 text-molecule-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-sm font-semibold text-molecule-white uppercase tracking-[0.1em] mb-1">
                      Location
                    </h3>
                    <p className="text-molecule-silver">{SITE_CONFIG.location}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right — Form */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideRight}
            >
              {submitted ? (
                <div className="bg-molecule-dark border border-molecule-gold/30 p-10 text-center">
                  <h3 className="text-2xl font-light text-molecule-white mb-4">
                    Thank You
                  </h3>
                  <p className="text-molecule-silver">
                    Your email client should have opened. If not, please email us
                    directly at{" "}
                    <a
                      href={`mailto:${SITE_CONFIG.email}`}
                      className="text-molecule-gold hover:text-molecule-gold-light"
                    >
                      {SITE_CONFIG.email}
                    </a>
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-xs font-semibold uppercase tracking-[0.1em] text-molecule-muted mb-2"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full bg-molecule-dark border border-molecule-gray/30 px-5 py-4 text-molecule-white placeholder:text-molecule-muted/50 focus:border-molecule-gold focus:outline-none transition-colors duration-300"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold uppercase tracking-[0.1em] text-molecule-muted mb-2"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full bg-molecule-dark border border-molecule-gray/30 px-5 py-4 text-molecule-white placeholder:text-molecule-muted/50 focus:border-molecule-gold focus:outline-none transition-colors duration-300"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="company"
                      className="block text-xs font-semibold uppercase tracking-[0.1em] text-molecule-muted mb-2"
                    >
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      className="w-full bg-molecule-dark border border-molecule-gray/30 px-5 py-4 text-molecule-white placeholder:text-molecule-muted/50 focus:border-molecule-gold focus:outline-none transition-colors duration-300"
                      placeholder="Your company"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-xs font-semibold uppercase tracking-[0.1em] text-molecule-muted mb-2"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      className="w-full bg-molecule-dark border border-molecule-gray/30 px-5 py-4 text-molecule-white placeholder:text-molecule-muted/50 focus:border-molecule-gold focus:outline-none transition-colors duration-300 resize-none"
                      placeholder="How can we help?"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-molecule-gold text-molecule-black px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-molecule-gold-light transition-all duration-300"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </Container>
      </section>
    </>
  );
}
