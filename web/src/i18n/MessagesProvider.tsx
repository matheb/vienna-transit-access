"use client";
import { createContext, useContext, type ReactNode } from "react";
import { messages as englishMessages } from "./en";
import { DEFAULT_INTL_LOCALE, DEFAULT_LOCALE, type Locale } from "./locales";
import type { Messages } from "./types";

interface MessagesContextValue {
  messages: Messages;
  intlLocale: string;
  locale: Locale;
}

// Without a provider (a unit test that renders one component) the page is English.
const MessagesContext = createContext<MessagesContextValue>({
  messages: englishMessages, intlLocale: DEFAULT_INTL_LOCALE, locale: DEFAULT_LOCALE,
});

interface MessagesProviderProps extends MessagesContextValue {
  children: ReactNode;
}

export function MessagesProvider({ messages, intlLocale, locale, children }: MessagesProviderProps) {
  return <MessagesContext value={{ messages, intlLocale, locale }}>{children}</MessagesContext>;
}

export function useMessages(): Messages {
  return useContext(MessagesContext).messages;
}

export function useIntlLocale(): string {
  return useContext(MessagesContext).intlLocale;
}

// The page language (from the route, passed in by LocaleMessagesProvider).
export function useLocale(): Locale {
  return useContext(MessagesContext).locale;
}
