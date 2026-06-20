import type { Language } from "./types";
import en from "./translations/en";
import it from "./translations/it";
import es from "./translations/es";
import fr from "./translations/fr";
import de from "./translations/de";
import pt from "./translations/pt";
import ru from "./translations/ru";
import zh from "./translations/zh";
import ja from "./translations/ja";
import ko from "./translations/ko";
import ar from "./translations/ar";
import tr from "./translations/tr";
import nl from "./translations/nl";
import pl from "./translations/pl";
import sv from "./translations/sv";
import hi from "./translations/hi";
import th from "./translations/th";
import vi from "./translations/vi";
import id from "./translations/id";
import cs from "./translations/cs";

export { LANGUAGES } from "./languages";
export { CURRENCIES } from "./currencies";
export type { Language, CurrencyCode, LanguageInfo, CurrencyInfo } from "./types";

const translations: Record<Language, Record<string, string>> = {
  en,
  it,
  es,
  fr,
  de,
  pt,
  ru,
  zh,
  ja,
  ko,
  ar,
  tr,
  nl,
  pl,
  sv,
  hi,
  th,
  vi,
  id,
  cs,
};

export function getTranslation(lang: Language, key: string): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}
