import { test } from "./fixtures";

// TEMPORARY, never commit: proves the automatic fixture fails a test on an uncaught page error.
// This test is expected to FAIL with "uncaught page errors". Delete this file right after one run.
test("TEMPORARY fixture probe: an uncaught page error must fail this test", async ({ page }) => {
  await page.goto("/");
  const pageErrorSeen = page.waitForEvent("pageerror");
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error("fixture probe error");
    });
  });
  await pageErrorSeen;
});
