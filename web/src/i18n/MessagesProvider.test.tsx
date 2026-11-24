// @vitest-environment jsdom
import "@/test/setupDom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { messages as englishMessages } from "@/i18n/en";
import { DEFAULT_INTL_LOCALE, DEFAULT_LOCALE } from "@/i18n/locales";
import { MessagesProvider, useIntlLocale, useLocale, useMessages } from "@/i18n/MessagesProvider";
import type { Messages } from "@/i18n/types";

const TEST_TITLE = "Test title";
const TEST_INTL_LOCALE = "de-AT";
const TEST_LOCALE = "de";
const TEST_MESSAGES: Messages = { ...englishMessages, HomePage: { ...englishMessages.HomePage, title: TEST_TITLE } };

// Shows what the hooks return, so the tests can read it from the page.
function MessagesProbe() {
  const messages = useMessages();
  const intlLocale = useIntlLocale();
  const locale = useLocale();
  return <p>{messages.HomePage.title} | {intlLocale} | {locale}</p>;
}

describe("MessagesProvider", () => {
  it("gives the English messages and the default locales without a provider", () => {
    render(<MessagesProbe />);
    expect(screen.getByText(`${englishMessages.HomePage.title} | ${DEFAULT_INTL_LOCALE} | ${DEFAULT_LOCALE}`)).toBeVisible();
  });

  it("gives the provided messages and locales inside a provider", () => {
    render(
      <MessagesProvider messages={TEST_MESSAGES} intlLocale={TEST_INTL_LOCALE} locale={TEST_LOCALE}>
        <MessagesProbe />
      </MessagesProvider>,
    );
    expect(screen.getByText(`${TEST_TITLE} | ${TEST_INTL_LOCALE} | ${TEST_LOCALE}`)).toBeVisible();
  });

  it("is checked by typecheck: messages with missing keys do not satisfy Messages", () => {
    // @ts-expect-error DataAttribution has none of its keys (prefix, link, suffix); if this ever compiles, typecheck fails here.
    const incompleteMessages: Messages = { ...englishMessages, DataAttribution: {} };
    expect(incompleteMessages.DataAttribution).toEqual({});
  });
});
