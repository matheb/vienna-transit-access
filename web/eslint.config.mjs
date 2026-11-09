import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/app/**/*.tsx", "src/components/**/*.tsx"],
    ignores: ["src/components/ui/**", "**/*.test.tsx"],
    rules: {
      "no-restricted-syntax": ["error",
        { selector: "JSXText[value=/[A-Za-z]/]", message: "Put user-facing text in src/i18n/en.ts." },
        { selector: "JSXAttribute[name.name=/^(alt|aria-label|label|placeholder|title|unit)$/] > Literal", message: "Put user-facing text in src/i18n/en.ts." },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Copied MapLibre worker (generated)
    "public/maplibre/**",
  ]),
]);

export default eslintConfig;
