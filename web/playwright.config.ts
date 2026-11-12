import { defineConfig, devices } from "@playwright/test";

const IS_CI = Boolean(process.env.CI);
const E2E_PORT = 3100; // not 3000, so a running dev server is never reused
const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
const TEST_TIMEOUT_MS = 30_000;
const EXPECT_TIMEOUT_MS = 10_000;
const WEB_SERVER_TIMEOUT_MS = 180_000; // includes `next build`
const CI_RETRIES = 2;

// End-to-end tests run against the production build (`next build` + `next start`), never the dev server.
export default defineConfig({
  testDir: "./e2e",
  timeout: TEST_TIMEOUT_MS,
  expect: { timeout: EXPECT_TIMEOUT_MS },
  forbidOnly: IS_CI,
  retries: IS_CI ? CI_RETRIES : 0,
  workers: IS_CI ? 1 : undefined,
  reporter: IS_CI ? [["list"], ["github"]] : [["list"], ["html", { open: "never" }]],
  use: { baseURL: E2E_BASE_URL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- --port ${E2E_PORT}`,
    url: E2E_BASE_URL,
    reuseExistingServer: false,
    timeout: WEB_SERVER_TIMEOUT_MS,
  },
});
