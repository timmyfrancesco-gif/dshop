import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Details | Astro Exchange",
  description: "View product details, pricing and purchase options on Astro Exchange.",
};

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
