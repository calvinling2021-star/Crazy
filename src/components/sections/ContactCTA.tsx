"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";

export default function ContactCTA() {
  return (
    <section className="py-24 md:py-32 lg:py-40 bg-molecule-dark">
      <div className="h-[1px] bg-gradient-to-r from-transparent via-molecule-gold/40 to-transparent mb-24" />
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center max-w-3xl mx-auto"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-5xl font-light tracking-tight text-molecule-white mb-6"
          >
            Let&apos;s Build the Future of
            <br />
            <span className="text-molecule-gold">Healthcare Together</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-molecule-silver leading-relaxed mb-10"
          >
            Whether you&apos;re a founder, co-investor, or advisor, we&apos;d welcome
            the conversation.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Button href="/contact">Contact Us</Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
