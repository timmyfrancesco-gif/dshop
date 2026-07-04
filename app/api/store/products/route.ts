import { NextResponse } from "next/server";
import { listProducts } from "@/lib/store/inventory";
import { serverError } from "@/lib/http";

// Public catalog: active products with live stock counts (no deliverable items).
export async function GET() {
  try {
    const products = await listProducts(true);
    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        currency: p.currency,
        image: p.image,
        category: p.category,
        stock: p.stock,
        totalSold: p.totalSold,
        inStock: p.stock > 0,
      })),
    });
  } catch (e) {
    return serverError("store/products", e);
  }
}
