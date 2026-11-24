import { LOCALE_PATHS, PAGE_LANGUAGES, TEXT } from "./constants";
import { expect, test } from "./fixtures";
import { getOtherLanguageLink } from "./homePage";

// The switch is a plain link to the other language's page, inside a <nav> named for it, and the first Tab stop.
for (const language of PAGE_LANGUAGES) {
  const texts = TEXT[language];

  test.describe(language, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(LOCALE_PATHS[language]);
    });

    test(`the first Tab stop is the "${texts.otherLanguageLinkName}" link in the "${texts.languageNavName}" navigation`, async ({ page }) => {
      await page.keyboard.press("Tab");
      const link = getOtherLanguageLink(page, texts);
      await expect(link).toBeFocused();
      await expect(link).toHaveAttribute("lang", texts.otherLanguageCode);
      await expect(link).toHaveAttribute("hreflang", texts.otherLanguageCode);
      await expect(link).toHaveAttribute("href", texts.otherLanguagePath);
    });

    test(`Enter on the switch opens ${texts.otherLanguagePath} with html lang "${texts.otherLanguageCode}"`, async ({ page }) => {
      await page.keyboard.press("Tab");
      await expect(getOtherLanguageLink(page, texts)).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`${texts.otherLanguagePath}$`));
      expect(await page.evaluate(() => document.documentElement.lang), "html lang after switching").toBe(texts.otherLanguageCode);
    });
  });
}
