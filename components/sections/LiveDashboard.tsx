"use client";

import ActivityFeed from "@/components/ui/ActivityFeed";
import ConnectionBadge from "@/components/ui/ConnectionBadge";
import SectionHeading from "@/components/ui/SectionHeading";
import StatCard from "@/components/ui/StatCard";
import { useDashboardData } from "@/lib/hooks/useDashboardData";
import { formatEur, formatNumber } from "@/lib/format";

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

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active Ad Slots"
            value={stats ? formatNumber(stats.activeSlots) : "—"}
          />
          <StatCard
            label="Escrow Trades"
            value={stats ? formatNumber(stats.totalEscrow) : "—"}
          />
          <StatCard
            label="Middleman Completed"
            value={stats ? formatNumber(stats.completedMM) : "—"}
          />
          <StatCard
            label="Total Transactions"
            value={stats ? formatNumber(stats.totalUserTrades) : "—"}
          />
          <StatCard
            label="Tickets Opened"
            value={stats?.ticketsOpened !== undefined ? formatNumber(stats.ticketsOpened) : "—"}
          />
          <StatCard
            label="Total Customers"
            value={stats?.totalCustomers !== undefined ? formatNumber(stats.totalCustomers) : "—"}
          />
          <StatCard
            label="Total Volume"
            value={stats?.totalVolumeEur !== undefined ? formatEur(stats.totalVolumeEur, 0) : "—"}
          />
          <StatCard
            label="LTC Price"
            value={ltc ? formatEur(ltc.eur) : "—"}
            accent
            suffix={
              ltc && ltc.changePct !== undefined
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
