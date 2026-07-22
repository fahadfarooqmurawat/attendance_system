import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["**/*.d.ts", "packages/db/src/generated/**"],
      include: [
        "apps/dashboard/src/**/*.{ts,tsx}",
        "apps/device-gateway/src/**/*.ts",
        "apps/worker/src/**/*.ts",
        "packages/attendance-core/src/**/*.ts",
        "packages/db/src/**/*.ts",
        "packages/shared/src/**/*.ts"
      ],
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      reportsDirectory: "coverage",
      thresholds: {
        branches: 45,
        functions: 50,
        lines: 45,
        statements: 45
      }
    },
    projects: [
      "apps/dashboard/vitest.config.ts",
      "apps/device-gateway/vitest.config.ts",
      "apps/worker/vitest.config.ts",
      "packages/attendance-core/vitest.config.ts",
      "packages/db/vitest.config.ts",
      "packages/shared/vitest.config.ts"
    ]
  }
});
