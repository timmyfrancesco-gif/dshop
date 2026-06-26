"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { SITE } from "@/lib/config";
import { useLocale } from "@/lib/hooks/useLocale";

export default function Footer() {
  const { t } = useLocale();

  return (
    <footer className="border-t border-border/60 bg-background-elevated/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="max-w-sm">
            <Link href="/#top" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <Logo className="h-8 w-8" />
              <span>{SITE.name}</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {t("footer.description")}
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href={SITE.discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#5865F2] px-5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M20.3 4.5A18.5 18.5 0 0015.7 3l-.3.6a14 14 0 014.2 1.6 13.6 13.6 0 00-12.2 0A14 14 0 017.6 3.6L7.3 3a18.5 18.5 0 00-4.6 1.5C1 8 .5 11.4.7 14.8a13.8 13.8 0 004.1 2.1l.8-1.3a8.7 8.7 0 01-1.5-.7l.4-.3a11.7 11.7 0 009 0l.4.3a8.7 8.7 0 01-1.5.7l.8 1.3a13.8 13.8 0 004.1-2.1c.3-3.9-.6-7.3-1.9-10.3zM8.7 12.7c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.8 0 1.5.7 1.5 1.6 0 .9-.7 1.6-1.5 1.6zm6.6 0c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.9 0 1.5.7 1.5 1.6 0 .9-.6 1.6-1.5 1.6z" />
                </svg>
                Join Discord
              </a>
              <Link
                href="/#shop"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-5 py-2 text-xs font-bold text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l3-7H6.4M7 13L5.4 5M7 13l-1.5 3h11M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
                View Services
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
              {t("footer.quickLinks")}
              <span className="mt-1.5 block h-[3px] w-20 rounded-full bg-gradient-to-r from-accent to-transparent" />
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-muted">
              <li><Link href="/#top" className="footer-link">{t("nav.home")}</Link></li>
              <li><Link href="/#shop" className="footer-link">{t("nav.products")}</Link></li>
              <li><Link href="/#services" className="footer-link">{t("nav.features")}</Link></li>
              <li><Link href="/#faq" className="footer-link">{t("nav.faq")}</Link></li>
              <li><Link href="/#vouches" className="footer-link">{t("nav.reviews")}</Link></li>
              <li><Link href="/terms" className="footer-link">{t("nav.terms")}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
              {t("footer.support")}
              <span className="mt-1.5 block h-[3px] w-20 rounded-full bg-gradient-to-r from-accent to-transparent" />
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              <li>
                <a
                  href={SITE.discordInvite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-muted transition-colors hover:text-foreground"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#5865F2]/15">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#5865F2]" fill="currentColor">
                      <path d="M20.3 4.5A18.5 18.5 0 0015.7 3l-.3.6a14 14 0 014.2 1.6 13.6 13.6 0 00-12.2 0A14 14 0 017.6 3.6L7.3 3a18.5 18.5 0 00-4.6 1.5C1 8 .5 11.4.7 14.8a13.8 13.8 0 004.1 2.1l.8-1.3a8.7 8.7 0 01-1.5-.7l.4-.3a11.7 11.7 0 009 0l.4.3a8.7 8.7 0 01-1.5.7l.8 1.3a13.8 13.8 0 004.1-2.1c.3-3.9-.6-7.3-1.9-10.3z" />
                    </svg>
                  </span>
                  Discord
                </a>
              </li>
              <li><Link href="/track" className="flex items-center gap-2.5 text-muted transition-colors hover:text-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-accent" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                {t("nav.trackOrder")}
              </Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
              Contact
              <span className="mt-1.5 block h-[3px] w-20 rounded-full bg-gradient-to-r from-accent to-transparent" />
            </h3>
            <div className="mt-4 flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold text-foreground">24/7 Support</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Reach out to us anytime on Discord. Our team is always available to help.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/40 pt-6 text-xs text-muted">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {new Date().getFullYear()} {SITE.name}. {t("footer.rights")}
            </p>
            <p>{t("footer.tagline")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
