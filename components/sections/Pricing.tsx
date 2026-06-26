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
    <section id="pricing" className="section-glow relative px-4 py-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t("pricing.eyebrow")}
          title={t("pricing.title")}
          description={t("pricing.description")}
        />

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {SLOT_TIERS_T.map((tier, i) => {
            const isFeatured = tier.id === "first";
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className={`group relative flex flex-col overflow-hidden rounded-2xl p-[1px] transition-all duration-300 ${
                  isFeatured
                    ? "bg-gradient-to-br from-accent via-casino-from to-casino-to shadow-[0_0_40px_-10px_var(--accent)]"
                    : "bg-border hover:bg-gradient-to-br hover:from-accent/50 hover:via-casino-from/50 hover:to-accent/50"
                }`}
              >
                <div className="flex flex-1 flex-col rounded-[calc(1rem-1px)] bg-background p-7">
                  {isFeatured ? (
                    <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-casino-from px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                        <path d="M10 1.5l3 5.5h6l-4.5 4 1.5 6-5-3.5-5 3.5 1.5-6L3 7h6l1-5.5z" />
                      </svg>
                      {t("pricing.mostVisibility")}
                    </span>
                  ) : null}

                  <h3 className="text-xl font-bold text-foreground">{t(tier.nameKey)}</h3>
                  <p className="mt-1.5 text-sm text-muted">{t(tier.descKey)}</p>

                  <div className="mt-7 flex flex-col gap-3">
                    {SLOT_DURATIONS_T.map((duration) => {
                      const price = SLOT_PRICES[tier.id][duration.id];
                      return (
                        <motion.div
                          key={duration.id}
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className="flex items-center justify-between rounded-xl border border-border/60 bg-background-elevated/60 px-4 py-3.5 transition-colors hover:border-accent/30"
                        >
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {t(duration.nameKey)}
                            </div>
                            <div className={`text-xl font-extrabold ${isFeatured ? "text-gradient-accent" : "text-accent"}`}>
                              {formatPrice(price)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelection({ tierId: tier.id, durationId: duration.id, priceEur: price });
                              setModalKey((k) => k + 1);
                            }}
                            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                              isFeatured
                                ? "bg-accent text-background shadow-[0_0_20px_-5px_var(--accent)] hover:shadow-[0_0_30px_-5px_var(--accent)] hover:scale-105"
                                : "border border-border text-foreground hover:border-accent hover:text-accent hover:shadow-[0_0_20px_-8px_var(--accent)]"
                            }`}
                          >
                            {t("pricing.buy")}
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
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
