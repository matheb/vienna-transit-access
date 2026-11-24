"use client";
import type { ReactNode } from "react";
import type { Locale } from "./locales";
import { getLocaleMessages } from "./messages";
import { MessagesProvider } from "./MessagesProvider";

interface LocaleMessagesProviderProps {
  locale: Locale;
  children: ReactNode;
}

// Looks up the dictionary in the browser bundle. The server passes only the locale string, so no dictionary is
// written into the server HTML.
export function LocaleMessagesProvider({ locale, children }: LocaleMessagesProviderProps) {
  const { messages, intlLocale } = getLocaleMessages(locale);
  return <MessagesProvider messages={messages} intlLocale={intlLocale} locale={locale}>{children}</MessagesProvider>;
}
