"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { SERVICES } from "@/lib/config";
import { handleSpotlight } from "@/lib/spotlight";

export default function ServicesGrid() {
  return (
    <section id="services" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="What we offer"
          title="A full trading suite, built into Discord"
          description="From safe peer-to-peer trades to entertainment, Astro Exchange covers everything you need without ever leaving your server."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              whileHover={{ y: -6 }}
              onMouseMove={handleSpotlight}
              className="group spotlight glass-panel relative rounded-2xl p-6 hover:border-accent/50"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />

              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background/60 text-accent">
                <ServiceIcon name={service.icon} className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {service.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{service.description}</p>

              {service.fee ? (
                <span className="mt-4 inline-flex w-fit items-center rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                  {service.fee}
                </span>
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
