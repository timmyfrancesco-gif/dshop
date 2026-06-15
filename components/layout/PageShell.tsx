import type { ReactNode } from "react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import ScrollProgress from "@/components/ui/ScrollProgress";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AnimatedBackground />
      <ScrollProgress />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
