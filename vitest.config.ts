import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const srcAlias = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": srcAlias,
    },
  },
  test: {
    environment: "node",
    exclude: ["node_modules/**", "dist/**", "tests/e2e/**"],
  },
});
