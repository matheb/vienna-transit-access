import { messages as germanMessages } from "./de";
import { messages as englishMessages } from "./en";
import { DEFAULT_INTL_LOCALE, type Locale } from "./locales";
import type { Messages } from "./types";

interface LocaleMessages {
  messages: Messages;
  intlLocale: string;
}

// The dictionary and Intl locale of each page language. Not a client module: the server layout reads the title and
// description from it, and LocaleMessagesProvider reads the dictionary in the browser.
const MESSAGES_BY_LOCALE = {
  en: { messages: englishMessages, intlLocale: DEFAULT_INTL_LOCALE },
  de: { messages: germanMessages, intlLocale: "de-AT" },
} satisfies Record<Locale, LocaleMessages>;

export function getLocaleMessages(locale: Locale): LocaleMessages {
  return MESSAGES_BY_LOCALE[locale];
}
