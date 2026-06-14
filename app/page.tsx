import AnimatedBackground from "@/components/ui/AnimatedBackground";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import LiveTicker from "@/components/sections/LiveTicker";
import ServicesGrid from "@/components/sections/ServicesGrid";
import LiveDashboard from "@/components/sections/LiveDashboard";
import Shop from "@/components/sections/Shop";
import Pricing from "@/components/sections/Pricing";
import Fees from "@/components/sections/Fees";
import Testimonials from "@/components/sections/Testimonials";
import CtaSection from "@/components/sections/CtaSection";

export default function Home() {
  return (
    <>
      <AnimatedBackground />
      <Header />
      <main className="flex-1">
        <Hero />
        <LiveTicker />
        <ServicesGrid />
        <LiveDashboard />
        <Shop />
        <Pricing />
        <Fees />
        <Testimonials />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
