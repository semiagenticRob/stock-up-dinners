import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // Only run tests under tests/ and lib/. Anything in _legacy/ is
    // reference material and intentionally excluded.
    include: ["tests/unit/**/*.test.ts", "lib/**/*.test.ts"],
    exclude: ["_legacy/**", "node_modules/**", ".next/**", "tests/e2e/**"],
    environment: "happy-dom",
  },
  resolve: {
    alias: {
      "@": root,
    },
  },
});
