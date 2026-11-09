import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  oxc: { jsx: { runtime: "automatic" } },
  // Node by default; component tests opt in to jsdom with a `// @vitest-environment jsdom` first line.
  test: { environment: "node", include: ["src/**/*.test.{ts,tsx}"] },
});
