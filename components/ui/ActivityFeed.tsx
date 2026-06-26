"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import FeedIcon from "@/components/ui/FeedIcon";
import { formatEur, formatRelativeTime } from "@/lib/format";
import type { FeedItem } from "@/lib/types";

const TYPE_LABELS: Record<FeedItem["type"], string> = {
  order: "Shop Order",
  escrow: "Escrow",
  mm: "Middleman",
  slot: "Ad Slot",
  exchange: "Exchange",
};

export default function ActivityFeed({ items }: { items: FeedItem[] }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center text-muted">
        <p className="text-sm">No recent activity yet.</p>
        <p className="text-xs">New trades and orders will appear here in real time.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {items.map((item, index) => (
          <motion.li
            key={`${item.type}-${item.ts}-${item.label}-${index}`}
            initial={{ opacity: 0, x: -20, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="group flex items-center gap-3 rounded-xl border border-border/40 bg-background/30 px-4 py-3 transition-all duration-200 hover:border-accent/20 hover:bg-accent/5"
          >
            <FeedIcon type={item.type} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {item.label}
                </span>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {TYPE_LABELS[item.type] ?? item.type}
                </span>
                {item.method ? (
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                    {item.method}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-0.5">
              {item.amount !== undefined && item.amount !== null && isFinite(item.amount) ? (
                <span className="text-sm font-bold text-foreground">
                  {formatEur(item.amount)}
                </span>
              ) : null}
              <span className="text-xs text-muted">{formatRelativeTime(item.ts)}</span>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
