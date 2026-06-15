"use client";

import { useCallback, useEffect, useState } from "react";
import { getFeed, getProducts, getStats } from "@/lib/api";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import type { FeedItem, StatsResponse, ApiProduct } from "@/lib/types";

const DASHBOARD_PASSWORD = "HeavenAdmin2025";

export default function SecretDashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === DASHBOARD_PASSWORD) {
      setAuthed(true);
      setError(null);
    } else {
      setError("Incorrect password.");
    }
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-background-elevated/60 p-6"
        >
          <h1 className="text-lg font-bold text-foreground">Restricted Area</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="rounded-lg border border-border bg-background/60 px-3 py-2 text-foreground outline-none transition-colors focus:border-accent"
          />
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button
            type="submit"
            className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Unlock
          </button>
        </form>
      </main>
    );
  }

  return <Dashboard />;
}

function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [statsRes, productsRes, feedRes] = await Promise.all([
      getStats(),
      getProducts(),
      getFeed(20),
    ]);
    if (statsRes) setStats(statsRes);
    if (productsRes?.products) setProducts(productsRes.products);
    if (feedRes?.items) setFeed(feedRes.items);
    setLastUpdated(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      refresh();
    });
  }, [refresh]);

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-foreground">Internal Dashboard</h1>
          <div className="flex items-center gap-3">
            {lastUpdated ? (
              <span className="text-xs text-muted">Updated {formatRelativeTime(Math.floor(lastUpdated / 1000))}</span>
            ) : null}
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Customers" value={stats?.totalUserTrades} />
          <StatCard label="Total Escrow Volume" value={stats ? formatCurrency(stats.totalEscrow, "EUR") : undefined} />
          <StatCard label="Active Slots" value={stats?.activeSlots} />
          <StatCard label="Completed MM" value={stats?.completedMM} />
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-background-elevated/40 p-4">
          <h2 className="text-sm font-semibold text-foreground">Products</h2>
          {products.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No products.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-muted">
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Price</th>
                    <th className="py-2 pr-4">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-border/60">
                      <td className="py-2 pr-4 font-mono text-xs text-muted">{p.id}</td>
                      <td className="py-2 pr-4 text-foreground">{p.name}</td>
                      <td className="py-2 pr-4 text-foreground">{formatCurrency(p.price, p.currency)}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            p.stock > 0
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-background-elevated/40 p-4">
          <h2 className="text-sm font-semibold text-foreground">Live Activity Feed</h2>
          {feed.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No activity yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {feed.map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-4 border-t border-border/60 py-2 first:border-t-0">
                  <span className="text-foreground">
                    {item.label}
                    {item.method ? ` · ${item.method}` : ""}
                  </span>
                  <span className="flex items-center gap-3 text-xs text-muted">
                    {item.amount !== undefined ? <span>{formatCurrency(item.amount, "EUR")}</span> : null}
                    <span>{formatRelativeTime(item.ts)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-background-elevated/40 p-4">
      <div className="text-lg font-bold text-foreground">{value ?? "—"}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}
