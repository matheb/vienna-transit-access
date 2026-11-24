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
        { selector: "JSXText[value=/[A-Za-z]/]", message: "Put user-facing text in src/i18n/." },
        { selector: "JSXAttribute[name.name=/^(alt|aria-label|label|placeholder|title|unit)$/] > Literal", message: "Put user-facing text in src/i18n/." },
        { selector: "CallExpression[callee.property.name='toFixed']", message: "Format numbers with getFormattedNumber() from src/lib/format.ts." },
      ],
    },
  },
  {
    // Components and pages read text through the hook, so the page language decides it; layout.tsx may import en.ts.
    files: ["src/components/**/*.{ts,tsx}", "src/app/**/page.tsx"],
    ignores: ["src/components/ui/**", "**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/i18n/en", "@/i18n/de", "**/i18n/en", "**/i18n/de"],
          message: "Read text through useMessages() from src/i18n/MessagesProvider.",
        }],
      }],
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
