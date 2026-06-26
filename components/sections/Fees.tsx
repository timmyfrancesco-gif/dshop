"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import { CRYPTO_TO_CRYPTO_FEES, PAYPAL_TO_CRYPTO_FEES } from "@/lib/config";
import { useLocale } from "@/lib/hooks/useLocale";

function FeeTable({
  title,
  rows,
  footnote,
  amountLabel,
  feeLabel,
  index,
}: {
  title: string;
  rows: { range: string; fee: string }[];
  footnote?: string;
  amountLabel: string;
  feeLabel: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group gradient-border overflow-hidden rounded-2xl bg-[color-mix(in_srgb,var(--background-elevated)_80%,transparent)] p-7"
    >
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <table className="mt-5 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted">
            <th className="pb-3 font-medium">{amountLabel}</th>
            <th className="pb-3 text-right font-medium">{feeLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <motion.tr
              key={row.range}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.3 + ri * 0.05 }}
              className="border-t border-border/40 transition-colors hover:bg-accent/5"
            >
              <td className="py-3 text-foreground">{row.range}</td>
              <td className="py-3 text-right font-bold text-accent">{row.fee}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      {footnote ? <p className="mt-4 text-xs text-muted">{footnote}</p> : null}
    </motion.div>
  );
}

export default function Fees() {
  const { t } = useLocale();

  return (
    <section id="fees" className="section-glow relative px-4 py-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t("fees.eyebrow")}
          title={t("fees.title")}
          description={t("fees.description")}
        />

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FeeTable
            title={t("fees.paypalToCrypto")}
            rows={PAYPAL_TO_CRYPTO_FEES}
            amountLabel={t("fees.amount")}
            feeLabel={t("fees.fee")}
            index={0}
          />

          <FeeTable
            title={t("fees.cryptoToCrypto")}
            rows={CRYPTO_TO_CRYPTO_FEES}
            amountLabel={t("fees.amount")}
            feeLabel={t("fees.fee")}
            index={1}
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-emerald-500/50 via-emerald-400/30 to-emerald-500/50"
          >
            <div className="flex w-full flex-1 flex-col items-center justify-center rounded-[calc(1rem-1px)] bg-background p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("fees.cryptoToPaypal")}</h3>
              <motion.p
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4, type: "spring" }}
                className="mt-3 text-4xl font-black text-emerald-400"
              >
                {t("fees.free")}
              </motion.p>
              <p className="mt-2 text-sm text-muted">{t("fees.noFee")}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="gradient-border grid grid-cols-2 gap-0 overflow-hidden rounded-2xl bg-[color-mix(in_srgb,var(--background-elevated)_80%,transparent)]"
          >
            <div className="flex flex-col items-center justify-center p-8">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-foreground">{t("fees.escrow")}</h3>
              <p className="mt-2 text-3xl font-black text-gradient-accent">0.25%</p>
              <p className="mt-1 text-xs text-muted">{t("fees.flatFee")}</p>
            </div>
            <div className="flex flex-col items-center justify-center border-l border-border/40 p-8">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-casino-from/10 text-casino-from">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l2.5 2.5L16 9m-9 3l-3.5 3.5a2 2 0 102.83 2.83L9.5 15M16 9l3.5-3.5a2 2 0 10-2.83-2.83L13 6" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-foreground">{t("fees.middleman")}</h3>
              <p className="mt-2 text-3xl font-black text-gradient-casino">5%</p>
              <p className="mt-1 text-xs text-muted">{t("fees.splitFee")}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
