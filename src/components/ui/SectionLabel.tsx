"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";

export default function SectionLabel({ text }: { text: string }) {
  return (
    <motion.div variants={fadeUp} className="flex flex-col items-start gap-4 mb-6">
      <span className="text-xs font-semibold tracking-[0.2em] uppercase text-molecule-gold">
        {text}
      </span>
      <div className="w-16 h-[2px] bg-molecule-gold" />
    </motion.div>
  );
}
