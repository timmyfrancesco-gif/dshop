"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import LocaleSelector from "@/components/ui/LocaleSelector";
import { SITE } from "@/lib/config";
import { useLocale } from "@/lib/hooks/useLocale";

const NAV_KEYS = [
  { href: "/#top", key: "nav.home" },
  { href: "/#shop", key: "nav.products" },
  { href: "/#services", key: "nav.features" },
  { href: "/#faq", key: "nav.faq" },
  { href: "/#vouches", key: "nav.reviews" },
  { href: "/track", key: "nav.trackOrder" },
  { href: "/terms", key: "nav.terms" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/#top" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Logo className="h-8 w-8" />
          <span>{SITE.name}</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_KEYS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LocaleSelector />
          <a
            href={SITE.discordInvite}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M20.3 4.5A18.5 18.5 0 0015.7 3l-.3.6a14 14 0 014.2 1.6 13.6 13.6 0 00-12.2 0A14 14 0 017.6 3.6L7.3 3a18.5 18.5 0 00-4.6 1.5C1 8 .5 11.4.7 14.8a13.8 13.8 0 004.1 2.1l.8-1.3a8.7 8.7 0 01-1.5-.7l.4-.3a11.7 11.7 0 009 0l.4.3a8.7 8.7 0 01-1.5.7l.8 1.3a13.8 13.8 0 004.1-2.1c.3-3.9-.6-7.3-1.9-10.3zM8.7 12.7c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.8 0 1.5.7 1.5 1.6 0 .9-.7 1.6-1.5 1.6zm6.6 0c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.9 0 1.5.7 1.5 1.6 0 .9-.6 1.6-1.5 1.6z" />
            </svg>
            {t("nav.discord")}
          </a>
          <Link
            href="/#shop"
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
            {NAV_KEYS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-background-elevated hover:text-foreground"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex justify-center">
              <LocaleSelector />
            </div>
            <a
              href={SITE.discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-4 py-2 text-center text-sm font-semibold text-foreground"
            >
              {t("nav.discord")}
            </a>
            <Link
              href="/#shop"
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
