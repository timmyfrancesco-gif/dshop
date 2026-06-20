"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getTranslation, LANGUAGES } from "@/lib/i18n";
import type { CurrencyCode, Language } from "@/lib/i18n/types";

interface LocaleContextValue {
  language: Language;
  currency: CurrencyCode;
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: CurrencyCode) => void;
  t: (key: string) => string;
  formatPrice: (amountEur: number) => string;
}

export const LocaleContext = createContext<LocaleContextValue>({
  language: "en",
  currency: "USD",
  setLanguage: () => {},
  setCurrency: () => {},
  t: (key) => key,
  formatPrice: (v) => `$${v.toFixed(2)}`,
});

const FALLBACK_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  JPY: 163.5,
  CNY: 7.85,
  KRW: 1420,
  RUB: 97,
  BRL: 5.4,
  INR: 90.5,
  AUD: 1.66,
  CAD: 1.47,
  CHF: 0.97,
  SEK: 11.2,
  NOK: 11.5,
  DKK: 7.46,
  PLN: 4.33,
  CZK: 25.1,
  TRY: 35,
  MXN: 18.5,
  ARS: 950,
  CLP: 960,
  COP: 4200,
  PEN: 3.9,
  THB: 37.5,
  VND: 26500,
  IDR: 16800,
  MYR: 4.85,
  PHP: 60,
  SGD: 1.46,
  HKD: 8.45,
  TWD: 33.5,
  NZD: 1.78,
  ZAR: 19.5,
  AED: 3.97,
  SAR: 4.05,
  ILS: 3.95,
  EGP: 52,
  NGN: 1700,
  KES: 155,
  UAH: 42,
  RON: 4.97,
  HUF: 390,
  BGN: 1.96,
  HRK: 7.53,
  ISK: 150,
};

function smartDecimals(value: number): number {
  if (!value || !isFinite(value)) return 2;
  const abs = Math.abs(value);
  if (abs >= 0.01) return 2;
  return Math.min(8, Math.ceil(-Math.log10(abs)));
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("hm_language") as Language | null;
      const savedCurrency = localStorage.getItem("hm_currency") as CurrencyCode | null;
      if (savedLang && LANGUAGES.some((l) => l.code === savedLang)) {
        setLanguageState(savedLang);
      }
      if (savedCurrency) {
        setCurrencyState(savedCurrency);
      }
    } catch {}
  }, []);

  // Fetch exchange rates
  const fetchRates = useCallback(async () => {
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/EUR");
      if (res.ok) {
        const data = await res.json();
        if (data?.rates) {
          setRates(data.rates);
        }
      }
    } catch {
      // Fallback rates remain in place
    }
  }, []);

  useEffect(() => {
    fetchRates();
    refreshTimer.current = setInterval(fetchRates, 30 * 60 * 1000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [fetchRates]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("hm_language", lang);
    } catch {}
  }, []);

  const setCurrency = useCallback((cur: CurrencyCode) => {
    setCurrencyState(cur);
    try {
      localStorage.setItem("hm_currency", cur);
    } catch {}
  }, []);

  const t = useCallback(
    (key: string): string => getTranslation(language, key),
    [language],
  );

  const formatPrice = useCallback(
    (amountEur: number): string => {
      if (amountEur === undefined || amountEur === null || !isFinite(amountEur)) return "$0.00";
      const rate = rates[currency] ?? 1;
      const converted = amountEur * rate;
      const digits = smartDecimals(converted);
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }).format(converted);
      } catch {
        return `${converted.toFixed(digits)} ${currency}`;
      }
    },
    [currency, rates],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ language, currency, setLanguage, setCurrency, t, formatPrice }),
    [language, currency, setLanguage, setCurrency, t, formatPrice],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}
