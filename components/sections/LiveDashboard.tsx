"use client";

import ActivityFeed from "@/components/ui/ActivityFeed";
import ConnectionBadge from "@/components/ui/ConnectionBadge";
import SectionHeading from "@/components/ui/SectionHeading";
import StatCard from "@/components/ui/StatCard";
import { useDashboardData } from "@/lib/hooks/useDashboardData";
import { formatCurrency, formatEur, formatNumber } from "@/lib/format";

export default function LiveDashboard() {
  const { stats, ltc, feed, isLive, isConfigured } = useDashboardData();

  return (
    <section id="dashboard" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <SectionHeading
            eyebrow="Live Dashboard"
            title="Real activity, straight from the bot"
            description="These numbers update automatically from our live Discord bot — no fake data, no demos."
            align="left"
          />
          <ConnectionBadge isLive={isLive} isConfigured={isConfigured} />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            label="Total Orders"
            value={stats?.totalOrders !== undefined ? formatNumber(stats.totalOrders) : stats ? formatNumber(stats.totalUserTrades) : "—"}
          />
          <StatCard
            label="Total Volume"
            value={
              stats?.totalVolumeEur !== undefined
                ? formatCurrency(stats.totalVolumeEur, "EUR")
                : stats
                  ? formatCurrency(stats.totalEscrow, "EUR")
                  : "—"
            }
            accent
          />
          <StatCard
            label="Active Ad Slots"
            value={stats ? formatNumber(stats.activeSlots) : "—"}
          />
          <StatCard
            label="LTC Price"
            value={ltc ? formatEur(ltc.eur) : "—"}
            suffix={
              ltc
                ? `${ltc.changePct >= 0 ? "▲" : "▼"} ${Math.abs(ltc.changePct).toFixed(2)}%`
                : undefined
            }
          />
        </div>

        <div className="mt-8 glass-panel rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Live Activity</h3>
            <span className="text-xs text-muted">Updates every 30s</span>
          </div>
          <ActivityFeed items={feed} />
        </div>
      </div>
    </section>
  );
}
