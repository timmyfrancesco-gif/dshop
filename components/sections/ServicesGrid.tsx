"use client";

import { motion } from "framer-motion";
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
            <motion.div
              key={service.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-[color-mix(in_srgb,var(--background-elevated)_60%,transparent)] p-6 transition-all duration-300 hover:border-accent/30 hover:bg-[color-mix(in_srgb,var(--background-elevated)_80%,transparent)]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all duration-300 group-hover:bg-accent/20 group-hover:shadow-[0_0_20px_-4px_var(--accent)]">
                <ServiceIcon name={service.icon} className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-foreground">
                  {t(service.titleKey)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {t(service.descKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
