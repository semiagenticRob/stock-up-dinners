import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Reference-only material that intentionally doesn't compile/lint:
    "_legacy/**",
    // Stray on-disk artifacts from the v1 RN setup (also gitignored):
    ".expo/**",
    // One-off conversion script — not part of the live runtime:
    "scripts/extract-seed-to-content.mjs",
  ]),
]);

export default eslintConfig;
