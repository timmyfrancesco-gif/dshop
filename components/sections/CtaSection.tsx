"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { SITE } from "@/lib/config";
import { useLocale } from "@/lib/hooks/useLocale";

export default function CtaSection() {
  const { t } = useLocale();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  return (
    <section ref={ref} className="px-4 pb-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/10 via-background-elevated to-casino-from/10 p-[1px]"
        >
          <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-background px-6 py-20 text-center sm:px-16">
            <motion.div
              style={{ y: bgY }}
              className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-[120px]"
            />
            <motion.div
              style={{ y: bgY }}
              className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-casino-from/20 blur-[120px]"
            />
            <div className="pointer-events-none absolute left-1/2 top-0 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <h2 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                {t("cta.title").replace("{siteName}", SITE.name)}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted">
                {t("cta.description").replace(/\{siteName\}/g, SITE.name)}
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <motion.a
                  href={SITE.discordInvite}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="shine-card group relative overflow-hidden rounded-full bg-accent px-10 py-3.5 text-base font-bold text-background shadow-[0_0_40px_-8px_var(--accent)] transition-shadow hover:shadow-[0_0_60px_-8px_var(--accent)]"
                >
                  <span className="shine-sweep" aria-hidden />
                  <span className="relative z-10">{t("cta.joinDiscord")}</span>
                </motion.a>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/#shop"
                    className="shine-card group relative inline-block overflow-hidden rounded-full border border-border bg-background-elevated/60 px-10 py-3.5 text-base font-bold text-foreground transition-all hover:border-accent hover:text-accent hover:shadow-[0_0_30px_-10px_var(--accent)]"
                  >
                    <span className="shine-sweep" aria-hidden />
                    {t("cta.visitShop")}
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
