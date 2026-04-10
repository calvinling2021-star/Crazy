"use client";

import { motion, Variants } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import clsx from "clsx";

interface AnimatedSectionProps {
  children: React.ReactNode;
  variants?: Variants;
  className?: string;
  delay?: number;
}

export default function AnimatedSection({
  children,
  variants = fadeUp,
  className,
  delay = 0,
}: AnimatedSectionProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={variants}
      transition={delay ? { delay } : undefined}
      className={clsx(className)}
    >
      {children}
    </motion.div>
  );
}
