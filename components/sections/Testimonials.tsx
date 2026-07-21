"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import { formatRelativeTime } from "@/lib/format";
import { useLocale } from "@/lib/hooks/useLocale";
import { useHomepageData } from "@/lib/contexts/HomepageDataContext";
import type { Review } from "@/lib/types";

export default function Testimonials() {
  const { t } = useLocale();
  const { reviews: reviewsRes } = useHomepageData();
  const [liveReviews, setLiveReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (reviewsRes?.reviews) setLiveReviews(reviewsRes.reviews);
  }, [reviewsRes]);

  if (liveReviews.length === 0) return null;

  return (
    <section id="vouches" className="section-glow relative px-4 py-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={t("reviews.eyebrow")}
          title={t("reviews.title")}
          description={t("reviews.description")}
        />

        <div className="mt-16 columns-1 gap-6 sm:columns-2 lg:columns-4">
          {liveReviews.map((review, i) => (
            <motion.figure
              key={review.orderId}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 break-inside-avoid group shine-card gradient-border relative overflow-hidden rounded-2xl bg-[color-mix(in_srgb,var(--background-elevated)_80%,transparent)] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_-16px_var(--accent)]"
            >
              <span className="shine-sweep" aria-hidden />
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute -right-2 -top-2 h-16 w-16 text-accent/[0.06]"
                fill="currentColor"
                aria-hidden
              >
                <path d="M7.17 6C4.87 8.06 3.5 10.6 3.5 13.4c0 3.35 2.31 5.6 5.05 5.6a4.1 4.1 0 004.2-4.12c0-2.26-1.6-3.9-3.7-3.9-.4 0-.77.05-.9.1.35-2.14 2.16-4.28 4.26-5.55L7.17 6zm10 0c-2.3 2.06-3.67 4.6-3.67 7.4 0 3.35 2.31 5.6 5.05 5.6a4.1 4.1 0 004.2-4.12c0-2.26-1.6-3.9-3.7-3.9-.4 0-.77.05-.9.1.35-2.14 2.16-4.28 4.26-5.55L17.17 6z" />
              </svg>
              <div className="relative mb-3 flex gap-1" aria-hidden>
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <motion.svg
                    key={starIndex}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3 + starIndex * 0.06, type: "spring", stiffness: 300 }}
                    viewBox="0 0 20 20"
                    className={`h-4 w-4 ${starIndex < review.rating ? "text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.4)]" : "text-border"}`}
                    fill="currentColor"
                  >
                    <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.9l-5.2 2.6.99-5.78-4.21-4.1 5.82-.85L10 1.5z" />
                  </motion.svg>
                ))}
              </div>
              {review.comment ? (
                <blockquote className="text-sm leading-relaxed text-foreground">
                  &ldquo;{review.comment}&rdquo;
                </blockquote>
              ) : (
                <blockquote className="text-sm italic text-muted">
                  {review.rating >= 4 ? t("reviews.greatExperience") : t("reviews.leftRating")}
                </blockquote>
              )}
              <figcaption className="mt-4 flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted">
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                    ✓
                  </span>
                  <span className="font-semibold text-foreground">{t("reviews.verifiedBuyer")}</span>
                </span>
                {review.createdAt && (
                  <span>{formatRelativeTime(new Date(review.createdAt).getTime())}</span>
                )}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
