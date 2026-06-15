import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { SITE } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background-elevated/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-sm">
            <Link href="/#top" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <Logo className="h-8 w-8" />
              <span>{SITE.name}</span>
            </Link>
            <p className="mt-4 text-sm text-muted">
              Premium Discord trading marketplace — escrow, middleman, exchange and
              an automated digital shop with instant LTC checkout.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href={SITE.discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join our Discord"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M20.3 4.5A18.5 18.5 0 0015.7 3l-.3.6a14 14 0 014.2 1.6 13.6 13.6 0 00-12.2 0A14 14 0 017.6 3.6L7.3 3a18.5 18.5 0 00-4.6 1.5C1 8 .5 11.4.7 14.8a13.8 13.8 0 004.1 2.1l.8-1.3a8.7 8.7 0 01-1.5-.7l.4-.3a11.7 11.7 0 009 0l.4.3a8.7 8.7 0 01-1.5.7l.8 1.3a13.8 13.8 0 004.1-2.1c.3-3.9-.6-7.3-1.9-10.3zM8.7 12.7c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.8 0 1.5.7 1.5 1.6 0 .9-.7 1.6-1.5 1.6zm6.6 0c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.9 0 1.5.7 1.5 1.6 0 .9-.6 1.6-1.5 1.6z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
              <li><Link href="/#top" className="hover:text-accent">Home</Link></li>
              <li><Link href="/#shop" className="hover:text-accent">Products</Link></li>
              <li><Link href="/#services" className="hover:text-accent">Features</Link></li>
              <li><Link href="/#faq" className="hover:text-accent">FAQ</Link></li>
              <li><Link href="/#vouches" className="hover:text-accent">Reviews</Link></li>
              <li><Link href="/track" className="hover:text-accent">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Support</h3>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
              <li>
                <a href={SITE.discordInvite} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                  Discord Server ↗
                </a>
              </li>
              <li><Link href="/terms" className="hover:text-accent">Terms of Service</Link></li>
              <li><Link href="/#vouches" className="hover:text-accent">Reviews</Link></li>
              <li><Link href="/#dashboard" className="hover:text-accent">Live Dashboard</Link></li>
              <li><Link href="/#fees" className="hover:text-accent">Fees</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Products</h3>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
              <li><Link href="/#shop" className="hover:text-accent">Escrow Services</Link></li>
              <li><Link href="/#shop" className="hover:text-accent">Middleman Passes</Link></li>
              <li><Link href="/#shop" className="hover:text-accent">Advertising Slots</Link></li>
              <li><Link href="/#shop" className="hover:text-accent">Digital Goods</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/60 pt-6 text-xs text-muted">
          <p>
            <strong className="text-foreground">Disclaimer:</strong> Cryptocurrency
            transactions are irreversible. Always double-check addresses and
            amounts before sending funds, and only deal through verified staff
            and official channels.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
            </p>
            <p>Instant delivery · Secure payments · 24/7 support</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
