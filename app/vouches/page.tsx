"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { formatEur } from "@/lib/format";

interface Vouch {
  id: string;
  buyerId: string;
  buyerName: string | null;
  buyerAvatarUrl: string | null;
  sellerId: string;
  sellerName: string | null;
  quantity: number;
  product: string;
  price: number;
  method: string;
  postedAt: string | null;
  createdAt: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function VouchCard({ vouch }: { vouch: Vouch }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-background-elevated/40 p-5">
      {vouch.buyerAvatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={vouch.buyerAvatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
          {(vouch.buyerName ?? "?").charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-semibold text-foreground">{vouch.buyerName ?? "Unknown buyer"}</p>
          <span className="text-xs text-muted">{formatDate(vouch.postedAt ?? vouch.createdAt)}</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          vouched for <span className="font-medium text-foreground">{vouch.sellerName ?? vouch.sellerId}</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-border px-2.5 py-1 text-muted">
            {vouch.quantity}x {vouch.product}
          </span>
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-semibold text-accent">
            {formatEur(vouch.price)} · {vouch.method}
          </span>
        </div>
      </div>
    </div>
  );
}

function VouchesContent() {
  const searchParams = useSearchParams();
  const sellerId = searchParams.get("seller");

  const [vouches, setVouches] = useState<Vouch[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    const url = sellerId ? `/api/vouches?sellerId=${encodeURIComponent(sellerId)}` : "/api/vouches";
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.vouches) setVouches(d.vouches);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  const sellerLabel = vouches[0]?.sellerName ?? sellerId;

  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Vouches</h1>
        <p className="mt-2 text-sm text-muted">
          {sellerId
            ? `Verified purchases vouched for ${sellerLabel ?? "this seller"} in our Discord server.`
            : "Verified purchases vouched for by buyers in our Discord server."}
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {!loaded ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : vouches.length === 0 ? (
            <p className="text-sm text-muted">No vouches yet.</p>
          ) : (
            vouches.map((v) => <VouchCard key={v.id} vouch={v} />)
          )}
        </div>
      </div>
    </section>
  );
}

export default function VouchesPage() {
  return (
    <PageShell>
      <Suspense fallback={<div className="px-4 py-24 text-center text-sm text-muted sm:px-6 lg:px-8">Loading…</div>}>
        <VouchesContent />
      </Suspense>
    </PageShell>
  );
}
