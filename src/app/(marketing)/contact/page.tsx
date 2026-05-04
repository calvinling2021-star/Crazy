"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeUp, slideLeft, slideRight, staggerContainer } from "@/lib/animations";
import Container from "@/components/layout/Container";
import SectionLabel from "@/components/ui/SectionLabel";
import { SITE_CONFIG } from "@/lib/constants";
import { EnvelopeIcon, MapPinIcon } from "@heroicons/react/24/outline";

const FAQ = [
  {
    q: "Do I need any music experience?",
    a: "None whatsoever. If you can type a sentence, you can generate a professional track with Suno AI in 30 seconds.",
  },
  {
    q: "How quickly do royalties start coming in?",
    a: "Tracks go live within 24–48 hours of distribution. Most creators see their first royalty payment within 30 days.",
  },
  {
    q: "What does it actually cost to get started?",
    a: "Suno Pro is $10/month. DistroKid is $23/year. SoundMint has a free tier. Total: ~$33 to launch your first track.",
  },
  {
    q: "How much can I realistically earn?",
    a: "It depends on niche, catalog size, and consistency. Sleep music tracks average $500–$1,500/month each. 20 tracks in the right niche can hit $10K+/month.",
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = data.get("name") as string;
    const email = data.get("email") as string;
    const subject = data.get("subject") as string;
    const message = data.get("message") as string;

    const mailSubject = encodeURIComponent(`SoundMint inquiry from ${name} — ${subject}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`
    );
    window.location.href = `mailto:${SITE_CONFIG.email}?subject=${mailSubject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <>
      {/* Header */}
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
              We&apos;re Here to Help
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-6 text-lg text-molecule-silver">
              Questions about the platform, partnership inquiries, or just want to share your results — we read every message.
            </motion.p>
          </motion.div>
        </Container>
      </section>

      {/* Contact section */}
      <section className="pb-24 md:pb-32 lg:pb-40">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Left — info + FAQ */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div variants={slideLeft} className="flex flex-col gap-8 mb-12">
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
                    <p className="text-xs text-molecule-muted mt-1">Typical response within 24 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPinIcon className="w-6 h-6 text-molecule-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-sm font-semibold text-molecule-white uppercase tracking-[0.1em] mb-1">
                      Based In
                    </h3>
                    <p className="text-molecule-silver">{SITE_CONFIG.location}</p>
                    <p className="text-xs text-molecule-muted mt-1">Serving creators worldwide</p>
                  </div>
                </div>
              </motion.div>

              {/* FAQ */}
              <motion.div variants={slideLeft}>
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-molecule-gold mb-6">
                  Common Questions
                </h2>
                <div className="flex flex-col gap-5">
                  {FAQ.map((item) => (
                    <div key={item.q} className="border-b border-molecule-gray/20 pb-5">
                      <h3 className="text-sm font-semibold text-molecule-white mb-2">{item.q}</h3>
                      <p className="text-sm text-molecule-silver leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Right — form */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideRight}
            >
              {submitted ? (
                <div className="bg-molecule-dark border border-molecule-gold/30 p-10 text-center">
                  <div className="text-4xl mb-4">✓</div>
                  <h3 className="text-2xl font-light text-molecule-white mb-4">Message Sent</h3>
                  <p className="text-molecule-silver">
                    Your email client should have opened. If not, email us directly at{" "}
                    <a href={`mailto:${SITE_CONFIG.email}`} className="text-molecule-gold hover:text-molecule-gold-light">
                      {SITE_CONFIG.email}
                    </a>
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-[0.1em] text-molecule-muted mb-2">
                        Name
                      </label>
                      <input
                        type="text" id="name" name="name" required
                        className="w-full bg-molecule-dark border border-molecule-gray/30 px-4 py-3.5 text-sm text-molecule-white placeholder:text-molecule-muted/50 focus:border-molecule-gold focus:outline-none transition-colors"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-[0.1em] text-molecule-muted mb-2">
                        Email
                      </label>
                      <input
                        type="email" id="email" name="email" required
                        className="w-full bg-molecule-dark border border-molecule-gray/30 px-4 py-3.5 text-sm text-molecule-white placeholder:text-molecule-muted/50 focus:border-molecule-gold focus:outline-none transition-colors"
                        placeholder="you@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-xs font-semibold uppercase tracking-[0.1em] text-molecule-muted mb-2">
                      Subject
                    </label>
                    <select
                      id="subject" name="subject" required
                      className="w-full bg-molecule-dark border border-molecule-gray/30 px-4 py-3.5 text-sm text-molecule-white focus:border-molecule-gold focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="">Select a topic…</option>
                      <option value="Getting Started">Getting Started</option>
                      <option value="Platform Question">Platform Question</option>
                      <option value="Billing & Plans">Billing &amp; Plans</option>
                      <option value="Partnership">Partnership / Enterprise</option>
                      <option value="Share Results">Share My Results</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-[0.1em] text-molecule-muted mb-2">
                      Message
                    </label>
                    <textarea
                      id="message" name="message" rows={5} required
                      className="w-full bg-molecule-dark border border-molecule-gray/30 px-4 py-3.5 text-sm text-molecule-white placeholder:text-molecule-muted/50 focus:border-molecule-gold focus:outline-none transition-colors resize-none"
                      placeholder="Tell us what's on your mind…"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-molecule-gold text-molecule-black px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-molecule-gold-light transition-all duration-200"
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
