"use client";
import { createContext, useContext, type ReactNode } from "react";
import { messages as englishMessages } from "./en";
import { DEFAULT_INTL_LOCALE } from "./locales";
import type { Messages } from "./types";

interface MessagesContextValue {
  messages: Messages;
  intlLocale: string;
}

// Without a provider (a unit test that renders one component) the text is English.
const MessagesContext = createContext<MessagesContextValue>({ messages: englishMessages, intlLocale: DEFAULT_INTL_LOCALE });

interface MessagesProviderProps extends MessagesContextValue {
  children: ReactNode;
}

export function MessagesProvider({ messages, intlLocale, children }: MessagesProviderProps) {
  return <MessagesContext value={{ messages, intlLocale }}>{children}</MessagesContext>;
}

export function useMessages(): Messages {
  return useContext(MessagesContext).messages;
}

export function useIntlLocale(): string {
  return useContext(MessagesContext).intlLocale;
}
