import { SITE } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background-elevated/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="max-w-sm">
            <a href="#top" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-casino-from text-sm font-black text-background">
                A
              </span>
              <span>{SITE.name}</span>
            </a>
            <p className="mt-4 text-sm text-muted">
              Crypto escrow, middleman, exchange, advertising and a digital
              shop — all built around our Discord community.
            </p>
          </div>

          <div className="flex flex-wrap gap-12">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
                <li>
                  <a href="#services" className="hover:text-accent">Services</a>
                </li>
                <li>
                  <a href="#dashboard" className="hover:text-accent">Live Dashboard</a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-accent">Advertising</a>
                </li>
                <li>
                  <a href="#fees" className="hover:text-accent">Fees</a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Community</h3>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
                <li>
                  <a
                    href={SITE.discordInvite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent"
                  >
                    Join Discord
                  </a>
                </li>
                <li>
                  <a
                    href={SITE.shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent"
                  >
                    Digital Shop
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/60 pt-6 text-xs text-muted">
          <p>
            <strong className="text-foreground">Disclaimer:</strong> Cryptocurrency
            transactions are irreversible. Always double-check addresses and
            amounts before sending funds, and only deal through verified staff
            and official channels.
          </p>
          <p>
            &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
