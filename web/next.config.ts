import type { NextConfig } from "next";
import { DEFAULT_LOCALE } from "./src/i18n/locales";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Temporary (307), so language detection can replace it later.
  async redirects() {
    return [{ source: "/", destination: `/${DEFAULT_LOCALE}`, permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
