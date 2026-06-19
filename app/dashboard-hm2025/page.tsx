"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getFeed, getHealth, getLtcPrice, getProducts, getStats } from "@/lib/api";
import { formatCurrency, formatEur, formatNumber, formatRelativeTime } from "@/lib/format";
import type { FeedItem, LtcResponse, StatsResponse, ApiProduct } from "@/lib/types";

const DASHBOARD_PASSWORD = "HeavenAdmin2025";
const AUTO_REFRESH_MS = 15_000;

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

type FeedFilter = "all" | "order" | "escrow" | "mm" | "slot" | "exchange";

function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [ltc, setLtc] = useState<LtcResponse | null>(null);
  const [botOnline, setBotOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");
  const [productSearch, setProductSearch] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [statsRes, productsRes, feedRes, ltcRes, healthRes] = await Promise.all([
      getStats(),
      getProducts(),
      getFeed(50),
      getLtcPrice(),
      getHealth(),
    ]);
    if (statsRes) setStats(statsRes);
    if (productsRes?.products) setProducts(productsRes.products);
    if (feedRes?.items) setFeed(feedRes.items);
    if (ltcRes) setLtc(ltcRes);
    setBotOnline(healthRes?.ok ?? false);
    setLastUpdated(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => { refresh(); });
  }, [refresh]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refresh, AUTO_REFRESH_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refresh]);

  const filteredFeed = feedFilter === "all" ? feed : feed.filter((f) => f.type === feedFilter);

  const inStock = products.filter((p) => p.stock > 0).length;
  const outOfStock = products.filter((p) => p.stock <= 0).length;
  const totalStockValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  const filteredProducts = productSearch.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.id.toString().includes(productSearch))
    : products;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">HM Dashboard</h1>
            <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              botOnline === null
                ? "border-border text-muted"
                : botOnline
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-400"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                botOnline === null ? "bg-muted" : botOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              }`} />
              {botOnline === null ? "Checking…" : botOnline ? "Bot Online" : "Bot Offline"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated ? (
              <span className="text-xs text-muted">Updated {formatRelativeTime(Math.floor(lastUpdated / 1000))}</span>
            ) : null}
            <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="accent-accent"
              />
              Auto (15s)
            </label>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {loading ? "…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* LTC Price Banner */}
        {ltc && (
          <div className="mt-4 flex items-center gap-4 rounded-xl border border-border bg-background-elevated/40 px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted">LTC</span>
            <span className="font-bold text-foreground">{formatEur(ltc.eur)}</span>
            <span className="text-sm text-muted">/ ${ltc.usd.toFixed(2)}</span>
            <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
              ltc.changePct >= 0
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400"
            }`}>
              {ltc.changePct >= 0 ? "▲" : "▼"} {Math.abs(ltc.changePct).toFixed(2)}%
            </span>
          </div>
        )}

        {/* Stats Grid */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          <DashStatCard
            label="Ordini Totali"
            value={stats?.totalOrders ?? stats?.totalUserTrades}
            icon="📦"
          />
          <DashStatCard
            label="Volume Totale"
            value={
              stats?.totalVolumeEur !== undefined
                ? formatCurrency(stats.totalVolumeEur, "EUR")
                : stats
                  ? formatCurrency(stats.totalEscrow, "EUR")
                  : undefined
            }
            icon="💰"
            accent
          />
          <DashStatCard
            label="Clienti Totali"
            value={stats?.totalCustomers ?? stats?.totalUserTrades}
            icon="👥"
          />
          <DashStatCard
            label="Ticket Aperti"
            value={stats?.openTickets}
            icon="🎫"
            warn={stats?.openTickets !== undefined && stats.openTickets > 0}
          />
          <DashStatCard label="Slot Attivi" value={stats?.activeSlots} icon="📢" />
          <DashStatCard label="MM Completati" value={stats?.completedMM} icon="🤝" />
          <DashStatCard label="Trade Totali" value={stats?.totalUserTrades} icon="🔄" />
          <DashStatCard label="Escrow Volume" value={stats ? formatCurrency(stats.totalEscrow, "EUR") : undefined} icon="🔒" />
        </section>

        {/* Products Section */}
        <section className="mt-8 rounded-2xl border border-border bg-background-elevated/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-foreground">Prodotti</h2>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                {inStock} in stock
              </span>
              {outOfStock > 0 && (
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400">
                  {outOfStock} esauriti
                </span>
              )}
              <span className="text-xs text-muted">
                Valore stock: {formatCurrency(totalStockValue, "EUR")}
              </span>
            </div>
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Cerca prodotto…"
              className="w-44 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs text-foreground outline-none transition-colors focus:border-accent"
            />
          </div>

          {products.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nessun prodotto.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-muted">
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">Img</th>
                    <th className="py-2 pr-3">Nome</th>
                    <th className="py-2 pr-3">Prezzo</th>
                    <th className="py-2 pr-3">LTC</th>
                    <th className="py-2 pr-3">Stock</th>
                    <th className="py-2 pr-3">Valore</th>
                    <th className="py-2">Descrizione</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="border-t border-border/60">
                      <td className="py-2 pr-3 font-mono text-xs text-muted">{p.id}</td>
                      <td className="py-2 pr-3">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-background-elevated text-xs text-muted">—</div>
                        )}
                      </td>
                      <td className="py-2 pr-3 font-medium text-foreground">{p.name}</td>
                      <td className="py-2 pr-3 text-foreground">{formatCurrency(p.price, p.currency)}</td>
                      <td className="py-2 pr-3 font-mono text-xs text-muted">
                        {ltc ? (p.price / ltc.eur).toFixed(8) : "—"}
                      </td>
                      <td className="py-2 pr-3">
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
                      <td className="py-2 pr-3 text-xs text-muted">
                        {formatCurrency(p.price * p.stock, p.currency)}
                      </td>
                      <td className="max-w-xs truncate py-2 text-xs text-muted">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Activity Feed */}
        <section className="mt-8 rounded-2xl border border-border bg-background-elevated/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Attività Live</h2>
            <div className="flex gap-1.5">
              {(["all", "order", "escrow", "mm", "slot", "exchange"] as FeedFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFeedFilter(f)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    feedFilter === f
                      ? "bg-accent text-background"
                      : "bg-background/60 text-muted hover:text-foreground"
                  }`}
                >
                  {f === "all" ? "Tutti" : f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {filteredFeed.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nessuna attività.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-0 text-sm">
              {filteredFeed.map((item, i) => (
                <li key={i} className="flex items-center gap-3 border-t border-border/60 py-2.5 first:border-t-0">
                  <FeedTypeBadge type={item.type} />
                  <span className="flex-1 text-foreground">
                    {item.label}
                    {item.method ? <span className="ml-1 text-xs text-muted">· {item.method}</span> : ""}
                  </span>
                  {item.amount !== undefined && (
                    <span className="font-semibold text-foreground">{formatCurrency(item.amount, "EUR")}</span>
                  )}
                  <span className="shrink-0 text-xs text-muted">{formatRelativeTime(item.ts)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-muted">
          Auto-refresh {autoRefresh ? "attivo" : "disattivato"} · {products.length} prodotti · {feed.length} eventi caricati
        </div>
      </div>
    </main>
  );
}

function DashStatCard({
  label,
  value,
  icon,
  accent,
  warn,
}: {
  label: string;
  value?: string | number;
  icon?: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${
      warn
        ? "border-amber-500/30 bg-amber-500/5"
        : accent
          ? "border-accent/30 bg-accent/5"
          : "border-border bg-background-elevated/40"
    }`}>
      <div className="flex items-center justify-between">
        <span className={`text-xl font-bold ${
          warn ? "text-amber-400" : accent ? "text-accent" : "text-foreground"
        }`}>
          {value ?? "—"}
        </span>
        {icon ? <span className="text-lg">{icon}</span> : null}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

const FEED_TYPE_COLORS: Record<string, string> = {
  order: "bg-blue-500",
  escrow: "bg-emerald-500",
  mm: "bg-amber-500",
  slot: "bg-purple-500",
  exchange: "bg-cyan-500",
};

function FeedTypeBadge({ type }: { type: string }) {
  return (
    <span className={`flex h-6 shrink-0 items-center rounded px-1.5 text-[10px] font-bold uppercase text-white ${FEED_TYPE_COLORS[type] ?? "bg-muted"}`}>
      {type}
    </span>
  );
}
