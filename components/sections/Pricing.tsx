"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import SlotPurchaseModal from "@/components/modals/SlotPurchaseModal";
import { SLOT_PRICES } from "@/lib/config";
import { useLocale } from "@/lib/hooks/useLocale";
import type { SlotTier, SlotDuration } from "@/lib/config";

export default function Pricing() {
  const [selection, setSelection] = useState<{
    tierId: string;
    durationId: string;
    priceEur: number;
  } | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const { t, formatPrice } = useLocale();

  const SLOT_TIERS_T = [
    { id: "first" as SlotTier, nameKey: "pricing.firstSlot", descKey: "pricing.firstSlotDesc" },
    { id: "second" as SlotTier, nameKey: "pricing.secondSlot", descKey: "pricing.secondSlotDesc" },
    { id: "third" as SlotTier, nameKey: "pricing.thirdSlot", descKey: "pricing.thirdSlotDesc" },
  ];

  const SLOT_DURATIONS_T = [
    { id: "weekly" as SlotDuration, nameKey: "pricing.weekly" },
    { id: "monthly" as SlotDuration, nameKey: "pricing.monthly" },
    { id: "lifetime" as SlotDuration, nameKey: "pricing.lifetime" },
  ];

  return (
    <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t("pricing.eyebrow")}
          title={t("pricing.title")}
          description={t("pricing.description")}
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {SLOT_TIERS_T.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`glass-panel flex flex-col rounded-2xl p-6 ${
                tier.id === "first" ? "ring-1 ring-accent/40" : ""
              }`}
            >
              {tier.id === "first" ? (
                <span className="mb-3 inline-flex w-fit items-center rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-background">
                  {t("pricing.mostVisibility")}
                </span>
              ) : null}

              <h3 className="text-xl font-bold text-foreground">{t(tier.nameKey)}</h3>
              <p className="mt-1 text-sm text-muted">{t(tier.descKey)}</p>

              <div className="mt-6 flex flex-col gap-3">
                {SLOT_DURATIONS_T.map((duration) => {
                  const price = SLOT_PRICES[tier.id][duration.id];
                  return (
                    <div
                      key={duration.id}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {t(duration.nameKey)}
                        </div>
                        <div className="text-lg font-bold text-accent">
                          {formatPrice(price)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelection({ tierId: tier.id, durationId: duration.id, priceEur: price });
                          setModalKey((k) => k + 1);
                        }}
                        className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
                      >
                        {t("pricing.buy")}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <SlotPurchaseModal
        key={modalKey}
        open={selection !== null}
        onClose={() => setSelection(null)}
        tierId={selection?.tierId ?? ""}
        durationId={selection?.durationId ?? ""}
        priceEur={selection?.priceEur ?? 0}
      />
    </section>
  );
}
