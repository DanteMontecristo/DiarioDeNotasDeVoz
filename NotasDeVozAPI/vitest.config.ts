import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["app/**/*.ts", "lib/**/*.ts"],
      exclude: ["**/*.test.ts"],
      // Bajar estos umbrales hace fallar `npm run check`.
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
