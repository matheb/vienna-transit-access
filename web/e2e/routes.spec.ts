import {
  LOCALE_PATHS, NOT_FOUND_STATUS, PAGE_LANGUAGES, SITE_URL, TEMPORARY_REDIRECT_STATUS, UNSUPPORTED_LOCALE_PATH,
} from "./constants";
import { expect, test } from "./fixtures";

// The page language is part of the URL: / sends visitors to /en, each language has its page, and a language we do not
// offer has no page.

// The alternates every page lists: each language, plus x-default for visitors with no matching language.
const EXPECTED_ALTERNATES = [
  ["en", `${SITE_URL}${LOCALE_PATHS.en}`],
  ["de", `${SITE_URL}${LOCALE_PATHS.de}`],
  ["x-default", `${SITE_URL}${LOCALE_PATHS.en}`],
];

test(`GET / answers ${TEMPORARY_REDIRECT_STATUS} with location ${LOCALE_PATHS.en}`, async ({ request }) => {
  const response = await request.get("/", { maxRedirects: 0 });
  expect(response.status(), "status of /").toBe(TEMPORARY_REDIRECT_STATUS);
  expect(response.headers()["location"], "location of /").toBe(LOCALE_PATHS.en);
});

test(`opening / ends on ${LOCALE_PATHS.en}`, async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(new RegExp(`${LOCALE_PATHS.en}$`));
});

for (const language of PAGE_LANGUAGES) {
  const path = LOCALE_PATHS[language];

  test(`${path} answers 200 and sets html lang "${language}"`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok(), `status ${response?.status()} of ${path}`).toBe(true);
    expect(await page.evaluate(() => document.documentElement.lang), "html lang").toBe(language);
  });

  test(`${path} lists the language alternates (hreflang)`, async ({ page }) => {
    await page.goto(path);
    // Links in <head> have no role, so this is the one place that needs a CSS selector (an agreed exception to the e2e rules).
    const alternates = await page.evaluate(() =>
      Array.from(document.head.querySelectorAll('link[rel="alternate"][hreflang]'), (link) => [
        link.getAttribute("hreflang"),
        link.getAttribute("href"),
      ]),
    );
    expect(alternates, `hreflang alternates on ${path}`).toEqual(EXPECTED_ALTERNATES);
  });
}

test(`a language we do not offer (${UNSUPPORTED_LOCALE_PATH}) answers ${NOT_FOUND_STATUS}`, async ({ request }) => {
  const response = await request.get(UNSUPPORTED_LOCALE_PATH);
  expect(response.status(), `status of ${UNSUPPORTED_LOCALE_PATH}`).toBe(NOT_FOUND_STATUS);
});
