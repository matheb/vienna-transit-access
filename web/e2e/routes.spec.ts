import {
  ENGLISH_PATH, NOT_FOUND_STATUS, SITE_URL, TEMPORARY_REDIRECT_STATUS, UNSUPPORTED_LOCALE_PATH,
} from "./constants";
import { expect, test } from "./fixtures";

// The page language is part of the URL: / sends visitors to /en, and a language we do not offer has no page.

test(`GET / answers ${TEMPORARY_REDIRECT_STATUS} with location ${ENGLISH_PATH}`, async ({ request }) => {
  const response = await request.get("/", { maxRedirects: 0 });
  expect(response.status(), "status of /").toBe(TEMPORARY_REDIRECT_STATUS);
  expect(response.headers()["location"], "location of /").toBe(ENGLISH_PATH);
});

test(`opening / ends on ${ENGLISH_PATH}`, async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(new RegExp(`${ENGLISH_PATH}$`));
});

test(`${ENGLISH_PATH} answers 200 and sets html lang "en"`, async ({ page }) => {
  const response = await page.goto(ENGLISH_PATH);
  expect(response?.ok(), `status ${response?.status()} of ${ENGLISH_PATH}`).toBe(true);
  expect(await page.evaluate(() => document.documentElement.lang), "html lang").toBe("en");
});

test(`${ENGLISH_PATH} lists its language alternates (hreflang)`, async ({ page }) => {
  await page.goto(ENGLISH_PATH);
  // Links in <head> have no role, so this is the one place that needs a CSS selector (an agreed exception to the e2e rules).
  const alternates = await page.evaluate(() =>
    Array.from(document.head.querySelectorAll('link[rel="alternate"][hreflang]'), (link) => [
      link.getAttribute("hreflang"),
      link.getAttribute("href"),
    ]),
  );
  expect(alternates, "hreflang alternates").toEqual([
    ["en", `${SITE_URL}${ENGLISH_PATH}`],
    ["x-default", `${SITE_URL}${ENGLISH_PATH}`],
  ]);
});

test(`a language we do not offer (${UNSUPPORTED_LOCALE_PATH}) answers ${NOT_FOUND_STATUS}`, async ({ request }) => {
  const response = await request.get(UNSUPPORTED_LOCALE_PATH);
  expect(response.status(), `status of ${UNSUPPORTED_LOCALE_PATH}`).toBe(NOT_FOUND_STATUS);
});
