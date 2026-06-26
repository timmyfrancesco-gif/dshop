"use client";

import { motion } from "framer-motion";
import ActivityFeed from "@/components/ui/ActivityFeed";
import ConnectionBadge from "@/components/ui/ConnectionBadge";
import SectionHeading from "@/components/ui/SectionHeading";
import StatCard from "@/components/ui/StatCard";
import { formatNumber } from "@/lib/format";
import { useLocale } from "@/lib/hooks/useLocale";
import { useHomepageData } from "@/lib/contexts/HomepageDataContext";
import { isApiConfigured } from "@/lib/api";

export default function LiveDashboard() {
  const { stats, ltc, feed, loaded } = useHomepageData();
  const isLive = loaded && Boolean(stats || ltc || feed.length);
  const isConfigured = isApiConfigured();
  const { t, formatPrice } = useLocale();

  return (
    <section id="dashboard" className="section-glow relative px-4 py-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <SectionHeading
            eyebrow={t("dashboard.eyebrow")}
            title={t("dashboard.title")}
            description={t("dashboard.description")}
            align="left"
          />
          <ConnectionBadge isLive={isLive} isConfigured={isConfigured} />
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            label={t("dashboard.totalOrders")}
            value={stats?.totalOrders !== undefined ? formatNumber(stats.totalOrders) : feed.length > 0 ? formatNumber(feed.length) : stats ? formatNumber(stats.totalUserTrades) : "—"}
          />
          <StatCard
            label={t("dashboard.totalVolume")}
            value={
              stats?.totalVolumeEur !== undefined
                ? formatPrice(stats.totalVolumeEur)
                : stats
                  ? formatPrice(stats.totalEscrow)
                  : "—"
            }
            accent
          />
          <StatCard
            label={t("dashboard.activeSlots")}
            value={stats ? formatNumber(stats.activeSlots) : "—"}
          />
          <StatCard
            label={t("dashboard.ltcPrice")}
            value={ltc ? formatPrice(ltc.eur) : "—"}
            suffix={
              ltc
                ? `${ltc.changePct >= 0 ? "▲" : "▼"} ${Math.abs(ltc.changePct).toFixed(2)}%`
                : undefined
            }
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 overflow-hidden rounded-2xl border border-border bg-[color-mix(in_srgb,var(--background-elevated)_80%,transparent)] p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {t("dashboard.liveActivity")}
            </h3>
            <span className="text-xs text-muted">{t("dashboard.updatesEvery")}</span>
          </div>
          <ActivityFeed items={feed} />
        </motion.div>
      </div>
    </section>
  );
}
