"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { casino, type WalletView } from "@/lib/casino/client";
import { useAuth } from "@/lib/hooks/useAuth";
import DepositWallet from "./DepositWallet";
import Withdraw from "./Withdraw";

export default function WalletTabs() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [wallets, setWallets] = useState<WalletView[] | null>(null);

  useEffect(() => {
    if (!user) return;
    casino.wallets().then((r) => setWallets(r.wallets)).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-8 text-center">
        <p className="text-sm text-muted">Sign in to manage funds.</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-background">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2 rounded-full border border-border bg-background-elevated/40 p-1">
        <button
          type="button"
          onClick={() => setTab("deposit")}
          className={`rounded-full py-2 text-sm font-semibold transition-colors ${tab === "deposit" ? "bg-accent text-background" : "text-muted hover:text-foreground"}`}
        >
          Deposit
        </button>
        <button
          type="button"
          onClick={() => setTab("withdraw")}
          className={`rounded-full py-2 text-sm font-semibold transition-colors ${tab === "withdraw" ? "bg-accent text-background" : "text-muted hover:text-foreground"}`}
        >
          Withdraw
        </button>
      </div>

      {tab === "deposit" ? <DepositWallet wallets={wallets} /> : <Withdraw wallets={wallets} />}
    </div>
  );
}
