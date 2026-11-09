import type { Metadata } from "next";
import { messages } from "@/i18n/en";
import { geistMono, geistSans } from "./fonts";
import "./globals.css";

const HTML_CLASS_NAME = `${geistSans.variable} ${geistMono.variable} h-full antialiased`;

export const metadata: Metadata = {
  title: messages.RootLayout.title,
  description: messages.RootLayout.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={HTML_CLASS_NAME}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
