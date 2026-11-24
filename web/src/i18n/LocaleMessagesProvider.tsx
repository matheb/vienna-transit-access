"use client";
import type { ReactNode } from "react";
import { messages as englishMessages } from "./en";
import { DEFAULT_INTL_LOCALE } from "./locales";
import { MessagesProvider } from "./MessagesProvider";
import type { Messages } from "./types";

// The dictionary and Intl locale for each page language, looked up here in the browser bundle.
// The server passes only the locale string, so no dictionary is written into the server HTML.
const MESSAGES_BY_LOCALE = {
  en: { messages: englishMessages, intlLocale: DEFAULT_INTL_LOCALE },
} satisfies Record<string, { messages: Messages; intlLocale: string }>;

export type Locale = keyof typeof MESSAGES_BY_LOCALE;

interface LocaleMessagesProviderProps {
  locale: Locale;
  children: ReactNode;
}

export function LocaleMessagesProvider({ locale, children }: LocaleMessagesProviderProps) {
  const { messages, intlLocale } = MESSAGES_BY_LOCALE[locale];
  return <MessagesProvider messages={messages} intlLocale={intlLocale}>{children}</MessagesProvider>;
}
