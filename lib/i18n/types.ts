export type Language = "en" | "it" | "es" | "fr" | "de" | "pt" | "ru" | "zh" | "ja" | "ko" | "ar" | "tr" | "nl" | "pl" | "sv" | "hi" | "th" | "vi" | "id" | "cs";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "CNY" | "KRW" | "RUB" | "BRL" | "INR" | "AUD" | "CAD" | "CHF" | "SEK" | "NOK" | "DKK" | "PLN" | "CZK" | "TRY" | "MXN" | "ARS" | "CLP" | "COP" | "PEN" | "THB" | "VND" | "IDR" | "MYR" | "PHP" | "SGD" | "HKD" | "TWD" | "NZD" | "ZAR" | "AED" | "SAR" | "ILS" | "EGP" | "NGN" | "KES" | "UAH" | "RON" | "HUF" | "BGN" | "HRK" | "ISK";

export interface LanguageInfo {
  code: Language;
  name: string;
  englishName: string;
  flag: string;
}

export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
}
