"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ProductPurchaseModal from "@/components/modals/ProductPurchaseModal";
import SectionHeading from "@/components/ui/SectionHeading";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { formatPrice } from "@/lib/format";
import { handleSpotlight } from "@/lib/spotlight";
import { useProducts } from "@/lib/hooks/useProducts";
import type { Product } from "@/lib/types";

export default function Shop() {
  const { products, loading } = useProducts();
  const [selected, setSelected] = useState<Product | null>(null);
  const [modalKey, setModalKey] = useState(0);

  return (
    <section id="shop" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Digital Shop"
          title="Browse what's in stock right now"
          description="Synced live from our shop — new products show up here as soon as they're listed."
        />

        {products.length > 0 ? (
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => {
              // SellAuth reports -1 (or omits the field) for unlimited-stock
              // products, so only a value of exactly 0 means "out of stock".
              const hasStockInfo = product.stock !== undefined && product.stock >= 0;
              const outOfStock = hasStockInfo && product.stock === 0;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                  whileHover={{ y: -6 }}
                  onMouseMove={handleSpotlight}
                  className="spotlight group glass-panel flex flex-col rounded-2xl p-6 hover:border-accent/50"
                >
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-32 w-full rounded-xl border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background/60 text-accent">
                      <ServiceIcon name="shop" className="h-6 w-6" />
                    </div>
                  )}

                  <h3 className="mt-5 text-lg font-semibold text-foreground">{product.name}</h3>
                  {product.description ? (
                    <p className="mt-2 text-sm text-muted">{product.description}</p>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-accent">
                      {formatPrice(product.price, product.currency)}
                    </span>
                    {hasStockInfo ? (
                      <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted">
                        {outOfStock ? "Out of stock" : `${product.stock} in stock`}
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    disabled={outOfStock}
                    onClick={() => {
                      setSelected(product);
                      setModalKey((k) => k + 1);
                    }}
                    className="btn-gradient mt-5 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  >
                    {outOfStock ? "Out of stock" : "Buy Now"}
                  </button>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="mt-14 glass-panel flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl p-6 text-center text-muted">
            <p className="text-sm">{loading ? "Loading products…" : "Coming soon."}</p>
            <p className="text-xs">
              New products will appear here automatically as soon as they&apos;re listed in the shop.
            </p>
          </div>
        )}
      </div>

      <ProductPurchaseModal
        key={modalKey}
        open={selected !== null}
        onClose={() => setSelected(null)}
        product={selected}
      />
    </section>
  );
}
