"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import { TESTIMONIALS } from "@/lib/config";

export default function Testimonials() {
  return (
    <section id="vouches" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Vouches"
          title="Trusted by traders across the community"
          description="A few words from people who've used our services. All identities anonymized for privacy."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.author + i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              className="glass-panel flex flex-col rounded-2xl p-6"
            >
              <div className="mb-3 flex gap-1 text-accent" aria-hidden>
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <svg key={starIndex} viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                    <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.9l-5.2 2.6.99-5.78-4.21-4.1 5.82-.85L10 1.5z" />
                  </svg>
                ))}
              </div>
              <blockquote className="flex-1 text-sm text-foreground">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-xs text-muted">
                <span className="font-semibold text-foreground">{t.author}</span> — {t.role}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
