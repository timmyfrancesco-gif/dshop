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
    <section id="services" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t("features.eyebrow")}
          title={t("features.title")}
          description={t("features.description")}
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_KEYS.map((service, i) => (
            <motion.div
              key={service.titleKey}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              whileHover={{ y: -6 }}
              className="group glass-panel relative overflow-hidden rounded-2xl p-6 transition-colors hover:border-accent/50"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />

              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background/60 text-accent">
                <ServiceIcon name={service.icon} className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {t(service.titleKey)}
              </h3>
              <p className="mt-2 text-sm text-muted">{t(service.descKey)}</p>

              {service.feeKey ? (
                <span className="mt-4 inline-flex w-fit items-center rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                  {t(service.feeKey)}
                </span>
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
