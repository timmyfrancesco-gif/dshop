"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import { CRYPTO_TO_CRYPTO_FEES, PAYPAL_TO_CRYPTO_FEES } from "@/lib/config";

function FeeTable({
  title,
  rows,
  footnote,
}: {
  title: string;
  rows: { range: string; fee: string }[];
  footnote?: string;
}) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted">
            <th className="pb-2 font-medium">Amount</th>
            <th className="pb-2 text-right font-medium">Fee</th>
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
  return (
    <section id="fees" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Transparency"
          title="Clear, predictable fees"
          description="No hidden costs. Here's exactly what you'll pay for every type of transaction."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <FeeTable title="PayPal → Crypto" rows={PAYPAL_TO_CRYPTO_FEES} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <FeeTable title="Crypto → Crypto" rows={CRYPTO_TO_CRYPTO_FEES} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-panel flex flex-col justify-center rounded-2xl p-6 text-center"
          >
            <h3 className="text-lg font-semibold text-foreground">Crypto → PayPal</h3>
            <p className="mt-3 text-3xl font-extrabold text-emerald-400">Free</p>
            <p className="mt-2 text-xs text-muted">No fee on crypto-to-PayPal exchanges.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-panel grid grid-cols-2 gap-4 rounded-2xl p-6 text-center"
          >
            <div className="flex flex-col justify-center">
              <h3 className="text-sm font-semibold text-foreground">Escrow</h3>
              <p className="mt-2 text-2xl font-extrabold text-accent">0.25%</p>
              <p className="mt-1 text-xs text-muted">flat fee per trade</p>
            </div>
            <div className="flex flex-col justify-center border-l border-border/60">
              <h3 className="text-sm font-semibold text-foreground">Middleman</h3>
              <p className="mt-2 text-2xl font-extrabold text-accent">5%</p>
              <p className="mt-1 text-xs text-muted">split between both parties</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
