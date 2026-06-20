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
}: {
  title: string;
  rows: { range: string; fee: string }[];
  footnote?: string;
  amountLabel: string;
  feeLabel: string;
}) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted">
            <th className="pb-2 font-medium">{amountLabel}</th>
            <th className="pb-2 text-right font-medium">{feeLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.range} className="border-t border-border/60">
              <td className="py-2.5 text-foreground">{row.range}</td>
              <td className="py-2.5 text-right font-semibold text-accent">{row.fee}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {footnote ? <p className="mt-3 text-xs text-muted">{footnote}</p> : null}
    </div>
  );
}

export default function Fees() {
  const { t } = useLocale();

  return (
    <section id="fees" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t("fees.eyebrow")}
          title={t("fees.title")}
          description={t("fees.description")}
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <FeeTable
              title={t("fees.paypalToCrypto")}
              rows={PAYPAL_TO_CRYPTO_FEES}
              amountLabel={t("fees.amount")}
              feeLabel={t("fees.fee")}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <FeeTable
              title={t("fees.cryptoToCrypto")}
              rows={CRYPTO_TO_CRYPTO_FEES}
              amountLabel={t("fees.amount")}
              feeLabel={t("fees.fee")}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-panel flex flex-col justify-center rounded-2xl p-6 text-center"
          >
            <h3 className="text-lg font-semibold text-foreground">{t("fees.cryptoToPaypal")}</h3>
            <p className="mt-3 text-3xl font-extrabold text-emerald-400">{t("fees.free")}</p>
            <p className="mt-2 text-xs text-muted">{t("fees.noFee")}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-panel grid grid-cols-2 gap-4 rounded-2xl p-6 text-center"
          >
            <div className="flex flex-col justify-center">
              <h3 className="text-sm font-semibold text-foreground">{t("fees.escrow")}</h3>
              <p className="mt-2 text-2xl font-extrabold text-accent">0.25%</p>
              <p className="mt-1 text-xs text-muted">{t("fees.flatFee")}</p>
            </div>
            <div className="flex flex-col justify-center border-l border-border/60">
              <h3 className="text-sm font-semibold text-foreground">{t("fees.middleman")}</h3>
              <p className="mt-2 text-2xl font-extrabold text-accent">5%</p>
              <p className="mt-1 text-xs text-muted">{t("fees.splitFee")}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
