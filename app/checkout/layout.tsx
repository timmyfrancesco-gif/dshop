import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | Astro Exchange",
  description: "Complete your purchase securely with instant LTC checkout on Astro Exchange.",
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
