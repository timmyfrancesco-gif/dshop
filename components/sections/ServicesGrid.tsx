"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, type MouseEvent } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { useLocale } from "@/lib/hooks/useLocale";

const SERVICE_KEYS = [
  { titleKey: "features.escrowTitle", descKey: "features.escrowDesc", feeKey: "features.escrowFee", icon: "shield" },
  { titleKey: "features.middlemanTitle", descKey: "features.middlemanDesc", feeKey: "features.middlemanFee", icon: "handshake" },
  { titleKey: "features.exchangeTitle", descKey: "features.exchangeDesc", feeKey: null, icon: "exchange" },
  { titleKey: "features.casinoTitle", descKey: "features.casinoDesc", feeKey: null, icon: "casino" },
  { titleKey: "features.adsTitle", descKey: "features.adsDesc", feeKey: null, icon: "megaphone" },
  { titleKey: "features.shopTitle", descKey: "features.shopDesc", feeKey: null, icon: "shop" },
];

function TiltCard({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  function handleMouse(e: MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className="group gradient-border relative overflow-hidden rounded-2xl bg-[color-mix(in_srgb,var(--background-elevated)_80%,transparent)] p-7 transition-all duration-300"
    >
      {children}
    </motion.div>
  );
}

export default function ServicesGrid() {
  const { t } = useLocale();

  return (
    <section id="services" className="section-glow relative px-4 py-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t("features.eyebrow")}
          title={t("features.title")}
          description={t("features.description")}
        />

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_KEYS.map((service, i) => (
            <TiltCard key={service.titleKey} index={i}>
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent/15 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-100 opacity-0" />
              <div className="pointer-events-none absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-casino-from/10 blur-2xl transition-all duration-500 group-hover:opacity-80 opacity-0" />

              <div className="relative flex h-14 w-14 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_24px_-4px_var(--accent)]">
                <ServiceIcon name={service.icon} className="h-7 w-7" />
                <div className="absolute inset-0 rounded-xl bg-accent/5 animate-pulse-ring" />
              </div>

              <h3 className="mt-6 text-lg font-bold text-foreground">
                {t(service.titleKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t(service.descKey)}
              </p>

              {service.feeKey ? (
                <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-bold text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-glow-pulse" />
                  {t(service.feeKey)}
                </span>
              ) : null}
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
