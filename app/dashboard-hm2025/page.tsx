"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createProduct,
  createSmmProduct,
  deleteProduct,
  deleteSmmProduct,
  getFeed,
  getHealth,
  getLtcPrice,
  getProducts,
  getSmmProducts,
  getStats,
  getWalletInfo,
  transferFunds,
  updateProduct,
  updateProductStock,
  updateSmmProduct,
} from "@/lib/api";
import { formatCurrency, formatEur, formatRelativeTime } from "@/lib/format";
import { useAuth } from "@/lib/hooks/useAuth";
import type {
  ApiProduct,
  FeedItem,
  LtcResponse,
  SmmProduct,
  StatsResponse,
  WalletInfo,
} from "@/lib/types";

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const AUTO_REFRESH_MS = 15_000;

const STOREFRONT_CONFIG_KEY = "hm_storefront_config";

const NAV_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  "smm-products": "SMM Products",
  addons: "Addons",
  categories: "Categories",
  coupons: "Coupons",
  "quantity-deals": "Quantity Deals",
  "bundle-offers": "Bundle Offers",
  orders: "Invoices",
  customers: "Customers",
  feedbacks: "Feedbacks",
  tickets: "Tickets",
  "abandoned-checkouts": "Abandoned Checkouts",
  wallet: "Wallet",
  "storefront-configure": "Configure Storefront",
  themes: "Themes",
  "custom-pages": "Custom Pages",
  images: "Images",
  files: "Files",
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
  | "smm-products"
  | "smm-product-edit"
  | "addons"
  | "categories"
  | "coupons"
  | "quantity-deals"
  | "bundle-offers"
  | "orders"
  | "customers"
  | "feedbacks"
  | "tickets"
  | "abandoned-checkouts"
  | "wallet"
  | "storefront-configure"
  | "themes"
  | "custom-pages"
  | "images"
  | "files"
  | "activity-logs"
  | "settings";

type ModalKind =
  | { kind: "confirm-delete"; product: ApiProduct }
  | { kind: "confirm-delete-smm"; product: SmmProduct }
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

function IconSmm({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
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

function IconGift({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function IconPercent({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

function IconPuzzle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3v2.5a1.5 1.5 0 0 0 3 0V3h4a1 1 0 0 1 1 1v4h-2.5a1.5 1.5 0 0 0 0 3H18v4a1 1 0 0 1-1 1h-4v-2.5a1.5 1.5 0 0 0-3 0V21H6a1 1 0 0 1-1-1v-4H3.5a1.5 1.5 0 0 1 0-3H5V4a1 1 0 0 1 1-1z" />
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

function IconPalette({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".75" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".75" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".75" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".75" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function IconFileText({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function IconImage({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function IconFolder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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
  const [smmProducts, setSmmProducts] = useState<SmmProduct[]>([]);
  const [editingSmmProduct, setEditingSmmProduct] = useState<SmmProduct | null>(null);
  const [smmSearch, setSmmSearch] = useState("");
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
    const [statsRes, productsRes, feedRes, ltcRes, healthRes, walletRes, smmRes] =
      await Promise.all([
        getStats(),
        getProducts(),
        getFeed(100),
        getLtcPrice(),
        getHealth(),
        getWalletInfo(),
        getSmmProducts(),
      ]);
    if (statsRes) setStats(statsRes);
    if (productsRes?.products) setProducts(productsRes.products);
    if (smmRes?.products) setSmmProducts(smmRes.products);
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

  /* -- computed -- */
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

  /* -- daily aggregations for charts -- */
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

  /* -- SMM product actions -- */
  const filteredSmmProducts = smmProducts.filter((p) =>
    p.name.toLowerCase().includes(smmSearch.toLowerCase())
  );

  async function handleDeleteSmmProduct(product: SmmProduct) {
    const ok = await deleteSmmProduct(product.id);
    if (ok) {
      setSmmProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`"${product.name}" deleted`, true);
    } else {
      showToast(!tokenConfigured ? "ADMIN_TOKEN non configurato — fai Redeploy su Vercel" : "Error deleting SMM product — check console (F12)", false);
    }
    setModal(null);
  }

  async function handleSaveSmmProduct(
    data: Partial<SmmProduct> & { id?: string }
  ) {
    if (data.id) {
      const { id, ...rest } = data;
      const updated = await updateSmmProduct(id, rest);
      if (updated) {
        setSmmProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
        );
        showToast(`"${updated.name}" updated`, true);
      } else {
        showToast(!tokenConfigured ? "ADMIN_TOKEN non configurato — fai Redeploy su Vercel" : "Error updating SMM product — check console (F12)", false);
      }
    } else {
      const created = await createSmmProduct(data as Omit<SmmProduct, "id" | "createdAt">);
      if (created) {
        setSmmProducts((prev) => [...prev, created]);
        showToast(`"${created.name}" created`, true);
      } else {
        showToast(!tokenConfigured ? "ADMIN_TOKEN non configurato — fai Redeploy su Vercel" : "Error creating SMM product — check console (F12)", false);
      }
    }
    setActiveNav("smm-products");
    setEditingSmmProduct(null);
  }

  function openSmmProductEdit(product: SmmProduct | null) {
    setEditingSmmProduct(product);
    setActiveNav("smm-product-edit");
    setSidebarOpen(false);
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
              icon={<IconSmm className="h-4 w-4" />}
              label="SMM Products"
              active={activeNav === "smm-products" || activeNav === "smm-product-edit"}
              onClick={() => navigateTo("smm-products")}
              indent
            />
            <SidebarItem
              icon={<IconPuzzle className="h-4 w-4" />}
              label="Addons"
              active={activeNav === "addons"}
              onClick={() => navigateTo("addons")}
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
            <SidebarItem
              icon={<IconPercent className="h-4 w-4" />}
              label="Quantity Deals"
              active={activeNav === "quantity-deals"}
              onClick={() => navigateTo("quantity-deals")}
              indent
            />
            <SidebarItem
              icon={<IconGift className="h-4 w-4" />}
              label="Bundle Offers"
              active={activeNav === "bundle-offers"}
              onClick={() => navigateTo("bundle-offers")}
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
              icon={<IconPalette className="h-4 w-4" />}
              label="Themes"
              active={activeNav === "themes"}
              onClick={() => navigateTo("themes")}
              indent
            />
            <SidebarItem
              icon={<IconFileText className="h-4 w-4" />}
              label="Custom Pages"
              active={activeNav === "custom-pages"}
              onClick={() => navigateTo("custom-pages")}
              indent
            />
            <SidebarItem
              icon={<IconImage className="h-4 w-4" />}
              label="Images"
              active={activeNav === "images"}
              onClick={() => navigateTo("images")}
              indent
            />
            <SidebarItem
              icon={<IconFolder className="h-4 w-4" />}
              label="Files"
              active={activeNav === "files"}
              onClick={() => navigateTo("files")}
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
                : activeNav === "smm-product-edit"
                  ? editingSmmProduct
                    ? `Edit: ${editingSmmProduct.name}`
                    : "New SMM Product"
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
              product={editingProduct}
              onSave={handleSaveProduct}
              onCancel={() => navigateTo("products")}
              onDelete={(p) => setModal({ kind: "confirm-delete", product: p })}
            />
          )}
          {activeNav === "smm-products" && (
            <SmmProductsView
              products={filteredSmmProducts}
              search={smmSearch}
              onSearchChange={setSmmSearch}
              onEdit={openSmmProductEdit}
              onNew={() => openSmmProductEdit(null)}
              onDelete={(p) => setModal({ kind: "confirm-delete-smm", product: p })}
            />
          )}
          {activeNav === "smm-product-edit" && (
            <SmmProductEditView
              product={editingSmmProduct}
              onSave={handleSaveSmmProduct}
              onCancel={() => navigateTo("smm-products")}
              onDelete={(p) => setModal({ kind: "confirm-delete-smm", product: p })}
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
          {activeNav === "addons" && <AddonsView />}
          {activeNav === "categories" && <CategoriesView products={products} />}
          {activeNav === "coupons" && <CouponsView />}
          {activeNav === "quantity-deals" && <QuantityDealsView />}
          {activeNav === "bundle-offers" && <BundleOffersView />}
          {activeNav === "feedbacks" && <FeedbacksView feed={feed} />}
          {activeNav === "abandoned-checkouts" && <AbandonedCheckoutsView />}
          {activeNav === "storefront-configure" && (
            <StorefrontConfigureView showToast={showToast} />
          )}
          {activeNav === "themes" && <ThemesView showToast={showToast} />}
          {activeNav === "custom-pages" && <CustomPagesView />}
          {activeNav === "images" && <ImagesView />}
          {activeNav === "files" && <FilesView />}
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
      {modal?.kind === "confirm-delete-smm" && (
        <ConfirmModal
          title="Delete SMM Product"
          message={`Are you sure you want to delete "${modal.product.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          confirmClass="bg-rose-500 text-white hover:bg-rose-600"
          onConfirm={() => handleDeleteSmmProduct(modal.product)}
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
  const [activeTab, setActiveTab] = useState<
    "general" | "pricing" | "custom-fields" | "visibility" | "discord" | "misc"
  >("general");
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [image, setImage] = useState(product?.image ?? "");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [currency, setCurrency] = useState(product?.currency ?? "EUR");
  const [stock, setStock] = useState(product?.stock ?? 0);
  const [stockItems, setStockItems] = useState("");
  const [saving, setSaving] = useState(false);
  // Custom fields tab
  const [customFields, setCustomFields] = useState("");
  // Visibility tab
  const [published, setPublished] = useState(true);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  // Discord tab
  const [discordRoleId, setDiscordRoleId] = useState("");
  const [discordServerId, setDiscordServerId] = useState("");
  // Misc tab
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  function handleSave() {
    if (!name.trim() || !price.trim()) return;
    const trimmedImage = image.trim();
    if (trimmedImage && !/^https:\/\//i.test(trimmedImage)) return;
    setSaving(true);
    onSave({
      ...(product ? { id: product.id } : {}),
      name: name.trim(),
      price: parseFloat(price),
      currency,
      description: description.trim(),
      image: trimmedImage || undefined,
      stock,
    });
  }

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-white"
        >
          <IconChevronLeft className="h-4 w-4" />
          Back to Products
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
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-400 transition-all hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim() || !price.trim()}
            className="rounded-lg bg-indigo-500 px-5 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === "general"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pricing")}
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === "pricing"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Pricing & Stock
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("custom-fields")}
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === "custom-fields"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Custom Fields
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("visibility")}
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === "visibility"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Visibility
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("discord")}
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === "discord"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Discord
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("misc")}
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === "misc"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Miscellaneous
        </button>
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-white/5 p-6" style={{ backgroundColor: "#121214" }}>
        {activeTab === "general" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white outline-none transition-all focus:border-indigo-500/50"
                  style={{ backgroundColor: "#161619" }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white outline-none transition-all focus:border-indigo-500/50 resize-none"
                  style={{ backgroundColor: "#161619" }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Digital, Account, etc."
                  className="rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white outline-none transition-all focus:border-indigo-500/50 placeholder:text-zinc-600"
                  style={{ backgroundColor: "#161619" }}
                />
              </div>
            </div>
            <div className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400">Image URL</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white outline-none transition-all focus:border-indigo-500/50 placeholder:text-zinc-600"
                  style={{ backgroundColor: "#161619" }}
                />
              </div>
              {image.trim() && (
                <div className="rounded-xl border border-white/5 p-4" style={{ backgroundColor: "#161619" }}>
                  <p className="mb-3 text-xs font-medium text-zinc-500">Preview</p>
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
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400">Price *</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white outline-none transition-all focus:border-indigo-500/50"
                  style={{ backgroundColor: "#161619" }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white outline-none transition-all focus:border-indigo-500/50"
                  style={{ backgroundColor: "#161619" }}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400">Stock</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStock((s) => Math.max(0, s - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-lg font-bold text-rose-400 transition-all hover:border-rose-400/30 hover:bg-rose-500/10"
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
                    className="w-20 rounded-lg border border-white/10 px-3 py-2 text-center text-sm font-semibold text-white outline-none focus:border-indigo-500/50"
                    style={{ backgroundColor: "#161619" }}
                  />
                  <button
                    type="button"
                    onClick={() => setStock((s) => s + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-lg font-bold text-emerald-400 transition-all hover:border-emerald-400/30 hover:bg-emerald-500/10"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400">Stock Items / Serials</label>
                <p className="text-[11px] text-zinc-600">
                  Paste codes/serials, one per line. These are the deliverable items.
                </p>
                <textarea
                  value={stockItems}
                  onChange={(e) => setStockItems(e.target.value)}
                  rows={6}
                  placeholder={"SERIAL-001\nSERIAL-002\nSERIAL-003"}
                  className="rounded-lg border border-white/10 px-3 py-2.5 font-mono text-xs text-white outline-none transition-all focus:border-indigo-500/50 resize-none placeholder:text-zinc-700"
                  style={{ backgroundColor: "#161619" }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">
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
                  className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  Add to Stock
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "custom-fields" && (
          <div className="max-w-2xl space-y-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Custom Fields</label>
              <p className="text-[11px] text-zinc-600">
                Add custom key-value pairs, one per line in the format{" "}
                <code className="rounded bg-white/5 px-1 text-zinc-400">key: value</code>.
                These are shown to the customer at checkout.
              </p>
              <textarea
                value={customFields}
                onChange={(e) => setCustomFields(e.target.value)}
                rows={8}
                placeholder={"region: EU\nwarranty: 30 days\nplatform: PC"}
                className="rounded-lg border border-white/10 px-3 py-2.5 font-mono text-xs text-white outline-none transition-all focus:border-indigo-500/50 resize-none placeholder:text-zinc-700"
                style={{ backgroundColor: "#161619" }}
              />
              <span className="text-xs text-zinc-500">
                {customFields.trim()
                  ? `${customFields.trim().split("\n").filter((l) => l.includes(":")).length} field(s)`
                  : "0 fields"}
              </span>
            </div>
          </div>
        )}

        {activeTab === "visibility" && (
          <div className="max-w-2xl space-y-6">
            <div className="flex items-center justify-between rounded-lg border border-white/5 px-4 py-3" style={{ backgroundColor: "#161619" }}>
              <div>
                <p className="text-sm font-medium text-white">{published ? "Published" : "Hidden"}</p>
                <p className="text-xs text-zinc-500">
                  {published
                    ? "This product is visible in the storefront."
                    : "This product is hidden from the storefront."}
                </p>
              </div>
              <ToggleSwitch checked={published} onChange={setPublished} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400">Available From</label>
                <input
                  type="date"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  className="rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white outline-none transition-all focus:border-indigo-500/50"
                  style={{ backgroundColor: "#161619" }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400">Available Until</label>
                <input
                  type="date"
                  value={availableUntil}
                  onChange={(e) => setAvailableUntil(e.target.value)}
                  className="rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white outline-none transition-all focus:border-indigo-500/50"
                  style={{ backgroundColor: "#161619" }}
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-600">
              Leave the date range empty to keep the product available indefinitely while published.
            </p>
          </div>
        )}

        {activeTab === "discord" && (
          <div className="max-w-2xl space-y-5">
            <p className="text-[11px] text-zinc-600">
              Optionally grant a Discord role automatically when a customer purchases this product.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Discord Server ID</label>
              <input
                type="text"
                value={discordServerId}
                onChange={(e) => setDiscordServerId(e.target.value)}
                placeholder="e.g. 123456789012345678"
                className="rounded-lg border border-white/10 px-3 py-2.5 font-mono text-sm text-white outline-none transition-all focus:border-indigo-500/50 placeholder:text-zinc-700"
                style={{ backgroundColor: "#161619" }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Discord Role ID (granted on purchase)</label>
              <input
                type="text"
                value={discordRoleId}
                onChange={(e) => setDiscordRoleId(e.target.value)}
                placeholder="e.g. 987654321098765432"
                className="rounded-lg border border-white/10 px-3 py-2.5 font-mono text-sm text-white outline-none transition-all focus:border-indigo-500/50 placeholder:text-zinc-700"
                style={{ backgroundColor: "#161619" }}
              />
            </div>
          </div>
        )}

        {activeTab === "misc" && (
          <div className="max-w-2xl space-y-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Internal Notes</label>
              <p className="text-[11px] text-zinc-600">Only visible to admins. Not shown to customers.</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Add any internal notes about this product..."
                className="rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white outline-none transition-all focus:border-indigo-500/50 resize-none placeholder:text-zinc-700"
                style={{ backgroundColor: "#161619" }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma separated, e.g. featured, new, sale"
                className="rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white outline-none transition-all focus:border-indigo-500/50 placeholder:text-zinc-700"
                style={{ backgroundColor: "#161619" }}
              />
              {tags.trim() && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((t, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400"
                      >
                        {t}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
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

function AddonsView() {
  const addons: { id: string; name: string; price: number }[] = [];
  return (
    <div className="space-y-5">
      <ViewHeader
        title="Addons"
        subtitle={`Optional extras customers can add to their order (${addons.length} total)`}
        action={<PrimaryButton label="+ New Addon" />}
      />
      {addons.length === 0 ? (
        <EmptyState
          icon={<IconPuzzle className="h-6 w-6" />}
          message="No addons available."
          hint="Addons let customers upgrade their purchase at checkout."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {addons.map((a) => (
            <div key={a.id} className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
              <h4 className="text-sm font-semibold text-white">{a.name}</h4>
              <p className="mt-2 text-xs font-bold text-indigo-400">{formatCurrency(a.price, "EUR")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuantityDealsView() {
  const deals: { min: number; discount: number }[] = [];
  return (
    <div className="space-y-5">
      <ViewHeader
        title="Quantity Deals"
        subtitle={`Reward customers for buying in bulk (${deals.length} total)`}
        action={<PrimaryButton label="+ New Deal" />}
      />
      {deals.length === 0 ? (
        <EmptyState
          icon={<IconPercent className="h-6 w-6" />}
          message="No quantity deals configured."
          hint="Offer a percentage discount when customers reach a quantity threshold."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5" style={{ backgroundColor: "#121214" }}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Min. Quantity</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Discount</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white">{d.min}+</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">{d.discount}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BundleOffersView() {
  const bundles: { id: string; name: string; price: number; items: number }[] = [];
  return (
    <div className="space-y-5">
      <ViewHeader
        title="Bundle Offers"
        subtitle={`Sell multiple products together at a special price (${bundles.length} total)`}
        action={<PrimaryButton label="+ New Bundle" />}
      />
      {bundles.length === 0 ? (
        <EmptyState
          icon={<IconGift className="h-6 w-6" />}
          message="No bundle offers created."
          hint="Combine products into a discounted bundle to increase order value."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bundles.map((b) => (
            <div key={b.id} className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: "#121214" }}>
              <h4 className="text-sm font-semibold text-white">{b.name}</h4>
              <p className="mt-1 text-xs text-zinc-500">{b.items} products</p>
              <p className="mt-2 text-sm font-bold text-indigo-400">{formatCurrency(b.price, "EUR")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Orders: Feedbacks / Abandoned Checkouts                           */
/* ================================================================== */

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

function ThemesView({ showToast }: { showToast: (msg: string, ok: boolean) => void }) {
  const themes = [
    { id: "dark", name: "Dark", swatches: ["#09090b", "#121214", "#6366f1"] },
    { id: "light", name: "Light", swatches: ["#fafafa", "#ffffff", "#6366f1"] },
    { id: "midnight", name: "Midnight", swatches: ["#020617", "#0f172a", "#818cf8"] },
    { id: "ocean", name: "Ocean", swatches: ["#082f49", "#0c4a6e", "#38bdf8"] },
  ];
  const [active, setActive] = useState("dark");
  return (
    <div className="space-y-5">
      <ViewHeader title="Themes" subtitle="Choose a look for your storefront" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setActive(t.id);
              showToast(`"${t.name}" theme applied`, true);
            }}
            className={`overflow-hidden rounded-xl border text-left transition-all ${
              active === t.id ? "border-indigo-500 ring-1 ring-indigo-500/30" : "border-white/5 hover:border-white/10"
            }`}
            style={{ backgroundColor: "#121214" }}
          >
            <div className="flex h-24">
              {t.swatches.map((s, i) => (
                <span key={i} className="flex-1" style={{ backgroundColor: s }} />
              ))}
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-sm font-semibold text-white">{t.name}</span>
              {active === t.id && (
                <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                  Active
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CustomPagesView() {
  const pages: { title: string; slug: string; edited: string }[] = [];
  return (
    <div className="space-y-5">
      <ViewHeader
        title="Custom Pages"
        subtitle={`Add static pages like FAQ or Terms (${pages.length} total)`}
        action={<PrimaryButton label="+ New Page" />}
      />
      {pages.length === 0 ? (
        <EmptyState
          icon={<IconFileText className="h-6 w-6" />}
          message="No custom pages."
          hint="Create pages such as Terms of Service, FAQ, or About."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5" style={{ backgroundColor: "#121214" }}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Title", "Slug", "Last Edited"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.slug} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-white">{p.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">/{p.slug}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{p.edited}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ImagesView() {
  const images: { id: string; url: string }[] = [];
  return (
    <div className="space-y-5">
      <ViewHeader
        title="Images"
        subtitle={`Manage uploaded images (${images.length} total)`}
        action={<PrimaryButton label="Upload Image" />}
      />
      {images.length === 0 ? (
        <EmptyState
          icon={<IconImage className="h-6 w-6" />}
          message="No images uploaded."
          hint="Upload images to use across your products and pages."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {images.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-xl border border-white/5" style={{ backgroundColor: "#121214" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-28 w-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilesView() {
  const files: { name: string; size: string; type: string; date: string }[] = [];
  return (
    <div className="space-y-5">
      <ViewHeader
        title="Files"
        subtitle={`Deliverable files for your products (${files.length} total)`}
        action={<PrimaryButton label="Upload File" />}
      />
      {files.length === 0 ? (
        <EmptyState
          icon={<IconFolder className="h-6 w-6" />}
          message="No files uploaded."
          hint="Upload files that can be delivered to customers on purchase."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5" style={{ backgroundColor: "#121214" }}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Name", "Size", "Type", "Uploaded"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {files.map((f, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-white">{f.name}</td>
                  <td className="px-4 py-3 text-zinc-300">{f.size}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{f.type}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{f.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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

/* ================================================================== */
/*  SMM Products View                                                  */
/* ================================================================== */

function SmmProductsView({
  products,
  search,
  onSearchChange,
  onEdit,
  onNew,
  onDelete,
}: {
  products: SmmProduct[];
  search: string;
  onSearchChange: (v: string) => void;
  onEdit: (p: SmmProduct) => void;
  onNew: () => void;
  onDelete: (p: SmmProduct) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M21 21l-3.5-3.5" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search SMM products..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-indigo-500 sm:w-64"
          />
        </div>
        <button
          type="button"
          onClick={onNew}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-600"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          New SMM Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-white/5 p-10 text-center" style={{ backgroundColor: "#121214" }}>
          <p className="text-sm text-zinc-500">No SMM products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="group rounded-xl border border-white/5 p-5 transition-colors hover:border-indigo-500/30"
              style={{ backgroundColor: "#121214" }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-sm font-bold text-indigo-400">
                      SMM
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-white">{product.name}</h4>
                    {product.category && (
                      <span className="text-xs text-zinc-500">{product.category}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => onEdit(product)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-indigo-400 transition-colors">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => onDelete(product)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-rose-400 transition-colors">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.78.72l.5 6.5a.75.75 0 01-1.498.116l-.5-6.5a.75.75 0 01.718-.836zm3.617.72a.75.75 0 00-1.497-.116l-.5 6.5a.75.75 0 001.498.116l.5-6.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Service ID</span>
                  <span className="text-white">{product.serviceId}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Price / 1K</span>
                  <span className="font-semibold text-emerald-400">€{product.pricePerThousand.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Min / Max</span>
                  <span className="text-white">{product.minQuantity.toLocaleString()} – {product.maxQuantity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Status</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${product.active ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-500"}`}>
                    {product.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  SMM Product Edit View                                              */
/* ================================================================== */

function SmmProductEditView({
  product,
  onSave,
  onCancel,
  onDelete,
}: {
  product: SmmProduct | null;
  onSave: (data: Partial<SmmProduct> & { id?: string }) => void;
  onCancel: () => void;
  onDelete: (p: SmmProduct) => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [serviceId, setServiceId] = useState(product?.serviceId?.toString() ?? "");
  const [pricePerThousand, setPricePerThousand] = useState(product?.pricePerThousand?.toString() ?? "");
  const [instructions, setInstructions] = useState(product?.instructions ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [image, setImage] = useState(product?.image ?? "");
  const [minQuantity, setMinQuantity] = useState(product?.minQuantity?.toString() ?? "100");
  const [maxQuantity, setMaxQuantity] = useState(product?.maxQuantity?.toString() ?? "10000");
  const [active, setActive] = useState(product?.active ?? true);
  const [saving, setSaving] = useState(false);

  const isValid = name.trim() && serviceId.trim() && pricePerThousand.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || saving) return;
    setSaving(true);
    await onSave({
      ...(product ? { id: product.id } : {}),
      name: name.trim(),
      serviceId: parseInt(serviceId, 10),
      pricePerThousand: parseFloat(pricePerThousand),
      instructions: instructions.trim(),
      category: category.trim() || undefined,
      image: image.trim() || undefined,
      minQuantity: parseInt(minQuantity, 10) || 100,
      maxQuantity: parseInt(maxQuantity, 10) || 10000,
      active,
    });
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-white/5 p-6" style={{ backgroundColor: "#121214" }}>
          <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-zinc-400">Product Details</h3>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Instagram Followers"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Service ID *</label>
              <input
                type="number"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                placeholder="e.g. 1, 2, 153"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Price per 1000 (EUR) *</label>
              <input
                type="number"
                value={pricePerThousand}
                onChange={(e) => setPricePerThousand(e.target.value)}
                step="0.01"
                min="0"
                placeholder="e.g. 0.90"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Instagram, TikTok, YouTube"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Image URL</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Min Quantity</label>
              <input
                type="number"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                min="1"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Max Quantity</label>
              <input
                type="number"
                value={maxQuantity}
                onChange={(e) => setMaxQuantity(e.target.value)}
                min="1"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Instructions</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                placeholder="e.g. Insert your Instagram profile link. Profile must be public."
                className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActive((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors ${active ? "bg-indigo-500" : "bg-zinc-700"}`}
              >
                <span className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? "left-[22px]" : "left-0.5"}`} />
              </button>
              <span className="text-sm text-zinc-400">{active ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>

        {image && image.startsWith("https://") && (
          <div className="rounded-xl border border-white/5 p-4" style={{ backgroundColor: "#121214" }}>
            <p className="mb-2 text-xs font-semibold text-zinc-400">Image Preview</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-32 w-full rounded-lg object-cover" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-400 transition-all hover:text-white"
            >
              Cancel
            </button>
            {product && (
              <button
                type="button"
                onClick={() => onDelete(product)}
                className="rounded-lg border border-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-400 transition-all hover:bg-rose-500/10"
              >
                Delete
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!isValid || saving}
            className="rounded-lg bg-indigo-500 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : product ? "Update Product" : "Create Product"}
          </button>
        </div>
      </form>
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
