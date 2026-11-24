// The page languages; each has a URL (/en) and a dictionary in messages.ts.
export const LOCALES = ["en", "de"] as const;
export type Locale = (typeof LOCALES)[number];
// Where / redirects to.
export const DEFAULT_LOCALE: Locale = "en";
// BCP 47 tag for Intl number formatting on the English page.
export const DEFAULT_INTL_LOCALE = "en";
// Each language's name in that language, shown in the language switch. Not translated, so not in the dictionaries.
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", de: "Deutsch" };

// Narrows a route parameter to a page language.
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
