"use client";

import { motion } from "framer-motion";
import { SITE } from "@/lib/config";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-16 text-center sm:px-6 lg:px-8"
    >
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background-elevated/60 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-accent"
      >
        Live on Discord
      </motion.span>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="max-w-4xl text-balance text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
      >
        Trade crypto with{" "}
        <span className="bg-gradient-to-r from-accent via-accent to-casino-from bg-clip-text text-transparent">
          confidence
        </span>
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
        className="mt-10 flex flex-col gap-4 sm:flex-row"
      >
        <a
          href={SITE.discordInvite}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-accent px-8 py-3 text-base font-semibold text-background shadow-[0_0_30px_-5px_var(--accent)] transition-transform hover:scale-105"
        >
          Join Discord
        </a>
        <a
          href={SITE.shopUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-border bg-background-elevated/60 px-8 py-3 text-base font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          Visit Shop
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          { label: "Escrow Fee", value: "0.25%" },
          { label: "Middleman Fee", value: "5%" },
          { label: "Crypto → PayPal", value: "Free" },
          { label: "Support", value: "24/7" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-panel rounded-2xl px-4 py-5 text-center"
          >
            <div className="text-xl font-bold text-accent sm:text-2xl">
              {stat.value}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted">
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
