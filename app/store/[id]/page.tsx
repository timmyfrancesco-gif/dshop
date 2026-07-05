import { notFound } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { listProducts } from "@/lib/store/inventory";
import StoreCheckout from "./StoreCheckout";

export const dynamic = "force-dynamic";

export default async function StoreProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const products = await listProducts(true);
  const product = products.find((p) => p.id === id && p.active);
  if (!product) return notFound();

  return (
    <PageShell>
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <StoreCheckout
            product={{
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              image: product.image,
              stock: product.stock,
            }}
          />
        </div>
      </section>
    </PageShell>
  );
}
