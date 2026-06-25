import dynamic from "next/dynamic";
import PageShell from "@/components/layout/PageShell";
import { HomepageDataProvider } from "@/lib/contexts/HomepageDataContext";
import { fetchHomepageData } from "@/lib/serverData";
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

export const revalidate = 30;

export default async function Home() {
  const data = await fetchHomepageData();

  return (
    <PageShell>
      <Hero />
      <LiveTicker />
      <HomepageDataProvider
        initialData={{
          stats: data.stats,
          products: data.products,
          feedItems: data.feed?.items ?? [],
          ltc: data.ltc,
          reviews: data.reviews,
          smmProducts: data.smmProducts,
        }}
      >
        <ServicesGrid />
        <LiveDashboard />
        <Shop />
        <SmmShop />
        <Pricing />
        <Fees />
        <Testimonials />
        <Faq />
        <CtaSection />
      </HomepageDataProvider>
    </PageShell>
  );
}
