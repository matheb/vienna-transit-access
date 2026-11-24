// The page languages; each has a URL (/en) and a dictionary in messages.ts.
export const LOCALES = ["en"] as const;
export type Locale = (typeof LOCALES)[number];
// Where / redirects to.
export const DEFAULT_LOCALE: Locale = "en";
// BCP 47 tag for Intl number formatting on the English page.
export const DEFAULT_INTL_LOCALE = "en";

// Narrows a route parameter to a page language.
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
