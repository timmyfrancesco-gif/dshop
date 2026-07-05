import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { listProducts } from "@/lib/store/inventory";

export const metadata: Metadata = {
  title: "Store — Dshop",
};

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const products = (await listProducts(true)).filter((p) => p.active);

  return (
    <PageShell>
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-black text-foreground">Store</h1>
          <p className="mt-1 text-sm text-muted">Digital products, delivered instantly after payment.</p>

          {products.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-border bg-background-elevated/40 p-10 text-center text-sm text-muted">
              No products available yet.
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <Link
                  key={p.id}
                  href={`/store/${p.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background-elevated/40 transition-transform hover:-translate-y-1"
                >
                  <div className="flex aspect-video items-center justify-center bg-background/60">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl">📦</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted">{p.category}</span>
                    <h2 className="font-bold text-foreground">{p.name}</h2>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-lg font-bold text-accent">€{p.price.toFixed(2)}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.stock > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                        {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
