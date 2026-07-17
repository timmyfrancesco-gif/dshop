"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import { SITE } from "@/lib/config";
import { useLocale } from "@/lib/hooks/useLocale";

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

interface TosEntry {
  html: string;
  updatedAt: string | null;
  authorName: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
}

type TosData = Record<"general" | "owner1" | "owner2", TosEntry>;

const TOS_LABELS: Record<keyof TosData, string> = {
  general: "General Server Rules",
  owner1: "Owner 1's Terms",
  owner2: "Owner 2's Terms",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function TosCategoryCard({ categoryKey, entry }: { categoryKey: keyof TosData; entry: TosEntry | undefined }) {
  const hasAuthor = Boolean(entry?.authorName || entry?.avatarUrl);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background-elevated/40">
      {hasAuthor && (
        <div className="relative">
          {entry?.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.bannerUrl} alt="" className="block w-full" />
          ) : (
            <div
              className="h-20 w-full sm:h-24"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--casino-from))" }}
            />
          )}
          {entry?.avatarUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={entry.avatarUrl}
              alt=""
              className="absolute left-4 -bottom-6 h-14 w-14 rounded-full border-4 border-background-elevated object-cover sm:left-6"
            />
          )}
        </div>
      )}

      <div className={`p-6 ${hasAuthor ? "pt-9 sm:pl-8" : ""}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">{TOS_LABELS[categoryKey]}</h3>
            {entry?.authorName && <p className="text-xs text-muted">Set by {entry.authorName}</p>}
          </div>
          {entry?.updatedAt && (
            <span className="text-xs text-muted">Updated {formatDate(entry.updatedAt)}</span>
          )}
        </div>
        <div className="mt-3">
          {entry?.html ? (
            <div className="discord-content" dangerouslySetInnerHTML={{ __html: entry.html }} />
          ) : (
            <p className="text-sm text-muted">Not set yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const KNOWN_OWNER_ORDER = ["narix.v9", "on.justme"];

function OwnerTosCard({
  name,
  entry,
  onClick,
}: {
  name: string;
  entry: TosEntry | undefined;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative h-72 w-full overflow-hidden rounded-2xl border border-border text-left sm:h-80"
    >
      {entry?.bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.bannerUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
        />
      ) : (
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-110"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--casino-from))" }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

      {entry?.avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.avatarUrl}
          alt=""
          className="absolute left-1/2 top-[58%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-background object-cover shadow-xl transition-transform duration-300 ease-out group-hover:scale-110 sm:h-28 sm:w-28"
        />
      )}

      <div className="absolute inset-x-0 bottom-0 p-5 text-center">
        <p className="text-lg font-bold text-white drop-shadow">{name}</p>
        <p className="mt-0.5 text-xs text-white/70">{entry?.html ? "View terms" : "Not set yet"}</p>
      </div>
    </button>
  );
}

function ServerRulesSection() {
  const [tos, setTos] = useState<TosData | null>(null);
  const [selected, setSelected] = useState<"owner1" | "owner2" | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tos")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.tos) setTos(d.tos);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // The bot maps narix.v9/on.justme to owner1/owner2 -- match by name so the
  // display order (narix left, on.justme right) doesn't depend on which
  // slot the bot happened to assign. Falls back to owner1/owner2 order
  // before either has ever set their terms.
  const owners: { key: "owner1" | "owner2"; name: string; entry: TosEntry | undefined }[] = (
    [
      { key: "owner1", name: tos?.owner1?.authorName || "Owner 1", entry: tos?.owner1 },
      { key: "owner2", name: tos?.owner2?.authorName || "Owner 2", entry: tos?.owner2 },
    ] as const
  ).slice().sort((a, b) => {
    const ai = KNOWN_OWNER_ORDER.indexOf(a.name);
    const bi = KNOWN_OWNER_ORDER.indexOf(b.name);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const selectedOwner = owners.find((o) => o.key === selected);

  return (
    <div className="mt-16">
      {selectedOwner ? (
        <>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 010 1.06L9.06 10l3.73 3.71a.75.75 0 11-1.06 1.06l-4.25-4.24a.75.75 0 010-1.06l4.25-4.24a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <TosCategoryCard categoryKey={selectedOwner.key} entry={selectedOwner.entry} />
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-foreground">Select a TOS to view</h2>
          <p className="mt-2 text-sm text-muted">
            Each server owner sets their own terms directly on Discord — pick one to read it.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {owners.map((o) => (
              <OwnerTosCard key={o.key} name={o.name} entry={o.entry} onClick={() => setSelected(o.key)} />
            ))}
          </div>

          <div className="mt-10">
            <TosCategoryCard categoryKey="general" entry={tos?.general} />
          </div>
        </>
      )}
    </div>
  );
}

export default function TermsPage() {
  const { t } = useLocale();
  return (
    <PageShell>
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{t("terms.title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("terms.lastUpdated")}</p>

          <div className="mt-10 flex flex-col gap-8">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{section.body}</p>
              </div>
            ))}
          </div>

          <ServerRulesSection />
        </div>
      </section>
    </PageShell>
  );
}
