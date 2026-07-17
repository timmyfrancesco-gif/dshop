"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/hooks/useLocale";
import { CURRENCIES } from "@/lib/i18n";

export default function LocaleSelector() {
  const { currency, setCurrency } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentCurrency = CURRENCIES.find((c) => c.code === currency);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
        aria-label="Change currency"
      >
        <span>{currentCurrency?.code ?? currency}</span>
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-muted" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-background-elevated shadow-2xl shadow-black/40">
          <div className="max-h-72 overflow-y-auto overscroll-contain py-1">
            {CURRENCIES.map((cur) => (
              <button
                key={cur.code}
                type="button"
                onClick={() => {
                  setCurrency(cur.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-background/60 ${
                  currency === cur.code ? "text-accent font-semibold" : "text-foreground"
                }`}
              >
                <span className="w-8 text-xs font-bold text-muted">{cur.symbol}</span>
                <span>{cur.code}</span>
                <span className="ml-1 text-xs text-muted">{cur.name}</span>
                {currency === cur.code && (
                  <svg viewBox="0 0 20 20" className="ml-auto h-4 w-4 shrink-0 text-accent" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
