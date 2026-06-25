import dynamic from "next/dynamic";
import PageShell from "@/components/layout/PageShell";
import Hero from "@/components/sections/Hero";
import LiveTicker from "@/components/sections/LiveTicker";
import ServicesGrid from "@/components/sections/ServicesGrid";
import LiveDashboard from "@/components/sections/LiveDashboard";
import Shop from "@/components/sections/Shop";

const SmmShop = dynamic(() => import("@/components/sections/SmmShop"));
const Pricing = dynamic(() => import("@/components/sections/Pricing"));
const Fees = dynamic(() => import("@/components/sections/Fees"));
const Testimonials = dynamic(() => import("@/components/sections/Testimonials"));
const Faq = dynamic(() => import("@/components/sections/Faq"));
const CtaSection = dynamic(() => import("@/components/sections/CtaSection"));

export default function Home() {
  return (
    <PageShell>
      <Hero />
      <LiveTicker />
      <ServicesGrid />
      <LiveDashboard />
      <Shop />
      <SmmShop />
      <Pricing />
      <Fees />
      <Testimonials />
      <Faq />
      <CtaSection />
    </PageShell>
  );
}
