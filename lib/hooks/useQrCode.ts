"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function useQrCode(value: string | null): string | null {
  const [result, setResult] = useState<{ value: string; dataUrl: string } | null>(null);

  useEffect(() => {
    if (!value) return;

    let cancelled = false;

    QRCode.toDataURL(value, {
      width: 240,
      margin: 1,
      color: { dark: "#05070d", light: "#e8edf5" },
    })
      .then((dataUrl) => {
        if (!cancelled) setResult({ value, dataUrl });
      })
      .catch(() => {
        if (!cancelled) setResult(null);
      });

    return () => {
      cancelled = true;
    };
  }, [value]);

  return result?.value === value ? result.dataUrl : null;
}
