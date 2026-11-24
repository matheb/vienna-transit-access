import { LOCALES, LOCALE_NAMES } from "@/i18n/locales";
import { useLocale, useMessages } from "@/i18n/MessagesProvider";

// Links to the page in every other language. A plain <a>: switching language loads the other page in full, with its
// own <html lang> and metadata. Each link is named and tagged in its own language.
export default function LanguageSwitch() {
  const messages = useMessages();
  const currentLocale = useLocale();
  const otherLocales = LOCALES.filter((locale) => locale !== currentLocale);
  return (
    <nav aria-label={messages.LanguageSwitch.label} className="flex shrink-0 gap-3 text-sm">
      {otherLocales.map((locale) => (
        <a key={locale} href={`/${locale}`} lang={locale} hrefLang={locale} className="underline underline-offset-2">
          {LOCALE_NAMES[locale]}
        </a>
      ))}
    </nav>
  );
}
