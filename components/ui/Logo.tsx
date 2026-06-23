"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

const DEFAULT_LOGO =
  "https://cdn.discordapp.com/attachments/1514647638945824778/1518297378870788136/preview-removebg-preview.png";
const STOREFRONT_CONFIG_KEY = "hm_storefront_config";

export default function Logo({ className }: { className?: string }) {
  const [src, setSrc] = useState(DEFAULT_LOGO);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STOREFRONT_CONFIG_KEY);
      if (raw) {
        const config = JSON.parse(raw);
        if (config.logoUrl) setSrc(config.logoUrl);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return <img src={src} alt="Heaven Market" className={className} />;
}
