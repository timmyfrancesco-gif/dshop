"use client";

import { motion } from "framer-motion";
import { SITE } from "@/lib/config";

export default function CtaSection() {
  return (
    <section className="px-4 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="glass-panel relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-12"
        >
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-casino-from/20 blur-[100px]" />

          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to start trading on {SITE.name}?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted">
            Join the {SITE.name} Discord to start an escrow, request a
            middleman, exchange your crypto, or browse the shop.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={SITE.discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-accent px-8 py-3 text-base font-semibold text-background shadow-[0_0_30px_-5px_var(--accent)] transition-transform hover:scale-105"
            >
              Join Discord
            </a>
            <a
              href="#shop"
              className="rounded-full border border-border bg-background-elevated/60 px-8 py-3 text-base font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Visit Shop
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
