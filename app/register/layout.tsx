import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | Astro Exchange",
  description: "Create your Astro Exchange account.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
