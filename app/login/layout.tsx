import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Astro Exchange",
  description: "Sign in to your Astro Exchange account.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
