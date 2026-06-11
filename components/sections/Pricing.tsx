"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import SlotPurchaseModal from "@/components/modals/SlotPurchaseModal";
import { SLOT_DURATIONS, SLOT_PRICES, SLOT_TIERS } from "@/lib/config";
import { formatEur } from "@/lib/format";

export default function Pricing() {
  const [selection, setSelection] = useState<{
    tierId: string;
    durationId: string;
    priceEur: number;
  } | null>(null);
  const [modalKey, setModalKey] = useState(0);

  return (
    <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Advertising Slots"
          title="Get featured in front of active traders"
          description="Pick a tier and duration. Payment is handled in LTC — no account or login required."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {SLOT_TIERS.map((tier, i) => (
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
                  Most Visibility
                </span>
              ) : null}

              <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
              <p className="mt-1 text-sm text-muted">{tier.description}</p>

              <div className="mt-6 flex flex-col gap-3">
                {SLOT_DURATIONS.map((duration) => {
                  const price = SLOT_PRICES[tier.id][duration.id];
                  return (
                    <div
                      key={duration.id}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {duration.name}
                        </div>
                        <div className="text-lg font-bold text-accent">
                          {formatEur(price, 0)}
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
                        Buy
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
