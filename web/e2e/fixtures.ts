import { expect, test as base, type Page } from "@playwright/test";
import { stubCartoRequests } from "./stubs";

interface PageGuardFixtures {
  pageGuards: void;
}

// Prints the page's console errors into the run output without failing, so a WebGL or map problem is visible.
function printConsoleErrors(page: Page) {
  page.on("console", (message) => {
    if (message.type() === "error") console.log(`[page console.error] ${message.text()}`);
  });
}

// Collects uncaught page errors (for example a React crash).
function collectPageErrors(page: Page) {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  return pageErrors;
}

// Runs for every test automatically: CARTO is stubbed, console errors are printed,
// and the test fails afterwards if the page threw an uncaught error.
// The callback is named runTest, not Playwright's usual `use`, so the React hooks lint rule does not mistake it for a hook.
export const test = base.extend<PageGuardFixtures>({
  pageGuards: [
    async ({ page }, runTest) => {
      printConsoleErrors(page);
      const pageErrors = collectPageErrors(page);
      await stubCartoRequests(page);
      await runTest();
      expect(pageErrors, "uncaught page errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
