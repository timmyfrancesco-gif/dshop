"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { SITE } from "@/lib/config";

const STATS = [
  { label: "Rating", value: "4.9", icon: "star" },
  { label: "Trades Completed", value: "25K+", icon: "bolt" },
  { label: "Total Volume", value: "300K+", icon: "chart" },
  { label: "Happy Traders", value: "5K+", icon: "users" },
];

const STAT_ICONS: Record<string, React.ReactNode> = {
  star: (
    <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.9l-5.2 2.6.99-5.78-4.21-4.1 5.82-.85L10 1.5z" />
  ),
  bolt: <path d="M11 1L3 12h6l-2 11 10-13h-6l2-9z" />,
  chart: <path d="M3 17V9m5.5 8V3M14 17v-5m5.5 5V7" strokeLinecap="round" />,
  users: (
    <path
      d="M7 10a3 3 0 100-6 3 3 0 000 6zm10 0a3 3 0 100-6 3 3 0 000 6zM1 19c0-3 3-5 6-5s6 2 6 5M11 19c0-3 3-5 6-5s6 2 6 5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const blobY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-[95vh] flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-16 text-center sm:px-6 lg:px-8"
    >
      <motion.div
        style={{ y: blobY }}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-1/4 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-accent/15 blur-[160px]" />
      </motion.div>

      <motion.div style={{ opacity: contentOpacity, y: contentY }} className="flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-accent"
        >
          ✦ Premium Trading Hub
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-balance text-6xl font-black uppercase tracking-tight sm:text-8xl lg:text-9xl"
        >
          <span className="text-gradient-accent">Heaven</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-2xl text-balance text-lg text-muted sm:text-xl"
        >
          {SITE.tagline} Escrow, middleman protection, exchange, advertising
          slots, a digital shop and a casino — all in one Discord server.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <a
            href="#shop"
            className="rounded-full bg-accent px-8 py-3 text-base font-semibold text-background shadow-[0_0_30px_-5px_var(--accent)] transition-transform hover:scale-105"
          >
            Explore Shop
          </a>
          <div className="flex items-center gap-2 rounded-full border border-border bg-background-elevated/60 px-5 py-3 text-sm font-medium text-foreground">
            <span className="flex gap-0.5 text-accent" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                  <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.9l-5.2 2.6.99-5.78-4.21-4.1 5.82-.85L10 1.5z" />
                </svg>
              ))}
            </span>
            Excellent <span className="font-bold text-accent">4.9</span> out of 5
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-panel rounded-2xl px-4 py-5 text-center transition-colors hover:border-accent/50"
            >
              <svg
                viewBox="0 0 24 24"
                className="mx-auto mb-2 h-5 w-5 text-accent"
                fill={stat.icon === "star" || stat.icon === "bolt" ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={2}
              >
                {STAT_ICONS[stat.icon]}
              </svg>
              <div className="text-xl font-bold text-foreground sm:text-2xl">{stat.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
