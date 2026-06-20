"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createProduct,
  deleteProduct,
  getFeed,
  getHealth,
  getLtcPrice,
  getProducts,
  getStats,
  getWalletInfo,
  transferFunds,
  updateProduct,
  updateProductStock,
} from "@/lib/api";
import { formatCurrency, formatEur, formatRelativeTime } from "@/lib/format";
import type {
  ApiProduct,
  FeedItem,
  LtcResponse,
  StatsResponse,
  WalletInfo,
} from "@/lib/types";

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const DASHBOARD_PASSWORD = "HeavenAdmin2025";
const AUTO_REFRESH_MS = 15_000;

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type NavSection =
  | "dashboard"
  | "products"
  | "product-edit"
  | "orders"
  | "customers"
  | "tickets"
  | "wallet"
  | "settings";

type ModalKind =
  | { kind: "confirm-delete"; product: ApiProduct }
  | { kind: "confirm-transfer"; amount: number; toAddress: string };

/* ================================================================== */
/*  SVG Icons (inline, no deps)                                        */
/* ================================================================== */

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconProducts({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconOrders({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconCustomers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconTickets({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconWallet({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconCopy({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconTrendUp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

/* ================================================================== */
/*  SVG Charts                                                         */
/* ================================================================== */

function BarChart({
  data,
  labels,
  color = "#a78bfa",
  height = 160,
}: {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data, 1);
  const barCount = data.length;
  const barWidth = 100 / (barCount * 2);
  const gap = barWidth;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${barCount * (barWidth + gap) * 10 + 20} ${height + 30}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {data.map((val, i) => {
          const barH = max > 0 ? (val / max) * (height - 20) : 0;
          const x = 10 + i * (barWidth + gap) * 10;
          const y = height - barH;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth * 10}
                height={barH}
                rx="4"
                fill={color}
                opacity="0.85"
              />
              <text
                x={x + (barWidth * 10) / 2}
                y={height + 16}
                textAnchor="middle"
                className="fill-muted"
                fontSize="9"
              >
                {labels[i] ?? ""}
              </text>
              {val > 0 && (
                <text
                  x={x + (barWidth * 10) / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="fill-foreground"
                  fontSize="9"
                  fontWeight="600"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(val < 10 ? 1 : 0)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SparkLine({
  data,
  color = "#a78bfa",
  height = 40,
  width = 120,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ================================================================== */
/*  Password Gate                                                      */
/* ================================================================== */

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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
              <span className="text-lg font-bold text-accent">HM</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Heaven Market</h1>
              <p className="text-xs text-muted">Admin Dashboard</p>
            </div>
          </div>
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
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Unlock
          </button>
        </form>
      </main>
    );
  }

  return <AdminPanel />;
}

/* ================================================================== */
/*  Main Admin Panel                                                   */
/* ================================================================== */

function AdminPanel() {
  /* ── state ── */
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [ltc, setLtc] = useState<LtcResponse | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [botOnline, setBotOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [activeNav, setActiveNav] = useState<NavSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* ── data fetching ── */
  const refresh = useCallback(async () => {
    setLoading(true);
    const [statsRes, productsRes, feedRes, ltcRes, healthRes, walletRes] =
      await Promise.all([
        getStats(),
        getProducts(),
        getFeed(100),
        getLtcPrice(),
        getHealth(),
        getWalletInfo(),
      ]);
    if (statsRes) setStats(statsRes);
    if (productsRes?.products) setProducts(productsRes.products);
    if (feedRes?.items) setFeed(feedRes.items);
    if (ltcRes) setLtc(ltcRes);
    if (walletRes) setWallet(walletRes);
    setBotOnline(healthRes?.ok ?? false);
    setLastUpdated(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      refresh();
    });
  }, [refresh]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refresh, AUTO_REFRESH_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refresh]);

  /* ── computed ── */
  const filteredProducts = productSearch.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.id.toString().includes(productSearch)
      )
    : products;

  const orderFeed = feed.filter((f) => f.type === "order");
  const revenueTotal =
    stats?.totalVolumeEur ?? orderFeed.reduce((s, f) => s + (f.amount ?? 0), 0);
  const orderCount = stats?.totalOrders ?? orderFeed.length;
  const customerCount = stats?.totalCustomers ?? 0;
  const avgOrderValue = orderCount > 0 ? revenueTotal / orderCount : 0;

  /* ── daily aggregations for charts ── */
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const dayLabels = last7Days.map((d) =>
    d.toLocaleDateString("en", { weekday: "short" })
  );

  const dailyRevenue = last7Days.map((day) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    return orderFeed
      .filter((f) => {
        const ts = f.ts > 1e12 ? f.ts : f.ts * 1000;
        return ts >= dayStart.getTime() && ts <= dayEnd.getTime();
      })
      .reduce((s, f) => s + (f.amount ?? 0), 0);
  });

  const dailyOrders = last7Days.map((day) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    return orderFeed.filter((f) => {
      const ts = f.ts > 1e12 ? f.ts : f.ts * 1000;
      return ts >= dayStart.getTime() && ts <= dayEnd.getTime();
    }).length;
  });

  /* ── product actions ── */
  async function handleStockChange(product: ApiProduct, delta: number) {
    const newStock = Math.max(0, product.stock + delta);
    const ok = await updateProductStock(product.id, newStock);
    if (ok) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, stock: newStock } : p
        )
      );
      showToast(`Stock aggiornato a ${newStock}`, true);
    } else {
      showToast("Errore aggiornamento stock", false);
    }
  }

  async function handleDeleteProduct(product: ApiProduct) {
    const ok = await deleteProduct(product.id);
    if (ok) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`"${product.name}" eliminato`, true);
    } else {
      showToast("Errore eliminazione prodotto", false);
    }
    setModal(null);
  }

  async function handleSaveProduct(
    data: Partial<ApiProduct> & { id?: string }
  ) {
    if (data.id) {
      const { id, ...rest } = data;
      const updated = await updateProduct(id, rest);
      if (updated) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
        );
        showToast(`"${updated.name}" aggiornato`, true);
      } else {
        showToast("Errore aggiornamento prodotto", false);
      }
    } else {
      const created = await createProduct(data as Omit<ApiProduct, "id">);
      if (created) {
        setProducts((prev) => [...prev, created]);
        showToast(`"${created.name}" creato`, true);
      } else {
        showToast("Errore creazione prodotto", false);
      }
    }
    setActiveNav("products");
    setEditingProduct(null);
  }

  async function handleTransfer(amount: number, toAddress: string) {
    const res = await transferFunds(amount, toAddress);
    if (res) {
      showToast(`Trasferimento completato! TX: ${res.txId}`, true);
      const walletRes = await getWalletInfo();
      if (walletRes) setWallet(walletRes);
    } else {
      showToast("Errore trasferimento fondi", false);
    }
    setModal(null);
  }

  function navigateTo(section: NavSection) {
    setActiveNav(section);
    setEditingProduct(null);
    setSidebarOpen(false);
  }

  function openProductEdit(product: ApiProduct | null) {
    setEditingProduct(product);
    setActiveNav("product-edit");
    setSidebarOpen(false);
  }

  /* ── best selling products ── */
  const productSales = new Map<string, number>();
  orderFeed.forEach((f) => {
    const name = f.label.replace(/^Ordine\s*/i, "").replace(/^Order\s*/i, "").trim();
    if (name) {
      productSales.set(name, (productSales.get(name) ?? 0) + 1);
    }
  });
  const bestSelling = [...productSales.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  /* ── top spenders ── */
  const spenderMap = new Map<string, number>();
  orderFeed.forEach((f) => {
    const method = f.method ?? "Unknown";
    spenderMap.set(method, (spenderMap.get(method) ?? 0) + (f.amount ?? 0));
  });
  const topSpenders = [...spenderMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  /* ── render ── */
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-[100] animate-[fadeIn_0.2s] rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
            toast.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/30 bg-rose-500/10 text-rose-400"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-background-elevated/60 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
            <span className="text-sm font-bold text-accent">HM</span>
          </div>
          <span className="text-sm font-bold text-foreground">Heaven Market</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden"
          >
            <IconX className="h-5 w-5 text-muted" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarLabel>Menu</SidebarLabel>
          <SidebarItem
            icon={<IconDashboard className="h-4 w-4" />}
            label="Dashboard"
            active={activeNav === "dashboard"}
            onClick={() => navigateTo("dashboard")}
          />

          <SidebarLabel>Catalogo</SidebarLabel>
          <SidebarItem
            icon={<IconProducts className="h-4 w-4" />}
            label="Prodotti"
            active={activeNav === "products" || activeNav === "product-edit"}
            onClick={() => navigateTo("products")}
          />

          <SidebarLabel>Ordini</SidebarLabel>
          <SidebarItem
            icon={<IconOrders className="h-4 w-4" />}
            label="Ordini / Invoices"
            active={activeNav === "orders"}
            onClick={() => navigateTo("orders")}
          />
          <SidebarItem
            icon={<IconCustomers className="h-4 w-4" />}
            label="Clienti"
            active={activeNav === "customers"}
            onClick={() => navigateTo("customers")}
          />
          <SidebarItem
            icon={<IconTickets className="h-4 w-4" />}
            label="Tickets"
            active={activeNav === "tickets"}
            onClick={() => navigateTo("tickets")}
          />

          <SidebarLabel>Wallets</SidebarLabel>
          <SidebarItem
            icon={<IconWallet className="h-4 w-4" />}
            label="Crypto (LTC)"
            active={activeNav === "wallet"}
            onClick={() => navigateTo("wallet")}
          />

          <div className="mt-4" />
          <SidebarItem
            icon={<IconSettings className="h-4 w-4" />}
            label="Impostazioni"
            active={activeNav === "settings"}
            onClick={() => navigateTo("settings")}
          />
        </nav>

        {/* Bottom user / bot status */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                botOnline === null
                  ? "bg-muted"
                  : botOnline
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-rose-400"
              }`}
            />
            <span className="text-[11px] text-muted">
              Bot {botOnline === null ? "..." : botOnline ? "Online" : "Offline"}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-muted">fraanti10@gmail.com</p>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <IconMenu className="h-5 w-5 text-muted" />
          </button>

          <h2 className="text-sm font-semibold text-foreground capitalize">
            {activeNav === "product-edit"
              ? editingProduct
                ? `Modifica: ${editingProduct.name}`
                : "Nuovo Prodotto"
              : activeNav === "dashboard"
                ? "Dashboard"
                : activeNav}
          </h2>

          <div className="ml-auto flex items-center gap-3">
            {lastUpdated ? (
              <span className="hidden text-xs text-muted sm:inline">
                {formatRelativeTime(Math.floor(lastUpdated / 1000))}
              </span>
            ) : null}
            <label className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="accent-accent"
              />
              Auto
            </label>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {loading ? "..." : "Refresh"}
            </button>
            {/* Bot badge */}
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold sm:flex ${
                botOnline === null
                  ? "border-border text-muted"
                  : botOnline
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  botOnline === null
                    ? "bg-muted"
                    : botOnline
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-rose-400"
                }`}
              />
              {botOnline === null
                ? "..."
                : botOnline
                  ? "Online"
                  : "Offline"}
            </span>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeNav === "dashboard" && (
            <DashboardView
              stats={stats}
              revenueTotal={revenueTotal}
              orderCount={orderCount}
              customerCount={customerCount}
              avgOrderValue={avgOrderValue}
              dailyRevenue={dailyRevenue}
              dailyOrders={dailyOrders}
              dayLabels={dayLabels}
              orderFeed={orderFeed}
              bestSelling={bestSelling}
              topSpenders={topSpenders}
              ltc={ltc}
            />
          )}
          {activeNav === "products" && (
            <ProductsView
              products={filteredProducts}
              productSearch={productSearch}
              onSearchChange={setProductSearch}
              onEdit={openProductEdit}
              onNew={() => openProductEdit(null)}
              onDelete={(p) => setModal({ kind: "confirm-delete", product: p })}
              onStockChange={handleStockChange}
              ltc={ltc}
            />
          )}
          {activeNav === "product-edit" && (
            <ProductEditView
              product={editingProduct}
              onSave={handleSaveProduct}
              onCancel={() => navigateTo("products")}
              onDelete={(p) => setModal({ kind: "confirm-delete", product: p })}
            />
          )}
          {activeNav === "orders" && (
            <OrdersView feed={orderFeed} allFeed={feed} ltc={ltc} />
          )}
          {activeNav === "customers" && (
            <CustomersView feed={feed} />
          )}
          {activeNav === "tickets" && (
            <TicketsView openTickets={stats?.openTickets ?? 0} />
          )}
          {activeNav === "wallet" && (
            <WalletView
              wallet={wallet}
              ltc={ltc}
              showToast={showToast}
              onTransfer={(amount, toAddress) =>
                setModal({ kind: "confirm-transfer", amount, toAddress })
              }
              feed={feed}
            />
          )}
          {activeNav === "settings" && (
            <SettingsView
              autoRefresh={autoRefresh}
              onAutoRefreshChange={setAutoRefresh}
              botOnline={botOnline}
              products={products}
              feed={feed}
            />
          )}
        </main>
      </div>

      {/* ── Modals ── */}
      {modal?.kind === "confirm-delete" && (
        <ConfirmModal
          title="Conferma Eliminazione"
          message={`Sei sicuro di voler eliminare "${modal.product.name}"? Questa azione non puo essere annullata.`}
          confirmLabel="Elimina"
          confirmClass="bg-rose-500 text-white hover:bg-rose-600"
          onConfirm={() => handleDeleteProduct(modal.product)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "confirm-transfer" && (
        <ConfirmModal
          title="Conferma Trasferimento"
          message={`Vuoi trasferire ${modal.amount.toFixed(8)} LTC a ${modal.toAddress}?`}
          confirmLabel="Conferma Trasferimento"
          confirmClass="bg-amber-500 text-black hover:bg-amber-600"
          onConfirm={() => handleTransfer(modal.amount, modal.toAddress)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/*  Sidebar Components                                                 */
/* ================================================================== */

function SidebarLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted first:mt-0">
      {children}
    </p>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "border-l-2 border-accent bg-accent/10 font-semibold text-accent"
          : "text-muted hover:bg-background/40 hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ================================================================== */
/*  Dashboard View                                                     */
/* ================================================================== */

function DashboardView({
  revenueTotal,
  orderCount,
  customerCount,
  avgOrderValue,
  dailyRevenue,
  dailyOrders,
  dayLabels,
  orderFeed,
  bestSelling,
  topSpenders,
  ltc,
}: {
  stats: StatsResponse | null;
  revenueTotal: number;
  orderCount: number;
  customerCount: number;
  avgOrderValue: number;
  dailyRevenue: number[];
  dailyOrders: number[];
  dayLabels: string[];
  orderFeed: FeedItem[];
  bestSelling: [string, number][];
  topSpenders: [string, number][];
  ltc: LtcResponse | null;
}) {
  return (
    <div className="space-y-6">
      {/* LTC banner */}
      {ltc && (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-background-elevated/40 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            LTC
          </span>
          <span className="font-bold text-foreground">{formatEur(ltc.eur)}</span>
          <span className="text-sm text-muted">/ ${ltc.usd.toFixed(2)}</span>
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
              ltc.changePct >= 0
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400"
            }`}
          >
            {ltc.changePct >= 0 ? "+" : ""}
            {ltc.changePct.toFixed(2)}%
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatCurrency(revenueTotal, "EUR")}
          change="+12.5%"
          positive
          sparkData={dailyRevenue}
        />
        <StatCard
          label="Ordini"
          value={orderCount.toString()}
          change="+8.2%"
          positive
          sparkData={dailyOrders}
        />
        <StatCard
          label="Clienti"
          value={customerCount.toString()}
          change="+3.1%"
          positive
        />
        <StatCard
          label="Valore Medio"
          value={formatCurrency(avgOrderValue, "EUR")}
          change=""
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue chart */}
        <div className="rounded-2xl border border-border bg-background-elevated/40 p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Revenue (7 giorni)
          </h3>
          <BarChart
            data={dailyRevenue}
            labels={dayLabels}
            color="#a78bfa"
            height={160}
          />
        </div>

        {/* Orders chart */}
        <div className="rounded-2xl border border-border bg-background-elevated/40 p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Ordini (7 giorni)
          </h3>
          <BarChart
            data={dailyOrders}
            labels={dayLabels}
            color="#34d399"
            height={160}
          />
        </div>
      </div>

      {/* Bottom row: Latest orders + Best selling + Top spenders */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Latest completed orders */}
        <div className="rounded-2xl border border-border bg-background-elevated/40 p-5 lg:col-span-1">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Ultimi Ordini
          </h3>
          {orderFeed.length === 0 ? (
            <p className="text-xs text-muted">Nessun ordine recente.</p>
          ) : (
            <ul className="space-y-2">
              {orderFeed.slice(0, 8).map((item, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted">
                      {formatRelativeTime(item.ts)}
                    </p>
                  </div>
                  {item.amount !== undefined && (
                    <span className="ml-2 shrink-0 text-sm font-semibold text-emerald-400">
                      {formatCurrency(item.amount, "EUR")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Best selling */}
        <div className="rounded-2xl border border-border bg-background-elevated/40 p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Best Selling
          </h3>
          {bestSelling.length === 0 ? (
            <p className="text-xs text-muted">Nessun dato disponibile.</p>
          ) : (
            <ul className="space-y-2">
              {bestSelling.map(([name, count], i) => (
                <li
                  key={i}
                  className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm text-foreground">
                      {name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-muted">
                    {count} vendite
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top spenders */}
        <div className="rounded-2xl border border-border bg-background-elevated/40 p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Top Spenders
          </h3>
          {topSpenders.length === 0 ? (
            <p className="text-xs text-muted">Nessun dato disponibile.</p>
          ) : (
            <ul className="space-y-2">
              {topSpenders.map(([method, total], i) => (
                <li
                  key={i}
                  className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm text-foreground">
                      {method}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(total, "EUR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  positive,
  sparkData,
}: {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  sparkData?: number[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-background-elevated/40 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
          <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
          {change && (
            <div className="mt-1 flex items-center gap-1">
              {positive && <IconTrendUp className="h-3 w-3 text-emerald-400" />}
              <span
                className={`text-xs font-semibold ${
                  positive ? "text-emerald-400" : "text-muted"
                }`}
              >
                {change}
              </span>
            </div>
          )}
        </div>
        {sparkData && sparkData.length > 1 && (
          <SparkLine
            data={sparkData}
            color={positive ? "#34d399" : "#a78bfa"}
            width={80}
            height={32}
          />
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Products View                                                      */
/* ================================================================== */

function ProductsView({
  products,
  productSearch,
  onSearchChange,
  onEdit,
  onNew,
  onDelete,
  onStockChange,
  ltc,
}: {
  products: ApiProduct[];
  productSearch: string;
  onSearchChange: (val: string) => void;
  onEdit: (product: ApiProduct) => void;
  onNew: () => void;
  onDelete: (product: ApiProduct) => void;
  onStockChange: (product: ApiProduct, delta: number) => void;
  ltc: LtcResponse | null;
}) {
  const inStock = products.filter((p) => p.stock > 0).length;
  const outOfStock = products.filter((p) => p.stock <= 0).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-foreground">Prodotti</h3>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            {inStock} in stock
          </span>
          {outOfStock > 0 && (
            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
              {outOfStock} esauriti
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cerca prodotto..."
              className="w-52 rounded-lg border border-border bg-background/60 py-1.5 pl-8 pr-3 text-xs text-foreground outline-none transition-colors focus:border-accent"
            />
          </div>
          <button
            type="button"
            onClick={onNew}
            className="rounded-lg bg-accent px-4 py-1.5 text-xs font-bold text-background transition-opacity hover:opacity-90"
          >
            + Nuovo Prodotto
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-background-elevated/40">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Img</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Prezzo</th>
              <th className="hidden px-4 py-3 sm:table-cell">LTC</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-muted"
                >
                  Nessun prodotto trovato.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border/40 transition-colors hover:bg-background/40 cursor-pointer"
                  onClick={() => onEdit(p)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-elevated text-xs text-muted">
                        ---
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="max-w-[12rem] truncate text-xs text-muted">
                      {p.description}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {formatCurrency(p.price, p.currency)}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-muted sm:table-cell">
                    {ltc ? (p.price / ltc.eur).toFixed(6) : "---"}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onStockChange(p, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-border text-xs font-bold text-rose-400 transition-colors hover:border-rose-400 hover:bg-rose-500/10"
                      >
                        -
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-semibold text-foreground">
                        {p.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => onStockChange(p, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-border text-xs font-bold text-emerald-400 transition-colors hover:border-emerald-400 hover:bg-emerald-500/10"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        p.stock > 0
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {p.stock > 0 ? "In Stock" : "Esaurito"}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p)}
                        className="rounded-lg border border-rose-500/30 px-2.5 py-1 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/10"
                      >
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Product Edit View                                                  */
/* ================================================================== */

function ProductEditView({
  product,
  onSave,
  onCancel,
  onDelete,
}: {
  product: ApiProduct | null;
  onSave: (data: Partial<ApiProduct> & { id?: string }) => void;
  onCancel: () => void;
  onDelete: (product: ApiProduct) => void;
}) {
  const [activeTab, setActiveTab] = useState<"general" | "pricing">("general");
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [image, setImage] = useState(product?.image ?? "");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [currency, setCurrency] = useState(product?.currency ?? "EUR");
  const [stock, setStock] = useState(product?.stock ?? 0);
  const [stockItems, setStockItems] = useState("");
  const [saving, setSaving] = useState(false);

  function handleSave() {
    if (!name.trim() || !price.trim()) return;
    setSaving(true);
    onSave({
      ...(product ? { id: product.id } : {}),
      name: name.trim(),
      price: parseFloat(price),
      currency,
      description: description.trim(),
      image: image.trim() || undefined,
      stock,
    });
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          <IconChevronLeft className="h-4 w-4" />
          Torna ai prodotti
        </button>
        <div className="flex items-center gap-2">
          {product && (
            <button
              type="button"
              onClick={() => onDelete(product)}
              className="rounded-lg border border-rose-500/30 px-4 py-1.5 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/10"
            >
              Elimina
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim() || !price.trim()}
            className="rounded-lg bg-accent px-4 py-1.5 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "general"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Generale
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pricing")}
          className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "pricing"
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Prezzo & Stock
        </button>
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-6">
        {activeTab === "general" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted">
                Nome *
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted">
                Descrizione
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted">
                Categoria
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="es. Digital, Account, etc."
                  className="rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
                />
              </label>
            </div>
            <div className="space-y-4">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted">
                URL Immagine
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
                />
              </label>
              {image.trim() && (
                <div className="rounded-xl border border-border bg-background/40 p-4">
                  <p className="mb-2 text-xs text-muted">Preview</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt="preview"
                    className="h-32 w-32 rounded-lg object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted">
                Prezzo *
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted">
                Valuta
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </label>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">Stock</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStock((s) => Math.max(0, s - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-lg font-bold text-rose-400 transition-colors hover:border-rose-400 hover:bg-rose-500/10"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) =>
                      setStock(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-20 rounded-lg border border-border bg-background/60 px-3 py-2 text-center text-sm font-semibold text-foreground outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setStock((s) => s + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-lg font-bold text-emerald-400 transition-colors hover:border-emerald-400 hover:bg-emerald-500/10"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted">
                Stock Items / Serials
                <p className="text-[11px] font-normal text-muted">
                  Incolla codici/seriali, uno per riga. Questi sono gli item
                  consegnabili.
                </p>
                <textarea
                  value={stockItems}
                  onChange={(e) => setStockItems(e.target.value)}
                  rows={6}
                  placeholder={"SERIAL-001\nSERIAL-002\nSERIAL-003"}
                  className="rounded-lg border border-border bg-background/60 px-3 py-2.5 font-mono text-xs text-foreground outline-none transition-colors focus:border-accent"
                />
              </label>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">
                  {stockItems.trim()
                    ? `${stockItems.trim().split("\n").length} items`
                    : "0 items"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const lines = stockItems
                      .trim()
                      .split("\n")
                      .filter((l) => l.trim());
                    setStock((s) => s + lines.length);
                  }}
                  disabled={!stockItems.trim()}
                  className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  Aggiungi allo Stock
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Orders View                                                        */
/* ================================================================== */

function OrdersView({
  feed,
  allFeed,
  ltc,
}: {
  feed: FeedItem[];
  allFeed: FeedItem[];
  ltc: LtcResponse | null;
}) {
  // Use all feed to show diverse activity
  const orderItems = allFeed.filter(
    (f) => f.type === "order" || f.type === "escrow"
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">Ordini / Invoices</h3>

      <div className="overflow-x-auto rounded-2xl border border-border bg-background-elevated/40">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Prodotto</th>
              <th className="hidden px-4 py-3 sm:table-cell">Cliente</th>
              <th className="px-4 py-3">Importo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-muted"
                >
                  Nessun ordine trovato.
                </td>
              </tr>
            ) : (
              orderItems.map((item, i) => {
                const status =
                  item.type === "escrow"
                    ? "pending"
                    : item.amount && item.amount > 0
                      ? "paid"
                      : "pending";
                return (
                  <tr
                    key={i}
                    className="border-b border-border/40 transition-colors hover:bg-background/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      #{(1000 + i).toString().padStart(5, "0")}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {item.label}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted sm:table-cell">
                      {item.method ?? "N/A"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {item.amount !== undefined
                        ? formatCurrency(item.amount, "EUR")
                        : "---"}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {formatRelativeTime(item.ts)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const colors =
    status === "paid"
      ? "bg-emerald-500/10 text-emerald-400"
      : status === "pending"
        ? "bg-amber-500/10 text-amber-400"
        : "bg-rose-500/10 text-rose-400";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors}`}
    >
      {status === "paid"
        ? "Completato"
        : status === "pending"
          ? "In Attesa"
          : "Annullato"}
    </span>
  );
}

/* ================================================================== */
/*  Customers View                                                     */
/* ================================================================== */

function CustomersView({ feed }: { feed: FeedItem[] }) {
  // Aggregate customers from feed methods
  const customerMap = new Map<
    string,
    { orders: number; total: number; lastSeen: number }
  >();
  feed
    .filter((f) => f.type === "order" && f.method)
    .forEach((f) => {
      const key = f.method ?? "Unknown";
      const existing = customerMap.get(key) ?? {
        orders: 0,
        total: 0,
        lastSeen: 0,
      };
      existing.orders++;
      existing.total += f.amount ?? 0;
      const ts = f.ts > 1e12 ? f.ts : f.ts * 1000;
      if (ts > existing.lastSeen) existing.lastSeen = ts;
      customerMap.set(key, existing);
    });

  const customers = [...customerMap.entries()]
    .sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">Clienti</h3>

      <div className="overflow-x-auto rounded-2xl border border-border bg-background-elevated/40">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Ordini</th>
              <th className="px-4 py-3">Totale Speso</th>
              <th className="px-4 py-3">Ultimo Ordine</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-muted"
                >
                  Nessun cliente trovato.
                </td>
              </tr>
            ) : (
              customers.map(([name, data], i) => (
                <tr
                  key={i}
                  className="border-b border-border/40 transition-colors hover:bg-background/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{data.orders}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {formatCurrency(data.total, "EUR")}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {data.lastSeen > 0
                      ? formatRelativeTime(Math.floor(data.lastSeen / 1000))
                      : "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tickets View                                                       */
/* ================================================================== */

function TicketsView({ openTickets }: { openTickets: number }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">Tickets</h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background-elevated/40 p-5">
          <p className="text-xs uppercase tracking-wider text-muted">
            Ticket Aperti
          </p>
          <p
            className={`mt-2 text-3xl font-bold ${openTickets > 0 ? "text-amber-400" : "text-foreground"}`}
          >
            {openTickets}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-background-elevated/40 p-5">
          <p className="text-xs uppercase tracking-wider text-muted">
            Tempo Medio Risposta
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">---</p>
        </div>
        <div className="rounded-2xl border border-border bg-background-elevated/40 p-5">
          <p className="text-xs uppercase tracking-wider text-muted">
            Soddisfazione
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">---</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background-elevated/40 p-5">
        <p className="text-sm text-muted">
          I ticket vengono gestiti tramite Discord. Qui puoi visualizzare le
          statistiche aggregate.
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Wallet View                                                        */
/* ================================================================== */

function WalletView({
  wallet,
  ltc,
  showToast,
  onTransfer,
  feed,
}: {
  wallet: WalletInfo | null;
  ltc: LtcResponse | null;
  showToast: (msg: string, ok: boolean) => void;
  onTransfer: (amount: number, toAddress: string) => void;
  feed: FeedItem[];
}) {
  const [amount, setAmount] = useState("");
  const [toAddress, setToAddress] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || !toAddress.trim()) return;
    onTransfer(numAmount, toAddress.trim());
    setAmount("");
    setToAddress("");
  }

  const walletFeed = feed.filter(
    (f) =>
      f.type === "exchange" ||
      f.type === "escrow" ||
      (f.type === "order" && f.amount && f.amount > 0)
  );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-foreground">Wallet Crypto</h3>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Balance */}
        <div className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-background-elevated/40 p-6">
          <p className="text-xs uppercase tracking-wider text-muted">
            Saldo Disponibile
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-400">
            {wallet ? `${wallet.balance.toFixed(8)} LTC` : "---"}
          </p>
          {wallet && ltc && (
            <p className="mt-1 text-lg text-muted">
              ~ {formatCurrency(wallet.balance * ltc.eur, "EUR")}
            </p>
          )}
        </div>

        {/* Address */}
        <div className="rounded-2xl border border-border bg-background-elevated/40 p-6">
          <p className="text-xs uppercase tracking-wider text-muted">
            Indirizzo di Ricezione
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-background/60 px-3 py-2 font-mono text-xs text-foreground">
              {wallet?.address ?? "---"}
            </code>
            {wallet?.address && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(wallet.address);
                  showToast("Indirizzo copiato!", true);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:border-accent hover:text-accent"
              >
                <IconCopy className="h-4 w-4 text-muted" />
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Questo indirizzo non puo essere modificato
          </p>
        </div>
      </div>

      {/* Transfer form */}
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-6">
        <h4 className="mb-4 text-sm font-semibold text-foreground">
          Trasferisci Fondi
        </h4>
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted">
            Importo (LTC)
            <input
              type="number"
              step="any"
              min="0.00000001"
              max={wallet?.balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00000000"
              className="rounded-lg border border-border bg-background/60 px-3 py-2.5 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted">
            Indirizzo Destinazione
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="ltc1q..."
              className="rounded-lg border border-border bg-background/60 px-3 py-2.5 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                !toAddress.trim()
              }
              className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Trasferisci
            </button>
          </div>
        </form>
        {wallet && (
          <p className="mt-2 text-xs text-muted">
            Saldo disponibile: {wallet.balance.toFixed(8)} LTC
          </p>
        )}
      </div>

      {/* Transaction history */}
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-5">
        <h4 className="mb-3 text-sm font-semibold text-foreground">
          Cronologia Transazioni
        </h4>
        {walletFeed.length === 0 ? (
          <p className="text-sm text-muted">Nessuna transazione.</p>
        ) : (
          <ul className="space-y-0">
            {walletFeed.slice(0, 20).map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between border-b border-border/40 py-2.5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-6 shrink-0 items-center rounded px-1.5 text-[10px] font-bold uppercase text-white ${
                      item.type === "exchange"
                        ? "bg-cyan-500"
                        : item.type === "escrow"
                          ? "bg-emerald-500"
                          : "bg-blue-500"
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="text-sm text-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {item.amount !== undefined && (
                    <span className="font-semibold text-foreground">
                      {formatCurrency(item.amount, "EUR")}
                    </span>
                  )}
                  <span className="text-xs text-muted">
                    {formatRelativeTime(item.ts)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Settings View                                                      */
/* ================================================================== */

function SettingsView({
  autoRefresh,
  onAutoRefreshChange,
  botOnline,
  products,
  feed,
}: {
  autoRefresh: boolean;
  onAutoRefreshChange: (val: boolean) => void;
  botOnline: boolean | null;
  products: ApiProduct[];
  feed: FeedItem[];
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-foreground">Impostazioni</h3>

      <div className="rounded-2xl border border-border bg-background-elevated/40 p-6">
        <h4 className="mb-4 text-sm font-semibold text-foreground">
          Dashboard
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Auto-refresh</p>
              <p className="text-xs text-muted">
                Aggiorna i dati automaticamente ogni 15 secondi
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => onAutoRefreshChange(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-background peer-checked:bg-accent after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-foreground after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background-elevated/40 p-6">
        <h4 className="mb-4 text-sm font-semibold text-foreground">
          Informazioni Sistema
        </h4>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Bot Status</span>
            <span
              className={
                botOnline
                  ? "font-semibold text-emerald-400"
                  : "font-semibold text-rose-400"
              }
            >
              {botOnline === null
                ? "Verifica..."
                : botOnline
                  ? "Online"
                  : "Offline"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Prodotti</span>
            <span className="text-foreground">{products.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Eventi Caricati</span>
            <span className="text-foreground">{feed.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Admin Email</span>
            <span className="text-foreground">fraanti10@gmail.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Modals                                                             */
/* ================================================================== */

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-background-elevated p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <ModalOverlay onClose={onClose}>
      <h3 className="mb-2 text-base font-bold text-foreground">{title}</h3>
      <p className="mb-6 text-sm text-muted">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          Annulla
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            onConfirm();
          }}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-opacity disabled:opacity-50 ${confirmClass}`}
        >
          {busy ? "..." : confirmLabel}
        </button>
      </div>
    </ModalOverlay>
  );
}
