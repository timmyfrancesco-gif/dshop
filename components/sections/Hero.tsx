"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { useLocale } from "@/lib/hooks/useLocale";
import { useSiteConfig } from "@/lib/contexts/SiteConfigContext";

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

/** Splits text into <span> words, each staggered by CSS animation-delay. */
function RevealWords({
  text,
  startDelay = 0,
  step = 0.045,
}: {
  text: string;
  startDelay?: number;
  step?: number;
}) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span
          key={i}
          className="word-reveal"
          style={{ animationDelay: `${startDelay + i * step}s` }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const { t } = useLocale();
  const site = useSiteConfig();

  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const title = site.isTenant ? site.name : t("hero.title");
  const subtitle = site.isTenant && site.tagline ? site.tagline : t("hero.description");

  const STATS = [
    { label: t("hero.statRating"), value: "4.9", icon: "star" },
    { label: t("hero.statTrades"), value: "25K+", icon: "bolt" },
    { label: t("hero.statVolume"), value: "300K+", icon: "chart" },
    { label: t("hero.statTraders"), value: "5K+", icon: "users" },
  ];

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 pt-28 pb-16 text-center sm:px-6 lg:px-8"
    >
      <div className="aurora-container" aria-hidden>
        <div className="aurora-bg" />
      </div>
      <div className="hero-overlay pointer-events-none absolute inset-0 z-[1]" aria-hidden />

      <motion.div style={{ opacity: contentOpacity, y: contentY }} className="relative z-10 flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium tracking-wide text-foreground/70 backdrop-blur-xl"
        >
          <svg viewBox="0 0 13 15" className="h-3.5 w-3.5 text-accent" fill="none" aria-hidden>
            <path d="M6.5 0.5L0.5 3V7.5C0.5 10.985 3.089 14.244 6.5 14.5C9.911 14.244 12.5 10.985 12.5 7.5V3L6.5 0.5Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" />
            <path d="M4 7.5L5.8 9.3L9 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {site.isTenant ? "Digital Shop" : t("hero.badge")}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-balance text-5xl font-black uppercase tracking-tight sm:text-7xl lg:text-8xl"
        >
          <span className="text-gradient-accent">{title}</span>
        </motion.h1>

        <p className="mt-6 max-w-2xl text-balance text-lg text-muted sm:text-xl">
          <RevealWords text={subtitle} startDelay={0.55} step={0.025} />
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            href={site.isTenant ? `/s/${site.tenantSlug}/#shop` : "/#shop"}
            className="rounded-full bg-accent px-8 py-3 text-base font-semibold text-background shadow-[0_0_30px_-5px_var(--accent)] transition-transform hover:scale-105"
          >
            {t("hero.cta1")}
          </Link>
          {!site.isTenant && (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-foreground backdrop-blur-xl">
              <span className="flex gap-0.5 text-accent" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                    <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.9l-5.2 2.6.99-5.78-4.21-4.1 5.82-.85L10 1.5z" />
                  </svg>
                ))}
              </span>
              {t("hero.cta2")} <span className="font-bold text-accent">4.9</span> {t("hero.cta2Suffix")}
            </div>
          )}
        </motion.div>

        {!site.isTenant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.15 + i * 0.08 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center backdrop-blur-xl transition-colors hover:border-accent/50"
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
        )}
      </motion.div>
    </section>
  );
}
