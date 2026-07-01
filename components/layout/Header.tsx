"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import LocaleSelector from "@/components/ui/LocaleSelector";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLocale } from "@/lib/hooks/useLocale";
import { useSiteConfig } from "@/lib/contexts/SiteConfigContext";
import { safeExternalUrl } from "@/lib/safeUrl";

const NAV_KEYS = [
  { href: "/#top", key: "nav.home", tenantVisible: true },
  { href: "/#shop", key: "nav.products", tenantVisible: true },
  { href: "/#services", key: "nav.features", tenantVisible: false },
  { href: "/#faq", key: "nav.faq", tenantVisible: true },
  { href: "/#vouches", key: "nav.reviews", tenantVisible: false },
  { href: "/track", key: "nav.trackOrder", tenantVisible: false },
  { href: "/terms", key: "nav.terms", tenantVisible: false },
];

function UserMenu() {
  const { t } = useLocale();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        {t("auth.login")}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-accent"
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt=""
            className="h-6 w-6 rounded-full"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="max-w-[100px] truncate">{user.username}</span>
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-background shadow-xl z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">{user.username}</p>
            <p className="text-xs text-muted truncate">{user.email}</p>
          </div>
          <div className="py-1">
            {user.role === "admin" && (
              <Link
                href="/dashboard-hm2025"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-accent hover:bg-background-elevated transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
                Dashboard
              </Link>
            )}
            <Link
              href="/track"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-background-elevated transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
              </svg>
              {t("auth.myOrders")}
            </Link>
            <button
              type="button"
              onClick={() => { logout(); setOpen(false); }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-background-elevated transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {t("auth.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();
  const { user, logout } = useAuth();
  const site = useSiteConfig();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href={site.isTenant ? `/s/${site.tenantSlug}` : "/#top"} className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight whitespace-nowrap">
          {site.tenantLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={site.tenantLogo} alt="" className="h-8 w-8 rounded-full" />
          ) : (
            <Logo className="h-8 w-8" />
          )}
          <span>{site.name}</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_KEYS.filter((l) => !site.isTenant || l.tenantVisible).map((link) => {
            const href = site.isTenant && link.href.startsWith("/#")
              ? `/s/${site.tenantSlug}${link.href}`
              : link.href;
            return (
              <Link
                key={link.href}
                href={href}
                className="text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                {t(link.key)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LocaleSelector />
          <UserMenu />
          <a
            href={safeExternalUrl(site.discordInvite)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M20.3 4.5A18.5 18.5 0 0015.7 3l-.3.6a14 14 0 014.2 1.6 13.6 13.6 0 00-12.2 0A14 14 0 017.6 3.6L7.3 3a18.5 18.5 0 00-4.6 1.5C1 8 .5 11.4.7 14.8a13.8 13.8 0 004.1 2.1l.8-1.3a8.7 8.7 0 01-1.5-.7l.4-.3a11.7 11.7 0 009 0l.4.3a8.7 8.7 0 01-1.5.7l.8 1.3a13.8 13.8 0 004.1-2.1c.3-3.9-.6-7.3-1.9-10.3zM8.7 12.7c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.8 0 1.5.7 1.5 1.6 0 .9-.7 1.6-1.5 1.6zm6.6 0c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.9 0 1.5.7 1.5 1.6 0 .9-.6 1.6-1.5 1.6z" />
            </svg>
            {t("nav.discord")}
          </a>
          {!site.isTenant && (
            <Link
              href="/create-shop"
              className="rounded-full border border-accent/50 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent hover:bg-accent/10"
            >
              Create Shop
            </Link>
          )}
          <Link
            href={site.isTenant ? `/s/${site.tenantSlug}/#shop` : "/#shop"}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background shadow-[0_0_24px_-6px_var(--accent)] transition-transform hover:scale-105"
          >
            {t("nav.shopNow")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground lg:hidden"
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1.5">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </div>
        </button>
      </div>

      {open ? (
        <div className="border-t border-border/60 bg-background/95 px-4 pb-6 pt-2 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_KEYS.filter((l) => !site.isTenant || l.tenantVisible).map((link) => {
              const href = site.isTenant && link.href.startsWith("/#")
                ? `/s/${site.tenantSlug}${link.href}`
                : link.href;
              return (
                <Link
                  key={link.href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-background-elevated hover:text-foreground"
                >
                  {t(link.key)}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex justify-center">
              <LocaleSelector />
            </div>
            {/* Mobile auth */}
            {user ? (
              <>
                <div className="flex items-center justify-center gap-2 py-2">
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt="" className="h-6 w-6 rounded-full" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground">{user.username}</span>
                </div>
                {user.role === "admin" && (
                  <Link
                    href="/dashboard-hm2025"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-border px-4 py-2 text-center text-sm font-semibold text-accent"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => { logout(); setOpen(false); }}
                  className="rounded-full border border-border px-4 py-2 text-center text-sm font-semibold text-rose-400"
                >
                  {t("auth.logout")}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-full border border-border px-4 py-2 text-center text-sm font-semibold text-foreground"
              >
                {t("auth.login")}
              </Link>
            )}
            <a
              href={safeExternalUrl(site.discordInvite)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-4 py-2 text-center text-sm font-semibold text-foreground"
            >
              {t("nav.discord")}
            </a>
            {!site.isTenant && (
              <Link
                href="/create-shop"
                onClick={() => setOpen(false)}
                className="rounded-full border border-accent/50 px-4 py-2 text-center text-sm font-semibold text-accent"
              >
                Create Shop
              </Link>
            )}
            <Link
              href={site.isTenant ? `/s/${site.tenantSlug}/#shop` : "/#shop"}
              onClick={() => setOpen(false)}
              className="rounded-full bg-accent px-4 py-2 text-center text-sm font-semibold text-background"
            >
              {t("nav.shopNow")}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
