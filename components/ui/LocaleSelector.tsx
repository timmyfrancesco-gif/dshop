"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/hooks/useLocale";
import { LANGUAGES, CURRENCIES } from "@/lib/i18n";

export default function LocaleSelector() {
  const { language, currency, setLanguage, setCurrency, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"language" | "currency">("language");
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language);
  const currentCurrency = CURRENCIES.find((c) => c.code === currency);

  // Close on outside click
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
        aria-label="Change language and currency"
      >
        <span>{currentLang?.flag}</span>
        <span className="hidden sm:inline">{currentCurrency?.code ?? currency}</span>
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-muted" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-background-elevated shadow-2xl shadow-black/40">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setTab("language")}
              className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-widest transition-colors ${
                tab === "language"
                  ? "border-b-2 border-accent text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t("locale.language")}
            </button>
            <button
              type="button"
              onClick={() => setTab("currency")}
              className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-widest transition-colors ${
                tab === "currency"
                  ? "border-b-2 border-accent text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t("locale.currency")}
            </button>
          </div>

          {/* Content */}
          <div className="max-h-72 overflow-y-auto overscroll-contain">
            {tab === "language" ? (
              <div className="flex flex-col py-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      setOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-background/60 ${
                      language === lang.code
                        ? "text-accent font-semibold"
                        : "text-foreground"
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.name}</span>
                    {language === lang.code && (
                      <svg viewBox="0 0 20 20" className="ml-auto h-4 w-4 text-accent" fill="currentColor" aria-hidden>
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col py-1">
                {CURRENCIES.map((cur) => (
                  <button
                    key={cur.code}
                    type="button"
                    onClick={() => {
                      setCurrency(cur.code);
                      setOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-background/60 ${
                      currency === cur.code
                        ? "text-accent font-semibold"
                        : "text-foreground"
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
