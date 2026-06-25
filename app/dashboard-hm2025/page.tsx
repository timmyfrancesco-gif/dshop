"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
import { useAuth } from "@/lib/hooks/useAuth";
import dynamic from "next/dynamic";
import type {
  ApiProduct,
  FeedItem,
  LtcResponse,
  StatsResponse,
  WalletInfo,
} from "@/lib/types";

const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), { ssr: false });

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const AUTO_REFRESH_MS = 60_000;

const STOREFRONT_CONFIG_KEY = "hm_storefront_config";

const NAV_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  categories: "Categories",
  coupons: "Coupons",
  orders: "Invoices",
  customers: "Customers",
  feedbacks: "Feedbacks",
  tickets: "Tickets",
  transcripts: "Transcripts",
  "abandoned-checkouts": "Abandoned Checkouts",
  wallet: "Wallet",
  "storefront-configure": "Configure Storefront",
  "activity-logs": "Activity Logs",
  settings: "Settings",
};

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type NavSection =
  | "dashboard"
  | "products"
  | "product-edit"
  | "categories"
  | "coupons"
  | "orders"
  | "customers"
  | "feedbacks"
  | "tickets"
  | "transcripts"
  | "abandoned-checkouts"
  | "wallet"
  | "storefront-configure"
  | "activity-logs"
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

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
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

function IconStorefront({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconTag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}




function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconCart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}





function IconFileTextInline({ className }: { className?: string }) {
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

function IconActivity({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconCrypto({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.5 8h3.5a2 2 0 0 1 0 4H9.5zM9.5 12h4a2 2 0 0 1 0 4H9.5zM9.5 8v8M11 6v2M11 16v2M13 6v2M13 16v2" />
    </svg>
  );
}

/* ================================================================== */
/*  SVG Charts                                                         */
/* ================================================================== */

function BarChart({
  data,
  labels,
  color = "#6366f1",
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
                rx="6"
                fill={color}
                opacity="0.9"
              />
              <text
                x={x + (barWidth * 10) / 2}
                y={height + 16}
                textAnchor="middle"
                fill="#71717a"
                fontSize="9"
              >
                {labels[i] ?? ""}
              </text>
              {val > 0 && (
                <text
                  x={x + (barWidth * 10) / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fill="#fafafa"
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
  color = "#6366f1",
  height = 40,
  width = 120,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  const clean = data.map((v) => (typeof v === "number" && Number.isFinite(v) ? v : 0));
  if (clean.length < 2) return null;
  const max = Math.max(...clean, 1);
  const min = Math.min(...clean, 0);
  const range = max - min || 1;
  const points = clean
    .map((val, i) => {
      const x = (i / (clean.length - 1)) * width;
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
/*  Auth Gate                                                          */
/* ================================================================== */

const DASH_PASSWORD = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD ?? "";

export default function SecretDashboardPage() {
  const { user, loading } = useAuth();
  const [pwUnlocked, setPwUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);

  const isAdmin = user?.role === "admin";
  const hasAccess = isAdmin || pwUnlocked;

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (DASH_PASSWORD && pwInput === DASH_PASSWORD) {
      setPwUnlocked(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#09090b" }}>
        <div className="flex flex-col items-center gap-4">
          <svg className="h-10 w-10 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
            <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-zinc-500">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: "#09090b" }}>
        <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-white/5 p-8 text-center" style={{ backgroundColor: "#121214" }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 ring-2 ring-indigo-500/20">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-zinc-500">
            Log in with Discord (admin role) or enter the dashboard password.
          </p>

          {/* Discord login option */}
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#4752C4]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M20.3 4.5A18.5 18.5 0 0015.7 3l-.3.6a14 14 0 014.2 1.6 13.6 13.6 0 00-12.2 0A14 14 0 017.6 3.6L7.3 3a18.5 18.5 0 00-4.6 1.5C1 8 .5 11.4.7 14.8a13.8 13.8 0 004.1 2.1l.8-1.3a8.7 8.7 0 01-1.5-.7l.4-.3a11.7 11.7 0 009 0l.4.3a8.7 8.7 0 01-1.5.7l.8 1.3a13.8 13.8 0 004.1-2.1c.3-3.9-.6-7.3-1.9-10.3zM8.7 12.7c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.8 0 1.5.7 1.5 1.6 0 .9-.7 1.6-1.5 1.6zm6.6 0c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.9 0 1.5.7 1.5 1.6 0 .9-.6 1.6-1.5 1.6z" />
            </svg>
            Login with Discord
          </Link>

          {/* Divider */}
          <div className="flex w-full items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-zinc-600">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Password form */}
          <form onSubmit={handlePasswordSubmit} className="flex w-full flex-col gap-3">
            <input
              type="password"
              value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
              placeholder="Dashboard password"
              className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-indigo-500 ${
                pwError ? "border-rose-500" : "border-white/10"
              }`}
            />
            {pwError && (
              <p className="text-xs text-rose-400">Wrong password. Try again.</p>
            )}
            <button
              type="submit"
              className="rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-600"
            >
              Enter Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  return <AdminPanel />;
}

/* ================================================================== */
/*  Main Admin Panel                                                   */
/* ================================================================== */

function AdminPanel() {
  const { user: authUser } = useAuth();
  /* -- state -- */
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

  const apiConfigured = Boolean(process.env.NEXT_PUBLIC_ASTRO_API_URL);
  const tokenConfigured = Boolean(process.env.NEXT_PUBLIC_ADMIN_TOKEN);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  }, []);

  /* -- data fetching -- */
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
    function startPolling() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (autoRefresh && !document.hidden) {
        intervalRef.current = setInterval(refresh, AUTO_REFRESH_MS);
      }
    }
    function onVisibility() {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else {
        startPolling();
      }
    }
    startPolling();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [autoRefresh, refresh]);

  /* -- computed (memoized) -- */
  const filteredProducts = useMemo(
    () =>
      productSearch.trim()
        ? products.filter(
            (p) =>
              p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
              p.id.toString().includes(productSearch)
          )
        : products,
    [products, productSearch]
  );

  const orderFeed = useMemo(() => feed.filter((f) => f.type === "order"), [feed]);
  const revenueTotal = useMemo(
    () => stats?.totalVolumeEur ?? orderFeed.reduce((s, f) => s + (f.amount ?? 0), 0),
    [stats, orderFeed]
  );
  const orderCount = stats?.totalOrders ?? orderFeed.length;
  const customerCount = stats?.totalCustomers ?? 0;
  const avgOrderValue = orderCount > 0 ? revenueTotal / orderCount : 0;

  /* -- daily aggregations for charts (memoized) -- */
  const { dayLabels, dailyRevenue, dailyOrders } = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const labels = days.map((d) =>
      d.toLocaleDateString("en", { weekday: "short" })
    );
    const revenue = days.map((day) => {
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
    const orders = days.map((day) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      return orderFeed.filter((f) => {
        const ts = f.ts > 1e12 ? f.ts : f.ts * 1000;
        return ts >= dayStart.getTime() && ts <= dayEnd.getTime();
      }).length;
    });
    return { dayLabels: labels, dailyRevenue: revenue, dailyOrders: orders };
  }, [orderFeed]);

  /* -- product actions -- */
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
      showToast(!tokenConfigured ? "ADMIN_TOKEN non configurato su Vercel — fai Redeploy" : "Errore eliminazione prodotto — controlla console (F12)", false);
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
        showToast(!tokenConfigured ? "ADMIN_TOKEN non configurato — fai Redeploy su Vercel" : "Errore aggiornamento prodotto — controlla console (F12)", false);
      }
    } else {
      const created = await createProduct(data as Omit<ApiProduct, "id">);
      if (created) {
        setProducts((prev) => [...prev, created]);
        showToast(`"${created.name}" creato`, true);
      } else {
        showToast(!tokenConfigured ? "ADMIN_TOKEN non configurato — fai Redeploy su Vercel" : "Errore creazione prodotto — controlla console (F12)", false);
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

  /* -- best selling products -- */
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

  /* -- top spenders -- */
  const spenderMap = new Map<string, number>();
  orderFeed.forEach((f) => {
    const method = f.method ?? "Unknown";
    spenderMap.set(method, (spenderMap.get(method) ?? 0) + (f.amount ?? 0));
  });
  const topSpenders = [...spenderMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  /* -- render -- */
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#09090b" }}>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-[100] animate-[fadeIn_0.2s] rounded-xl border px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur-sm ${
            toast.ok
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/20 bg-rose-500/10 text-rose-400"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* -- Sidebar -- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-white/5 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "#0f0f12" }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15">
            <span className="text-sm font-bold text-indigo-400">HM</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">Heaven Market</span>
            <span className="text-[10px] text-zinc-500">Admin Panel</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden"
          >
            <IconX className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarItem
            icon={<IconDashboard className="h-4 w-4" />}
            label="Dashboard"
            active={activeNav === "dashboard"}
            onClick={() => navigateTo("dashboard")}
          />

          <SidebarGroup label="Catalog">
            <SidebarItem
              icon={<IconProducts className="h-4 w-4" />}
              label="Products"
              active={activeNav === "products" || activeNav === "product-edit"}
              onClick={() => navigateTo("products")}
              indent
            />
            <SidebarItem
              icon={<IconGrid className="h-4 w-4" />}
              label="Categories"
              active={activeNav === "categories"}
              onClick={() => navigateTo("categories")}
              indent
            />
            <SidebarItem
              icon={<IconTag className="h-4 w-4" />}
              label="Coupons"
              active={activeNav === "coupons"}
              onClick={() => navigateTo("coupons")}
              indent
            />
          </SidebarGroup>

          <SidebarGroup label="Orders">
            <SidebarItem
              icon={<IconOrders className="h-4 w-4" />}
              label="Invoices"
              active={activeNav === "orders"}
              onClick={() => navigateTo("orders")}
              indent
            />
            <SidebarItem
              icon={<IconCustomers className="h-4 w-4" />}
              label="Customers"
              active={activeNav === "customers"}
              onClick={() => navigateTo("customers")}
              indent
            />
            <SidebarItem
              icon={<IconStar className="h-4 w-4" />}
              label="Feedbacks"
              active={activeNav === "feedbacks"}
              onClick={() => navigateTo("feedbacks")}
              indent
            />
            <SidebarItem
              icon={<IconTickets className="h-4 w-4" />}
              label="Tickets"
              active={activeNav === "tickets"}
              onClick={() => navigateTo("tickets")}
              indent
            />
            <SidebarItem
              icon={<IconFileTextInline className="h-4 w-4" />}
              label="Transcripts"
              active={activeNav === "transcripts"}
              onClick={() => navigateTo("transcripts")}
              indent
            />
            <SidebarItem
              icon={<IconCart className="h-4 w-4" />}
              label="Abandoned Checkouts"
              active={activeNav === "abandoned-checkouts"}
              onClick={() => navigateTo("abandoned-checkouts")}
              indent
            />
          </SidebarGroup>

          <SidebarGroup label="Wallets">
            <SidebarItem
              icon={<IconCrypto className="h-4 w-4" />}
              label="Crypto"
              active={activeNav === "wallet"}
              onClick={() => navigateTo("wallet")}
              indent
            />
          </SidebarGroup>

          <SidebarGroup label="Storefront">
            <SidebarItem
              icon={<IconStorefront className="h-4 w-4" />}
              label="Configure"
              active={activeNav === "storefront-configure"}
              onClick={() => navigateTo("storefront-configure")}
              indent
            />
            <SidebarItem
              icon={<IconActivity className="h-4 w-4" />}
              label="Activity Logs"
              active={activeNav === "activity-logs"}
              onClick={() => navigateTo("activity-logs")}
              indent
            />
          </SidebarGroup>

          <div className="mt-4">
            <SidebarItem
              icon={<IconSettings className="h-4 w-4" />}
              label="Settings"
              active={activeNav === "settings"}
              onClick={() => navigateTo("settings")}
            />
          </div>
        </nav>

        {/* Bottom user profile + bot status */}
        <div className="border-t border-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-bold text-indigo-400">
              {authUser?.username?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {authUser?.username ?? "Admin"}
              </p>
              <p className="truncate text-[11px] text-zinc-500">
                {authUser?.email ?? ""}
              </p>
            </div>
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                botOnline === null
                  ? "bg-zinc-600"
                  : botOnline
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-rose-400"
              }`}
              title={botOnline === null ? "Checking..." : botOnline ? "Bot Online" : "Bot Offline"}
            />
          </div>
        </div>
      </aside>

      {/* -- Main Content -- */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/5 px-4 lg:px-6" style={{ backgroundColor: "#09090b" }}>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <IconMenu className="h-5 w-5 text-zinc-400" />
          </button>

          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-white">
              {activeNav === "product-edit"
                ? editingProduct
                  ? `Edit: ${editingProduct.name}`
                  : "New Product"
                : NAV_TITLES[activeNav] ?? activeNav}
            </h2>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {lastUpdated ? (
              <span className="hidden text-xs text-zinc-500 sm:inline">
                {formatRelativeTime(Math.floor(lastUpdated / 1000))}
              </span>
            ) : null}
            <label className="hidden items-center gap-1.5 text-xs text-zinc-500 sm:flex cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="accent-indigo-500"
              />
              Auto
            </label>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-all hover:border-indigo-500/50 hover:text-indigo-400 disabled:opacity-50"
            >
              {loading ? "..." : "Refresh"}
            </button>
            {/* Bot badge */}
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold sm:flex ${
                botOnline === null
                  ? "border-white/10 text-zinc-500"
                  : botOnline
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                    : "border-rose-500/20 bg-rose-500/5 text-rose-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  botOnline === null
                    ? "bg-zinc-600"
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-6" style={{ backgroundColor: "#09090b" }}>
          {(!apiConfigured || !tokenConfigured) && (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <h4 className="text-sm font-bold text-amber-400">Configuration Warning</h4>
              <div className="mt-1 space-y-1 text-xs text-amber-400/80">
                {!apiConfigured && <p>• NEXT_PUBLIC_ASTRO_API_URL is not set — API calls will fail.</p>}
                {!tokenConfigured && <p>• NEXT_PUBLIC_ADMIN_TOKEN is not set — admin actions (create/edit/delete products) will fail.</p>}
                <p className="text-zinc-500">Add the missing variables on Vercel, then <strong>Redeploy</strong> (env vars are baked at build time).</p>
              </div>
            </div>
          )}
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
              key={editingProduct?.id ?? "new"}
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
          {activeNav === "transcripts" && (
            <TranscriptsView />
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
          {activeNav === "categories" && <CategoriesView products={products} />}
          {activeNav === "coupons" && <CouponsView />}
          {activeNav === "feedbacks" && <FeedbacksView feed={feed} />}
          {activeNav === "abandoned-checkouts" && <AbandonedCheckoutsView />}
          {activeNav === "storefront-configure" && (
            <StorefrontConfigureView showToast={showToast} />
          )}
          {activeNav === "activity-logs" && <ActivityLogsView feed={feed} />}
        </main>
      </div>

      {/* -- Modals -- */}
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

function SidebarGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-400 transition-colors"
      >
        {label}
        <IconChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
  indent,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  indent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all ${
        indent ? "ml-2" : ""
      } ${
        active
          ? "bg-indigo-500/10 font-semibold text-indigo-400"
          : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"
      }`}
    >
      <span className={active ? "text-indigo-400" : "text-zinc-500"}>{icon}</span>
      {label}
      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
      )}
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
        <div className="flex items-center gap-4 rounded-xl border border-white/5 px-5 py-3" style={{ backgroundColor: "#121214" }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <span className="text-xs font-bold text-amber-400">LTC</span>
          </div>
          <span className="text-lg font-bold text-white">{formatEur(ltc.eur)}</span>
          <span className="text-sm text-zinc-500">/ ${ltc.usd.toFixed(2)}</span>
          <span
            className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
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
          label="Orders"
          value={orderCount.toString()}
          change="+8.2%"
          positive
          sparkData={dailyOrders}
        />
        <StatCard
          label="Customers"
          value={customerCount.toString()}
          change="+3.1%"
          positive
        />
        <StatCard
          label="Avg Order"
          value={formatCurrency(avgOrderValue, "EUR")}
          change=""
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue chart */}
        <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Revenue (7 days)</h3>
            <span className="text-xs text-zinc-500">Last 7 days</span>
          </div>
          <BarChart
            data={dailyRevenue}
            labels={dayLabels}
            color="#6366f1"
            height={160}
          />
        </div>

        {/* Orders chart */}
        <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Orders (7 days)</h3>
            <span className="text-xs text-zinc-500">Last 7 days</span>
          </div>
          <BarChart
            data={dailyOrders}
            labels={dayLabels}
            color="#22c55e"
            height={160}
          />
        </div>
      </div>

      {/* Recent orders feed */}
      <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
          <span className="text-xs text-zinc-500">{orderFeed.length} total</span>
        </div>
        {orderFeed.length === 0 ? (
          <p className="text-sm text-zinc-500">No recent orders.</p>
        ) : (
          <div className="space-y-0">
            {orderFeed.slice(0, 10).map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-white/5 py-3 last:border-0"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                  <IconProducts className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-zinc-500">{formatRelativeTime(item.ts)}</p>
                </div>
                {item.method && (
                  <span className="hidden rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400 sm:inline-block">
                    {item.method}
                  </span>
                )}
                {item.amount !== undefined && (
                  <span className="shrink-0 text-sm font-semibold text-emerald-400">
                    {formatCurrency(item.amount, "EUR")}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom insights grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Best selling */}
        <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
          <h3 className="mb-4 text-sm font-semibold text-white">Best Selling</h3>
          {bestSelling.length === 0 ? (
            <p className="text-xs text-zinc-500">No data available.</p>
          ) : (
            <ul className="space-y-3">
              {bestSelling.map(([name, count], i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-400">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">{name}</span>
                  <span className="shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-400">
                    {count} sold
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top Spenders (Payment Methods) */}
        <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
          <h3 className="mb-4 text-sm font-semibold text-white">Top Spenders</h3>
          {topSpenders.length === 0 ? (
            <p className="text-xs text-zinc-500">No data available.</p>
          ) : (
            <ul className="space-y-3">
              {topSpenders.map(([method, total], i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">{method}</span>
                  <span className="shrink-0 text-sm font-semibold text-white">
                    {formatCurrency(total, "EUR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Most Used Methods */}
        <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
          <h3 className="mb-4 text-sm font-semibold text-white">Most Used Methods</h3>
          {topSpenders.length === 0 ? (
            <p className="text-xs text-zinc-500">No data available.</p>
          ) : (
            <ul className="space-y-3">
              {topSpenders.map(([method, total], i) => {
                const totalAll = topSpenders.reduce((s, [, v]) => s + v, 0);
                const pct = totalAll > 0 ? ((total / totalAll) * 100).toFixed(1) : "0";
                return (
                  <li key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-300">{method}</span>
                      <span className="text-xs font-medium text-zinc-500">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
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
    <div className="rounded-xl border border-white/5 p-4" style={{ backgroundColor: "#121214" }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
          {change && (
            <div className="mt-1.5 flex items-center gap-1">
              {positive && <IconTrendUp className="h-3 w-3 text-emerald-400" />}
              <span
                className={`text-xs font-semibold ${
                  positive ? "text-emerald-400" : "text-zinc-500"
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
            color={positive ? "#22c55e" : "#6366f1"}
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white">Products</h3>
          <p className="mt-0.5 text-sm text-zinc-500">
            Manage your product catalog ({products.length} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products..."
              className="w-56 rounded-lg border border-white/10 py-2 pl-9 pr-3 text-xs text-white outline-none transition-all focus:border-indigo-500/50 placeholder:text-zinc-600"
              style={{ backgroundColor: "#161619" }}
            />
          </div>
          <button
            type="button"
            onClick={onNew}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-600"
          >
            + Create Product
          </button>
        </div>
      </div>

      {/* Product grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-white/5 py-16" style={{ backgroundColor: "#121214" }}>
            <IconProducts className="h-10 w-10 text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-500">No products found.</p>
          </div>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-white/5 transition-all hover:border-white/10 cursor-pointer"
              style={{ backgroundColor: "#121214" }}
              onClick={() => onEdit(p)}
            >
              {/* Banner / Image */}
              <div className="relative h-28 w-full overflow-hidden">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/10">
                    <IconProducts className="h-8 w-8 text-indigo-400/40" />
                  </div>
                )}
                {/* Stock badge */}
                <span
                  className={`absolute right-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
                    p.stock > 0
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                  }`}
                >
                  {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                </span>
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col p-4">
                <h4 className="text-sm font-semibold text-white truncate">{p.name}</h4>
                <p className="mt-1 truncate text-xs text-zinc-500">{p.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-bold text-indigo-400">
                    {formatCurrency(p.price, p.currency)}
                  </span>
                  {ltc && (
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {(p.price / ltc.eur).toFixed(4)} LTC
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-white/5 px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onStockChange(p, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded border border-white/10 text-xs font-bold text-rose-400 transition-all hover:border-rose-400/30 hover:bg-rose-500/10"
                  >
                    -
                  </button>
                  <span className="min-w-[2rem] text-center text-xs font-semibold text-zinc-300">
                    {p.stock}
                  </span>
                  <button
                    type="button"
                    onClick={() => onStockChange(p, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded border border-white/10 text-xs font-bold text-emerald-400 transition-all hover:border-emerald-400/30 hover:bg-emerald-500/10"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="text-xs text-zinc-500 transition-colors hover:text-indigo-400"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(p)}
                    className="text-xs text-zinc-500 transition-colors hover:text-rose-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Product Edit View                                                  */
/* ================================================================== */

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ProductEditView({
  product,
  onSave,
  onCancel,
  onDelete,
}: {
  product: ApiProduct | null;
  onSave: (data: Partial<ApiProduct> & { id?: string }) => Promise<void> | void;
  onCancel: () => void;
  onDelete: (product: ApiProduct) => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [urlPath, setUrlPath] = useState(product?.url ?? "");
  const [urlManuallyEdited, setUrlManuallyEdited] = useState(!!product?.url);
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [images, setImages] = useState<string[]>(
    product?.images?.length ? product.images : product?.image ? [product.image] : [],
  );
  const [instructions, setInstructions] = useState(product?.instructions ?? "");
  const [deliverableType, setDeliverableType] = useState<
    "serials" | "service" | "dynamic" | "files" | "smm-panels"
  >((product?.deliverableType as "serials" | "service" | "dynamic" | "files" | "smm-panels") ?? "serials");
  const [smmServiceId, setSmmServiceId] = useState(product?.smmServiceId?.toString() ?? "");
  const [smmMinQty, setSmmMinQty] = useState(product?.smmMinQty?.toString() ?? "");
  const [smmMaxQty, setSmmMaxQty] = useState(product?.smmMaxQty?.toString() ?? "");
  const [variants, setVariants] = useState<
    { id: string; title: string; price: string; stock: number; stockItems: string }[]
  >(
    product?.variants?.length
      ? product.variants.map((v) => ({
          id: v.id,
          title: v.title,
          price: v.price?.toString() ?? "",
          stock: v.stock ?? 0,
          stockItems: v.stockItems ?? "",
        }))
      : [
          {
            id: Math.random().toString(36).slice(2),
            title: "Default",
            price: product?.price?.toString() ?? "",
            stock: product?.stock ?? 0,
            stockItems: "",
          },
        ],
  );
  const [stockModes, setStockModes] = useState<Record<string, "add" | "edit">>({});
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleNameChange(val: string) {
    setName(val);
    if (!urlManuallyEdited) {
      setUrlPath(slugify(val));
    }
  }

  function handleUrlChange(val: string) {
    setUrlManuallyEdited(true);
    setUrlPath(val);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const remaining = 5 - images.length;
    const toProcess = Array.from(files).slice(0, remaining);
    for (const file of toProcess) {
      if (file.size > 2 * 1024 * 1024) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImages((prev) => (prev.length < 5 ? [...prev, result] : prev));
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateVariant(id: string, field: string, value: string | number) {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        title: "",
        price: "",
        stock: 0,
        stockItems: "",
      },
    ]);
  }

  function removeVariant(id: string) {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((v) => v.id !== id));
  }

  function getStockMode(id: string): "add" | "edit" {
    return stockModes[id] ?? "add";
  }

  function toggleStockMode(id: string) {
    setStockModes((prev) => ({
      ...prev,
      [id]: prev[id] === "edit" ? "add" : "edit",
    }));
  }

  async function handleSave() {
    if (!name.trim()) return;
    const hasPrice = variants.some((v) => v.price.trim());
    if (!hasPrice) return;
    setSaving(true);
    try {
      const prices = variants.map((v) => parseFloat(v.price) || 0);
      const cheapest = Math.min(...prices);
      const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
      const builtVariants = variants.map((v) => ({
        id: v.id,
        title: v.title,
        price: parseFloat(v.price) || 0,
        stock: v.stock,
        stockItems: v.stockItems || undefined,
      }));
      await onSave({
        ...(product ? { id: product.id } : {}),
        name: name.trim(),
        price: cheapest,
        currency: "EUR",
        description,
        image: images[0] || undefined,
        images: images.length > 0 ? images : undefined,
        url: urlPath || undefined,
        stock: totalStock,
        category: category.trim() || undefined,
        instructions: instructions || undefined,
        deliverableType: deliverableType || undefined,
        variants: builtVariants,
        ...(deliverableType === "smm-panels" ? {
          smmServiceId: smmServiceId ? parseInt(smmServiceId, 10) : undefined,
          smmMinQty: smmMinQty ? parseInt(smmMinQty, 10) : undefined,
          smmMaxQty: smmMaxQty ? parseInt(smmMaxQty, 10) : undefined,
        } : {}),
      });
    } finally {
      setSaving(false);
    }
  }

  const deliverableOptions: {
    value: typeof deliverableType;
    label: string;
    desc: string;
  }[] = [
    { value: "serials", label: "Serials", desc: "Unique codes delivered one per order" },
    { value: "service", label: "Service", desc: "Manual fulfillment by seller" },
    { value: "dynamic", label: "Dynamic", desc: "Generated via webhook or API" },
    { value: "files", label: "Files", desc: "Downloadable file delivery" },
    { value: "smm-panels", label: "SMM Panels", desc: "Social media marketing services" },
  ];

  const inputCls =
    "w-full rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white outline-none transition-all focus:border-indigo-500/50";

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-white"
        >
          <IconChevronLeft className="h-4 w-4" />
          Cancel
        </button>
        <div className="flex items-center gap-2">
          {product && (
            <button
              type="button"
              onClick={() => onDelete(product)}
              className="rounded-lg border border-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500/10"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="rounded-lg border border-indigo-500/30 px-4 py-2 text-xs font-semibold text-indigo-400 transition-all hover:bg-indigo-500/10 disabled:opacity-50"
          >
            Save &amp; Exit
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="rounded-lg bg-indigo-500 px-5 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Section: General */}
      <div
        className="rounded-xl border border-white/5 p-6"
        style={{ backgroundColor: "#121214" }}
      >
        <h3 className="mb-5 text-sm font-semibold text-white">General</h3>
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputCls}
                style={{ backgroundColor: "#161619" }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">URL Path</label>
              <input
                type="text"
                value={urlPath}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="auto-generated-from-name"
                className={`${inputCls} placeholder:text-zinc-600`}
                style={{ backgroundColor: "#161619" }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400">Description</label>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Describe your product..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Digital, Account, etc."
              className={`${inputCls} placeholder:text-zinc-600`}
              style={{ backgroundColor: "#161619" }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400">
              Images{" "}
              <span className="font-normal text-zinc-600">
                ({images.length}/5, max 2MB each)
              </span>
            </label>
            <div className="flex flex-wrap gap-3">
              {images.map((src, idx) => (
                <div key={idx} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Product ${idx + 1}`}
                    className="h-24 w-24 rounded-lg border border-white/10 object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-indigo-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    X
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 text-zinc-500 transition-colors hover:border-indigo-500/30 hover:text-indigo-400"
                >
                  <span className="text-2xl leading-none">+</span>
                  <span className="mt-1 text-[10px]">Upload</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400">Instructions</label>
            <RichTextEditor
              content={instructions}
              onChange={setInstructions}
              placeholder="Post-purchase instructions for the buyer..."
            />
          </div>
        </div>
      </div>

      {/* Section: Deliverable Type */}
      <div
        className="rounded-xl border border-white/5 p-6"
        style={{ backgroundColor: "#121214" }}
      >
        <h3 className="mb-5 text-sm font-semibold text-white">Deliverable Type</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {deliverableOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDeliverableType(opt.value)}
              className={`rounded-lg border p-4 text-left transition-all ${
                deliverableType === opt.value
                  ? "border-indigo-500 bg-indigo-500/5"
                  : "border-white/10 hover:border-white/20"
              }`}
              style={{ backgroundColor: deliverableType === opt.value ? undefined : "#161619" }}
            >
              <p
                className={`text-sm font-semibold ${
                  deliverableType === opt.value ? "text-indigo-400" : "text-white"
                }`}
              >
                {opt.label}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{opt.desc}</p>
            </button>
          ))}
        </div>

        {deliverableType === "smm-panels" && (
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Service ID</label>
              <input
                type="number"
                value={smmServiceId}
                onChange={(e) => setSmmServiceId(e.target.value)}
                className={inputCls}
                style={{ backgroundColor: "#161619" }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Min Quantity</label>
              <input
                type="number"
                value={smmMinQty}
                onChange={(e) => setSmmMinQty(e.target.value)}
                className={inputCls}
                style={{ backgroundColor: "#161619" }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Max Quantity</label>
              <input
                type="number"
                value={smmMaxQty}
                onChange={(e) => setSmmMaxQty(e.target.value)}
                className={inputCls}
                style={{ backgroundColor: "#161619" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Section: Pricing & Stock */}
      <div
        className="rounded-xl border border-white/5 p-6"
        style={{ backgroundColor: "#121214" }}
      >
        <h3 className="mb-5 text-sm font-semibold text-white">Pricing &amp; Stock</h3>
        <div className="space-y-4">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="rounded-lg border border-white/5 p-4"
              style={{ backgroundColor: "#161619" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid flex-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-400">Variant Title</label>
                    <input
                      type="text"
                      value={variant.title}
                      onChange={(e) => updateVariant(variant.id, "title", e.target.value)}
                      placeholder="e.g. Standard, Premium"
                      className={`${inputCls} placeholder:text-zinc-600`}
                      style={{ backgroundColor: "#1e1e22" }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-400">Price (EUR)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={variant.price}
                      onChange={(e) => updateVariant(variant.id, "price", e.target.value)}
                      className={inputCls}
                      style={{ backgroundColor: "#1e1e22" }}
                    />
                  </div>
                </div>
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(variant.id)}
                    className="mt-6 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 text-rose-400 transition-all hover:bg-rose-500/10"
                    title="Remove variant"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="mt-4">
                {deliverableType === "serials" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-400">
                        Stock Items{" "}
                        <span className="font-normal text-zinc-600">
                          (
                          {variant.stockItems.trim()
                            ? variant.stockItems.trim().split("\n").filter((l) => l.trim()).length
                            : 0}{" "}
                          items)
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => toggleStockMode(variant.id)}
                        className="text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                      >
                        {getStockMode(variant.id) === "add" ? "Edit Stock" : "Add to Stock"}
                      </button>
                    </div>
                    <textarea
                      value={variant.stockItems}
                      onChange={(e) => {
                        updateVariant(variant.id, "stockItems", e.target.value);
                        if (getStockMode(variant.id) === "edit") {
                          const lines = e.target.value.trim().split("\n").filter((l) => l.trim());
                          updateVariant(variant.id, "stock", lines.length);
                        }
                      }}
                      rows={4}
                      placeholder={"SERIAL-001\nSERIAL-002\nSERIAL-003"}
                      className="w-full rounded-lg border border-white/10 px-3 py-2.5 font-mono text-xs text-white outline-none transition-all focus:border-indigo-500/50 resize-none placeholder:text-zinc-700"
                      style={{ backgroundColor: "#1e1e22" }}
                    />
                    {getStockMode(variant.id) === "add" && (
                      <button
                        type="button"
                        onClick={() => {
                          const lines = variant.stockItems
                            .trim()
                            .split("\n")
                            .filter((l) => l.trim());
                          updateVariant(variant.id, "stock", variant.stock + lines.length);
                        }}
                        disabled={!variant.stockItems.trim()}
                        className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        Add to Stock ({variant.stock} current)
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-400">Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(e) =>
                        updateVariant(variant.id, "stock", Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-32 rounded-lg border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
                      style={{ backgroundColor: "#1e1e22" }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addVariant}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 py-3 text-xs font-semibold text-zinc-500 transition-all hover:border-indigo-500/30 hover:text-indigo-400"
          >
            <span className="text-base leading-none">+</span> Create a New Variant
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Shared UI helpers                                                  */
/* ================================================================== */

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-indigo-500" : "bg-zinc-700"
      }`}
    >
      <span
        className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function ViewHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyState({
  icon,
  message,
  hint,
}: {
  icon: React.ReactNode;
  message: string;
  hint?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-white/5 py-16 text-center"
      style={{ backgroundColor: "#121214" }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] text-zinc-600">
        {icon}
      </div>
      <p className="mt-4 text-sm font-medium text-zinc-400">{message}</p>
      {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

function PrimaryButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-600"
    >
      {label}
    </button>
  );
}

/* ================================================================== */
/*  Catalog: Categories / Coupons / Addons / Quantity / Bundles       */
/* ================================================================== */

function CategoriesView({ products }: { products: ApiProduct[] }) {
  const categories: { name: string; count: number; color: string }[] = [];
  return (
    <div className="space-y-5">
      <ViewHeader
        title="Categories"
        subtitle={`Organize your products into categories (${categories.length} total)`}
        action={<PrimaryButton label="+ New Category" />}
      />
      {categories.length === 0 ? (
        <EmptyState
          icon={<IconGrid className="h-6 w-6" />}
          message="No categories yet."
          hint={`Group your ${products.length} product(s) into categories to make them easier to browse.`}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((c) => (
            <div
              key={c.name}
              className="rounded-xl border border-white/5 p-5"
              style={{ backgroundColor: "#121214" }}
            >
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-lg" style={{ backgroundColor: c.color }} />
                <div>
                  <h4 className="text-sm font-semibold text-white">{c.name}</h4>
                  <p className="text-xs text-zinc-500">{c.count} products</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Coupon = {
  code: string;
  discount: number;
  uses: number;
  limit: number;
  expiry: string;
  expired: boolean;
};

function CouponsView() {
  const coupons: Coupon[] = [];
  return (
    <div className="space-y-5">
      <ViewHeader
        title="Coupons"
        subtitle={`Create discount codes for your customers (${coupons.length} total)`}
        action={<PrimaryButton label="+ New Coupon" />}
      />
      {coupons.length === 0 ? (
        <EmptyState
          icon={<IconTag className="h-6 w-6" />}
          message="No coupons created."
          hint="Create your first discount code to run a promotion."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5" style={{ backgroundColor: "#121214" }}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Code", "Discount", "Uses", "Expiry", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.code} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono font-medium text-white">{c.code}</td>
                  <td className="px-4 py-3 text-zinc-300">{c.discount}%</td>
                  <td className="px-4 py-3 text-zinc-300">{c.uses}/{c.limit}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{c.expiry}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        c.expired
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {c.expired ? "Expired" : "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FeedbacksView({ feed }: { feed: FeedItem[] }) {
  const orderCount = feed.filter((f) => f.type === "order").length;
  // Resolve "now" once on mount to keep render pure.
  const [now, setNow] = useState(0);
  useEffect(() => {
    Promise.resolve().then(() => setNow(Math.floor(Date.now() / 1000)));
  }, []);
  const sampleFeedbacks = [
    { name: "Marco R.", rating: 5, comment: "Fast delivery and exactly as described. Will buy again!", ts: now - 3600 },
    { name: "Luca B.", rating: 5, comment: "Great service, the bot delivered instantly. Highly recommended.", ts: now - 86400 },
    { name: "Sara T.", rating: 4, comment: "Good product, took a little while but support was helpful.", ts: now - 172800 },
    { name: "Alex M.", rating: 5, comment: "Smooth transaction, escrow worked perfectly.", ts: now - 259200 },
  ];
  const avg = (sampleFeedbacks.reduce((s, f) => s + f.rating, 0) / sampleFeedbacks.length).toFixed(1);

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Feedbacks"
        subtitle={`Customer reviews and ratings (${sampleFeedbacks.length} reviews · ${orderCount} orders)`}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Average Rating</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-bold text-white">{avg}</span>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <IconStar
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(Number(avg)) ? "text-amber-400" : "text-zinc-700"}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total Reviews</p>
          <p className="mt-2 text-3xl font-bold text-white">{sampleFeedbacks.length}</p>
        </div>
        <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">5-Star Reviews</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">
            {sampleFeedbacks.filter((f) => f.rating === 5).length}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {sampleFeedbacks.map((f, i) => (
          <div key={i} className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-sm font-bold text-indigo-400">
                  {f.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{f.name}</p>
                  <div className="mt-0.5 flex">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <IconStar key={j} className={`h-3.5 w-3.5 ${j < f.rating ? "text-amber-400" : "text-zinc-700"}`} />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-xs text-zinc-500">{formatRelativeTime(f.ts)}</span>
            </div>
            <p className="mt-3 text-sm text-zinc-300">{f.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AbandonedCheckoutsView() {
  const checkouts: {
    email: string;
    product: string;
    amount: number;
    date: string;
    status: string;
  }[] = [];
  return (
    <div className="space-y-5">
      <ViewHeader
        title="Abandoned Checkouts"
        subtitle={`Carts that were started but never completed (${checkouts.length} total)`}
      />
      {checkouts.length === 0 ? (
        <EmptyState
          icon={<IconCart className="h-6 w-6" />}
          message="No abandoned checkouts."
          hint="Checkouts that customers start but don't pay for will appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5" style={{ backgroundColor: "#121214" }}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Email", "Product", "Amount", "Date", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {checkouts.map((c, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-zinc-300">{c.email}</td>
                  <td className="px-4 py-3 text-white">{c.product}</td>
                  <td className="px-4 py-3 font-semibold text-white">{formatCurrency(c.amount, "EUR")}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{c.date}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Storefront: Configure / Themes / Pages / Images / Files / Logs    */
/* ================================================================== */

type StorefrontConfig = {
  storeName: string;
  logoUrl: string;
  description: string;
  discordInvite: string;
  shopUrl: string;
  primaryColor: string;
  currency: string;
  bannerText: string;
  bannerEnabled: boolean;
};

const DEFAULT_STOREFRONT_CONFIG: StorefrontConfig = {
  storeName: "Heaven Market",
  logoUrl: "",
  description: "",
  discordInvite: "",
  shopUrl: "",
  primaryColor: "#6366f1",
  currency: "EUR",
  bannerText: "",
  bannerEnabled: false,
};

function StorefrontConfigureView({
  showToast,
}: {
  showToast: (msg: string, ok: boolean) => void;
}) {
  const [config, setConfig] = useState<StorefrontConfig>(DEFAULT_STOREFRONT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const raw = localStorage.getItem(STOREFRONT_CONFIG_KEY);
        if (raw) {
          setConfig({ ...DEFAULT_STOREFRONT_CONFIG, ...JSON.parse(raw) });
        }
      } catch {
        /* ignore */
      }
      setLoaded(true);
    });
  }, []);

  function update<K extends keyof StorefrontConfig>(key: K, value: StorefrontConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    try {
      localStorage.setItem(STOREFRONT_CONFIG_KEY, JSON.stringify(config));
      showToast("Storefront settings saved", true);
    } catch {
      showToast("Failed to save settings", false);
    }
  }

  const inputClass =
    "rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white outline-none transition-all focus:border-indigo-500/50";

  if (!loaded) {
    return <p className="text-sm text-zinc-500">Loading...</p>;
  }

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Configure Storefront"
        subtitle="Customize how your store looks and behaves"
        action={<PrimaryButton label="Save Changes" onClick={handleSave} />}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 p-6" style={{ backgroundColor: "#121214" }}>
          <h4 className="mb-5 text-sm font-semibold text-white">Branding</h4>
          <div className="space-y-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Store Name</label>
              <input
                type="text"
                value={config.storeName}
                onChange={(e) => update("storeName", e.target.value)}
                className={inputClass}
                style={{ backgroundColor: "#161619" }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Store Logo</label>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-400 transition-all hover:bg-indigo-500/20">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload from PC
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        showToast("Image too large (max 2MB)", false);
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === "string") {
                          update("logoUrl", reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                <span className="text-xs text-zinc-600">or paste URL below</span>
              </div>
              <input
                type="text"
                value={config.logoUrl.startsWith("data:") ? "" : config.logoUrl}
                onChange={(e) => update("logoUrl", e.target.value)}
                placeholder="https://... (or upload above)"
                className={`${inputClass} placeholder:text-zinc-600`}
                style={{ backgroundColor: "#161619" }}
              />
              {config.logoUrl.trim() && (
                <div className="mt-1 flex items-start gap-3 rounded-lg border border-white/5 p-3" style={{ backgroundColor: "#161619" }}>
                  <div>
                    <p className="mb-2 text-[11px] text-zinc-500">Logo Preview</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={config.logoUrl} alt="logo" className="h-14 w-auto max-w-[160px] rounded object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={() => update("logoUrl", "")}
                    className="ml-auto rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-rose-400 transition-colors"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Store Description</label>
              <textarea
                value={config.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
                style={{ backgroundColor: "#161619" }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => update("primaryColor", e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                />
                <input
                  type="text"
                  value={config.primaryColor}
                  onChange={(e) => update("primaryColor", e.target.value)}
                  className={`${inputClass} flex-1 font-mono`}
                  style={{ backgroundColor: "#161619" }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Currency</label>
              <select
                value={config.currency}
                onChange={(e) => update("currency", e.target.value)}
                className={inputClass}
                style={{ backgroundColor: "#161619" }}
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-white/5 p-6" style={{ backgroundColor: "#121214" }}>
            <h4 className="mb-5 text-sm font-semibold text-white">Links</h4>
            <div className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400">Discord Invite Link</label>
                <input
                  type="text"
                  value={config.discordInvite}
                  onChange={(e) => update("discordInvite", e.target.value)}
                  placeholder="https://discord.gg/..."
                  className={`${inputClass} placeholder:text-zinc-600`}
                  style={{ backgroundColor: "#161619" }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400">Shop URL</label>
                <input
                  type="text"
                  value={config.shopUrl}
                  onChange={(e) => update("shopUrl", e.target.value)}
                  placeholder="https://..."
                  className={`${inputClass} placeholder:text-zinc-600`}
                  style={{ backgroundColor: "#161619" }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 p-6" style={{ backgroundColor: "#121214" }}>
            <h4 className="mb-5 text-sm font-semibold text-white">Announcement Banner</h4>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Show banner</p>
                  <p className="text-xs text-zinc-500">Display an announcement at the top of the store</p>
                </div>
                <ToggleSwitch
                  checked={config.bannerEnabled}
                  onChange={(v) => update("bannerEnabled", v)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400">Banner Text</label>
                <input
                  type="text"
                  value={config.bannerText}
                  onChange={(e) => update("bannerText", e.target.value)}
                  placeholder="e.g. Summer sale — 20% off everything!"
                  className={`${inputClass} placeholder:text-zinc-600`}
                  style={{ backgroundColor: "#161619" }}
                />
              </div>
              {config.bannerEnabled && config.bannerText.trim() && (
                <div
                  className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  {config.bannerText}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function ActivityLogsView({ feed }: { feed: FeedItem[] }) {
  const logs = feed.slice(0, 50);
  return (
    <div className="space-y-5">
      <ViewHeader
        title="Activity Logs"
        subtitle={`Recent actions and events (${logs.length} shown)`}
      />
      {logs.length === 0 ? (
        <EmptyState
          icon={<IconActivity className="h-6 w-6" />}
          message="No activity yet."
          hint="Recent events from your store and bot will appear here."
        />
      ) : (
        <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
          <ol className="relative space-y-5 border-l border-white/10 pl-5">
            {logs.map((item, i) => (
              <li key={i} className="relative">
                <span
                  className={`absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-[#121214] ${
                    item.type === "order"
                      ? "bg-emerald-400"
                      : item.type === "escrow"
                        ? "bg-amber-400"
                        : item.type === "exchange"
                          ? "bg-cyan-400"
                          : "bg-indigo-400"
                  }`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-400">
                    {item.type}
                  </span>
                  <p className="text-sm text-zinc-300">{item.label}</p>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">{formatRelativeTime(item.ts)}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
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
  const orderItems = allFeed.filter(
    (f) => f.type === "order" || f.type === "escrow"
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-white">Invoices</h3>
        <p className="mt-0.5 text-sm text-zinc-500">
          View all orders and transactions ({orderItems.length} total)
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/5" style={{ backgroundColor: "#121214" }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">ID</th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Product</th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Price</th>
              <th className="hidden px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">Method</th>
              <th className="hidden px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">Email</th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Created</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-zinc-500"
                >
                  No orders found.
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
                    className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                      #{(1000 + i).toString().padStart(5, "0")}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {item.label}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {item.amount !== undefined
                        ? formatCurrency(item.amount, "EUR")
                        : "---"}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {item.method ? (
                        <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-400">
                          {item.method}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">N/A</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-zinc-500 md:table-cell">
                      ---
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
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
  const config =
    status === "paid"
      ? { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Paid" }
      : status === "pending"
        ? { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Pending" }
        : status === "confirming"
          ? { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400", label: "Confirming" }
          : { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-400", label: "Cancelled" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

/* ================================================================== */
/*  Customers View                                                     */
/* ================================================================== */

function CustomersView({ feed }: { feed: FeedItem[] }) {
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
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-white">Customers</h3>
        <p className="mt-0.5 text-sm text-zinc-500">
          Customer overview ({customers.length} total)
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/5" style={{ backgroundColor: "#121214" }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Customer</th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Orders</th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Spent</th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-sm text-zinc-500"
                >
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map(([name, data], i) => (
                <tr
                  key={i}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-400">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{data.orders}</td>
                  <td className="px-4 py-3 font-semibold text-white">
                    {formatCurrency(data.total, "EUR")}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
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
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-white">Tickets</h3>
        <p className="mt-0.5 text-sm text-zinc-500">Support ticket overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Open Tickets</p>
          <p
            className={`mt-3 text-3xl font-bold ${openTickets > 0 ? "text-amber-400" : "text-white"}`}
          >
            {openTickets}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Avg Response Time</p>
          <p className="mt-3 text-3xl font-bold text-white">---</p>
        </div>
        <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Satisfaction</p>
          <p className="mt-3 text-3xl font-bold text-white">---</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
        <p className="text-sm text-zinc-500">
          Tickets are managed through Discord. You can view aggregated statistics here.
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Transcripts View                                                   */
/* ================================================================== */

interface TranscriptMeta {
  id: string;
  ticketId: string;
  ticketName: string;
  category: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
}

function TranscriptsView() {
  const [transcripts, setTranscripts] = useState<TranscriptMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_ADMIN_TOKEN;
    if (!token) {
      setError(true);
      setLoading(false);
      return;
    }
    fetch("/api/transcripts", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setTranscripts(data.transcripts || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(transcripts.map((t) => t.category).filter(Boolean)))];

  const filtered = transcripts.filter((t) => {
    if (categoryFilter !== "All" && t.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.ticketName.toLowerCase().includes(q) ||
        t.ownerName.toLowerCase().includes(q) ||
        t.ticketId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Transcripts"
        subtitle={`Ticket transcript archive (${transcripts.length} total)`}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticket name, owner, or ID..."
            className="w-full rounded-lg border border-white/10 py-2.5 pl-9 pr-4 text-sm text-white outline-none transition-all focus:border-indigo-500/50"
            style={{ backgroundColor: "#161619" }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white outline-none"
          style={{ backgroundColor: "#161619" }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All Categories" : c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-zinc-500">Loading transcripts...</p>
      ) : error ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400">
          Failed to load transcripts. Make sure <code className="font-mono text-xs">BLOB_READ_WRITE_TOKEN</code> is set on Vercel.
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<IconFileTextInline className="h-6 w-6" />}
          message="No transcripts found."
          hint={transcripts.length > 0 ? "Try adjusting your search or filters." : "Transcripts will appear here when the bot saves ticket logs."}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5" style={{ backgroundColor: "#121214" }}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Ticket", "Category", "Owner", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">{t.ticketName}</span>
                    <span className="ml-2 font-mono text-[10px] text-zinc-600">{t.ticketId}</span>
                  </td>
                  <td className="px-4 py-3">
                    {t.category ? (
                      <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-400">
                        {t.category}
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{t.ownerName}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {new Date(t.createdAt).toLocaleDateString("it-IT", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/transcript/${t.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition-all hover:border-indigo-500/30 hover:text-indigo-400"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
      <div>
        <h3 className="text-xl font-bold text-white">Crypto Wallet</h3>
        <p className="mt-0.5 text-sm text-zinc-500">Manage your LTC wallet and transfers</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Balance card */}
        <div className="rounded-xl border-2 border-amber-500/20 p-6" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.05) 0%, #121214 100%)" }}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <IconWallet className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Available Balance</p>
          </div>
          <p className="mt-4 text-3xl font-bold text-amber-400">
            {wallet ? `${wallet.balance.toFixed(8)} LTC` : "---"}
          </p>
          {wallet && ltc && (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-lg text-zinc-400">
                ~ {formatCurrency(wallet.balance * ltc.eur, "EUR")}
              </span>
              <span className="text-sm text-zinc-600">
                / ${(wallet.balance * ltc.usd).toFixed(2)}
              </span>
            </div>
          )}
          {wallet && (
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("transfer-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-black transition-all hover:bg-amber-600"
            >
              Withdraw
            </button>
          )}
        </div>

        {/* Address card */}
        <div className="rounded-xl border border-white/5 p-6" style={{ backgroundColor: "#121214" }}>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Receiving Address</p>
          <div className="mt-4 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-white/5 px-3 py-2.5 font-mono text-xs text-white" style={{ backgroundColor: "#161619" }}>
              {wallet?.address ?? "---"}
            </code>
            {wallet?.address && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(wallet.address);
                  showToast("Address copied!", true);
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 transition-all hover:border-indigo-500/50 hover:text-indigo-400"
              >
                <IconCopy className="h-4 w-4 text-zinc-400" />
              </button>
            )}
          </div>
          <p className="mt-3 text-[11px] text-zinc-600">
            This address cannot be changed
          </p>
        </div>
      </div>

      {/* Transfer form */}
      <div id="transfer-section" className="rounded-xl border border-white/5 p-6" style={{ backgroundColor: "#121214" }}>
        <h4 className="mb-5 text-sm font-semibold text-white">Transfer Funds</h4>
        <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400">Amount (LTC)</label>
            <input
              type="number"
              step="any"
              min="0.00000001"
              max={wallet?.balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00000000"
              className="rounded-lg border border-white/10 px-3 py-2.5 font-mono text-sm text-white outline-none transition-all focus:border-indigo-500/50 placeholder:text-zinc-700"
              style={{ backgroundColor: "#161619" }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400">Destination Address</label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="ltc1q..."
              className="rounded-lg border border-white/10 px-3 py-2.5 font-mono text-sm text-white outline-none transition-all focus:border-indigo-500/50 placeholder:text-zinc-700"
              style={{ backgroundColor: "#161619" }}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                !toAddress.trim()
              }
              className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-black transition-all hover:bg-amber-600 disabled:opacity-50"
            >
              Transfer
            </button>
          </div>
        </form>
        {wallet && (
          <p className="mt-3 text-xs text-zinc-600">
            Available: {wallet.balance.toFixed(8)} LTC
          </p>
        )}
      </div>

      {/* Transaction history */}
      <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">Transaction History</h4>
          <span className="text-xs text-zinc-500">{walletFeed.length} transactions</span>
        </div>
        {walletFeed.length === 0 ? (
          <p className="text-sm text-zinc-500">No transactions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Type</th>
                  <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Description</th>
                  <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-right">Amount</th>
                  <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {walletFeed.slice(0, 20).map((item, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="py-2.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          item.type === "exchange"
                            ? "bg-cyan-500/10 text-cyan-400"
                            : item.type === "escrow"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-indigo-500/10 text-indigo-400"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2.5 text-sm text-zinc-300">{item.label}</td>
                    <td className="py-2.5 text-right">
                      {item.amount !== undefined && (
                        <span className="font-semibold text-white">
                          {formatCurrency(item.amount, "EUR")}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right text-xs text-zinc-500">
                      {formatRelativeTime(item.ts)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const { user: settingsUser } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">Settings</h3>
        <p className="mt-0.5 text-sm text-zinc-500">Configure your dashboard preferences</p>
      </div>

      <div className="rounded-xl border border-white/5 p-6" style={{ backgroundColor: "#121214" }}>
        <h4 className="mb-5 text-sm font-semibold text-white">Dashboard</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Auto-refresh</p>
              <p className="text-xs text-zinc-500">
                Automatically refresh data every 15 seconds
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => onAutoRefreshChange(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-zinc-700 peer-checked:bg-indigo-500 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 p-6" style={{ backgroundColor: "#121214" }}>
        <h4 className="mb-5 text-sm font-semibold text-white">System Info</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/[0.02] transition-colors">
            <span className="text-sm text-zinc-500">Bot Status</span>
            <span className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  botOnline === null
                    ? "bg-zinc-600"
                    : botOnline
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-rose-400"
                }`}
              />
              <span
                className={`text-sm font-semibold ${
                  botOnline
                    ? "text-emerald-400"
                    : botOnline === false
                      ? "text-rose-400"
                      : "text-zinc-500"
                }`}
              >
                {botOnline === null
                  ? "Checking..."
                  : botOnline
                    ? "Online"
                    : "Offline"}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/[0.02] transition-colors">
            <span className="text-sm text-zinc-500">Products</span>
            <span className="text-sm font-medium text-white">{products.length}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/[0.02] transition-colors">
            <span className="text-sm text-zinc-500">Events Loaded</span>
            <span className="text-sm font-medium text-white">{feed.length}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/[0.02] transition-colors">
            <span className="text-sm text-zinc-500">Admin Email</span>
            <span className="text-sm font-medium text-white">{settingsUser?.email ?? ""}</span>
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-white/10 p-6 shadow-2xl"
        style={{ backgroundColor: "#161619" }}
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
      <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
      <p className="mb-6 text-sm text-zinc-400">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-400 transition-all hover:text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            onConfirm();
          }}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-all disabled:opacity-50 ${confirmClass}`}
        >
          {busy ? "..." : confirmLabel}
        </button>
      </div>
    </ModalOverlay>
  );
}
