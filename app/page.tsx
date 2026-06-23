import PageShell from "@/components/layout/PageShell";
import Hero from "@/components/sections/Hero";
import LiveTicker from "@/components/sections/LiveTicker";
import ServicesGrid from "@/components/sections/ServicesGrid";
import LiveDashboard from "@/components/sections/LiveDashboard";
import Shop from "@/components/sections/Shop";
import SmmShop from "@/components/sections/SmmShop";
import Pricing from "@/components/sections/Pricing";
import Fees from "@/components/sections/Fees";
import Testimonials from "@/components/sections/Testimonials";
import Faq from "@/components/sections/Faq";
import CtaSection from "@/components/sections/CtaSection";

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
