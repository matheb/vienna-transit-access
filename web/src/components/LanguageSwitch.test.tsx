// @vitest-environment jsdom
import "@/test/setupDom";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LanguageSwitch from "@/components/LanguageSwitch";
import { LocaleMessagesProvider } from "@/i18n/LocaleMessagesProvider";
import { LOCALES, type Locale } from "@/i18n/locales";

// Expected texts are literals, so a changed name or label fails the test.
const EXPECTED_SWITCHES = [
  { locale: "en", navName: "Language", linkName: "Deutsch", otherLocale: "de" },
  { locale: "de", navName: "Sprache", linkName: "English", otherLocale: "en" },
] as const;

function renderSwitch(locale: Locale) {
  render(
    <LocaleMessagesProvider locale={locale}>
      <LanguageSwitch />
    </LocaleMessagesProvider>,
  );
}

describe("LanguageSwitch", () => {
  it.each(EXPECTED_SWITCHES)(
    "on the $locale page, links to $otherLocale inside the navigation named $navName",
    ({ locale, navName, linkName, otherLocale }) => {
      renderSwitch(locale);
      const link = within(screen.getByRole("navigation", { name: navName })).getByRole("link", { name: linkName });
      expect(link).toHaveAttribute("href", `/${otherLocale}`);
      expect(link).toHaveAttribute("lang", otherLocale);
      expect(link).toHaveAttribute("hreflang", otherLocale);
    },
  );

  it.each(LOCALES)("on the %s page, does not link to itself", (locale) => {
    renderSwitch(locale);
    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("href", `/${locale}`);
      expect(link).not.toHaveAttribute("lang", locale);
    }
  });
});
