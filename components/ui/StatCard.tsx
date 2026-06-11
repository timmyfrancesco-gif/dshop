"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function StatCard({
  label,
  value,
  suffix,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass-panel rounded-2xl p-6"
    >
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        {label}
      </div>
      <div
        className={`mt-3 text-3xl font-extrabold tabular-nums sm:text-4xl ${
          accent ? "text-accent" : "text-foreground"
        }`}
      >
        {value}
        {suffix ? (
          <span className="ml-1 text-base font-semibold text-muted">{suffix}</span>
        ) : null}
      </div>
    </motion.div>
  );
}
