import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import WalletTabs from "@/components/casino/WalletTabs";

export const metadata: Metadata = {
  title: "Wallet — Dshop Casino",
  robots: { index: false, follow: false },
};

export default function WalletPage() {
  return (
    <PageShell>
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <Link href="/casino" className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-accent">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Casino
          </Link>
          <h1 className="mb-6 text-2xl font-black text-foreground">Wallet</h1>
          <WalletTabs />
        </div>
      </section>
    </PageShell>
  );
}
