import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/constants/site";
import { LocaleMessagesProvider } from "@/i18n/LocaleMessagesProvider";
import { LOCALES, isLocale } from "@/i18n/locales";
import { getLocaleMessages } from "@/i18n/messages";
import { geistMono, geistSans } from "../fonts";
import "../globals.css";

const HTML_CLASS_NAME = `${geistSans.variable} ${geistMono.variable} h-full antialiased`;

// Prerender one page per language; other values render on request and get a 404 below.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { messages } = getLocaleMessages(locale);
  return {
    metadataBase: SITE_URL,
    title: messages.RootLayout.title,
    description: messages.RootLayout.description,
    // German joins in PR 3; x-default is the page for visitors with no matching language.
    alternates: { languages: { en: "/en", "x-default": "/en" } },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} className={HTML_CLASS_NAME}>
      <body className="min-h-full flex flex-col">
        <LocaleMessagesProvider locale={locale}>{children}</LocaleMessagesProvider>
      </body>
    </html>
  );
}
