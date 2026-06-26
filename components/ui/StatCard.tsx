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
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group gradient-border overflow-hidden rounded-2xl bg-[color-mix(in_srgb,var(--background-elevated)_80%,transparent)] p-6"
    >
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
        {label}
      </div>
      <div
        className={`mt-3 text-3xl font-extrabold tabular-nums sm:text-4xl ${
          accent ? "text-gradient-accent" : "text-foreground"
        }`}
      >
        {value}
        {suffix ? (
          <span className={`ml-1.5 text-base font-semibold ${
            suffix.includes("▲") ? "text-emerald-400" : suffix.includes("▼") ? "text-rose-400" : "text-muted"
          }`}>
            {suffix}
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}
