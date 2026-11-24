import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/constants/site";
import { LocaleMessagesProvider } from "@/i18n/LocaleMessagesProvider";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/i18n/locales";
import { getLocaleMessages } from "@/i18n/messages";
import { geistMono, geistSans } from "../fonts";
import "../globals.css";

const HTML_CLASS_NAME = `${geistSans.variable} ${geistMono.variable} h-full antialiased`;
// hreflang links: one per page language (en, de), then x-default, the page for visitors whose language we do not offer.
const LANGUAGE_ALTERNATES = {
  ...Object.fromEntries(LOCALES.map((locale) => [locale, `/${locale}`])),
  "x-default": `/${DEFAULT_LOCALE}`,
};

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
    alternates: { languages: LANGUAGE_ALTERNATES },
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
