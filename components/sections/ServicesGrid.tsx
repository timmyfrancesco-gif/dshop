"use client";

import { motion } from "framer-motion";
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

function FeatureCard({ service, index, t }: { service: typeof SERVICE_KEYS[0]; index: number; t: (k: string) => string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouse(e: MouseEvent) {
    const card = cardRef.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    card.style.setProperty("--mx", `${x}%`);
    card.style.setProperty("--my", `${y}%`);
  }

  function handleLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.removeProperty("--mx");
    card.style.removeProperty("--my");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
        className="feature-card group"
      >
        {/* Icon */}
        <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl border border-white/[0.14] bg-gradient-to-b from-white/[0.06] to-white/[0.02] text-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:border-accent/30 group-hover:shadow-[0_8px_26px_rgba(168,85,247,0.22),inset_0_1px_0_rgba(255,255,255,0.22)]">
          <ServiceIcon name={service.icon} className="h-7 w-7 transition-all duration-300 group-hover:drop-shadow-[0_0_16px_rgba(168,85,247,0.6)]" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h4 className="relative text-base font-extrabold text-foreground">
            {t(service.titleKey)}
            <span className="absolute -bottom-1.5 left-0 h-0.5 w-full origin-left scale-x-0 bg-gradient-to-r from-accent to-transparent transition-transform duration-300 group-hover:scale-x-100" />
          </h4>
          <p className="mt-2.5 text-sm leading-relaxed text-muted">
            {t(service.descKey)}
          </p>
        </div>

        {/* Glow halos */}
        <span className="pointer-events-none absolute -bottom-[110px] -left-[90px] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.15),transparent_60%)] blur-[44px] opacity-30 transition-transform duration-300 group-hover:-translate-y-1" />
        <span className="pointer-events-none absolute -right-[60px] -top-[80px] h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(192,132,252,0.12),transparent_60%)] blur-[44px] opacity-30 transition-transform duration-300 group-hover:translate-y-1" />

        {/* Shine sweep */}
        <span className="pointer-events-none absolute inset-[-20%] translate-x-[-120%] rotate-[18deg] bg-[linear-gradient(90deg,transparent_0_38%,rgba(255,255,255,0.14)_52%,transparent_70%)] opacity-0 mix-blend-screen transition-none group-hover:animate-[shine-move_2.2s_cubic-bezier(0.22,1,0.24,1)] group-hover:opacity-[0.55]" />
      </div>
    </motion.div>
  );
}

export default function ServicesGrid() {
  const { t } = useLocale();

  return (
    <section id="services" className="relative px-4 py-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t("features.eyebrow")}
          title={t("features.title")}
          description={t("features.description")}
        />

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_KEYS.map((service, i) => (
            <FeatureCard key={service.titleKey} service={service} index={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
