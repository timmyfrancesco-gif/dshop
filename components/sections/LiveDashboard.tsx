"use client";

import ActivityFeed from "@/components/ui/ActivityFeed";
import ConnectionBadge from "@/components/ui/ConnectionBadge";
import SectionHeading from "@/components/ui/SectionHeading";
import StatCard from "@/components/ui/StatCard";
import { useDashboardData } from "@/lib/hooks/useDashboardData";
import { formatNumber } from "@/lib/format";
import { useLocale } from "@/lib/hooks/useLocale";

export default function LiveDashboard() {
  const { stats, ltc, feed, isLive, isConfigured } = useDashboardData();
  const { t, formatPrice } = useLocale();

  return (
    <section id="dashboard" className="px-4 py-24 sm:px-6 lg:px-8">
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

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            label={t("dashboard.totalOrders")}
            value={stats?.totalOrders !== undefined ? formatNumber(stats.totalOrders) : stats ? formatNumber(stats.totalUserTrades) : "—"}
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

        <div className="mt-8 glass-panel rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">{t("dashboard.liveActivity")}</h3>
            <span className="text-xs text-muted">{t("dashboard.updatesEvery")}</span>
          </div>
          <ActivityFeed items={feed} />
        </div>
      </div>
    </section>
  );
}
