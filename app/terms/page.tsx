import PageShell from "@/components/layout/PageShell";
import { SITE } from "@/lib/config";

const SECTIONS = [
  {
    title: "1. General",
    body: `By using ${SITE.name} and purchasing products through our Discord bot and website, you agree to the terms outlined on this page. These terms may be updated at any time without prior notice.`,
  },
  {
    title: "2. Orders & Payment",
    body: "All payments are processed in Litecoin (LTC). When you create an order, you'll receive a unique LTC address and an exact amount to send, shown in both EUR and LTC. You must send the exact amount — underpayments or overpayments may delay or invalidate delivery and require staff assistance.",
  },
  {
    title: "3. Delivery",
    body: "Once your payment is confirmed on-chain, your order is automatically marked as paid and your item is delivered both on this site and via a Discord DM from our bot. Delivery times depend on network confirmation times for LTC.",
  },
  {
    title: "4. Stock & Availability",
    body: "Products are added and restocked live through our Discord bot. A product is only shown for purchase while it has stock available. If a product goes out of stock before your payment is confirmed, our staff will contact you to resolve the issue.",
  },
  {
    title: "5. Refunds",
    body: "Due to the nature of digital goods, refunds are only issued in cases of non-delivery or verified errors on our end. Contact staff on our Discord server with your order ID for any payment or delivery issues.",
  },
  {
    title: "6. Escrow & Middleman Services",
    body: `${SITE.name} also offers escrow and middleman services for trades conducted on Discord. These services are governed by the rules of our Discord server and the specific terms agreed upon at the start of each trade.`,
  },
  {
    title: "7. Conduct",
    body: "Any attempt to defraud, chargeback, or abuse our services will result in a permanent ban from our Discord server and forfeiture of any pending orders.",
  },
];

export default function TermsPage() {
  return (
    <PageShell>
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted">Last updated: 2026</p>

          <div className="mt-10 flex flex-col gap-8">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
